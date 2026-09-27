import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  HelpCircle,
  Volume2,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Activity,
  Heart,
  Save,
} from 'lucide-react';
import { SurvivorProfile, TriageAnalysisResult, TriageTier } from '../../types/assessment';
import { SRQ20_QUESTIONS } from '../../data/srq20Questions';
import { FUNCTIONAL_IMPAIRMENT_ITEMS } from '../../data/pfaProtocol';
import { evaluateSRQ20, matchSRQ20Keywords, calculateTriage } from '../../services/triageEngine';
import {
  isSpeechRecognitionSupported,
  isMicrophoneSupported,
  requestMicrophoneStream,
  stopMediaStream,
  startLiveSpeechRecognition,
  SpeechSession,
} from '../../services/speechRecognition';
import { useAssessment } from '../../context/AssessmentContext';
import { Screen4EmergencyAlert } from './Screen4EmergencyAlert';

interface SRQ20InterviewWizardProps {
  survivor: SurvivorProfile;
  onComplete: (result: TriageAnalysisResult) => void;
  onBack: () => void;
}

export const SRQ20InterviewWizard: React.FC<SRQ20InterviewWizardProps> = ({
  survivor,
  onComplete,
  onBack,
}) => {
  const { addAssessment } = useAssessment();

  const [wizardStep, setWizardStep] = useState<'interview' | 'functional' | 'result'>('interview');
  const [interviewMode, setInterviewMode] = useState<'verbal' | 'non_verbal'>('verbal');
  const [showItem17Alert, setShowItem17Alert] = useState<boolean>(false);

  // Answer state: Map of question id to boolean (true = Ya, false = Tidak)
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [functionalAnswers, setFunctionalAnswers] = useState<string[]>([]);
  const [expandedTooltipId, setExpandedTooltipId] = useState<number | null>(null);

  // STT state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveInterim, setLiveInterim] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [newlyDetectedIds, setNewlyDetectedIds] = useState<number[]>([]);

  // Triage outcome
  const [analysisResult, setAnalysisResult] = useState<TriageAnalysisResult | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeSessionRef = useRef<SpeechSession | null>(null);
  const capturedTextRef = useRef<string>('');

  const isBrowserSTTAvailable = isSpeechRecognitionSupported() && isMicrophoneSupported();

  useEffect(() => {
    return () => {
      cleanupAudioSession();
    };
  }, []);

  const cleanupAudioSession = () => {
    if (activeSessionRef.current) {
      activeSessionRef.current.stop();
      activeSessionRef.current = null;
    }
    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = null;
    }
    setIsRecording(false);
  };

  const handleStartSTT = async () => {
    cleanupAudioSession();
    setLiveInterim('');
    capturedTextRef.current = '';
    setNewlyDetectedIds([]);

    if (!isBrowserSTTAvailable) {
      alert('Mikrofon Speech-to-Text tidak didukung di browser ini.');
      return;
    }

    try {
      const stream = await requestMicrophoneStream();
      activeStreamRef.current = stream;

      const session = startLiveSpeechRecognition(stream, {
        language: 'id-ID',
        onInterim: (interim) => {
          setLiveInterim(interim);
          const detected = matchSRQ20Keywords(interim);
          if (detected.length > 0) {
            setNewlyDetectedIds(detected);
            // Auto-check detected questions (Human in the loop: volunteer can still uncheck)
            setAnswers((prev) => {
              const updated = { ...prev };
              detected.forEach((id) => {
                updated[id] = true;
              });
              return updated;
            });
          }
        },
        onFinal: (finalText) => {
          capturedTextRef.current = finalText;
          setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
          const detected = matchSRQ20Keywords(finalText);
          if (detected.length > 0) {
            setAnswers((prev) => {
              const updated = { ...prev };
              detected.forEach((id) => {
                updated[id] = true;
              });
              return updated;
            });
          }
        },
      });

      activeSessionRef.current = session;
      setIsRecording(true);
    } catch {
      alert('Izin mikrofon diperlukan untuk merekam suara wawancara.');
    }
  };

  const handleStopSTT = () => {
    cleanupAudioSession();
  };

  const handleAnswerToggle = (id: number, val: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: val,
    }));

    // SECTION 9 ATURAN: Jika Item #17 = YA -> T0 Emergency. Jangan menunggu perhitungan skor akhir!
    if (id === 17 && val === true) {
      const now = new Date();
      const timeHours = String(now.getHours()).padStart(2, '0');
      const timeMins = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${timeHours}:${timeMins}`;

      addAssessment({
        id: survivor.id,
        nik: survivor.nik,
        timestamp: timeString,
        location: survivor.posko,
        method: interviewMode === 'verbal' ? 'VERBAL' : 'CHECKLIST',
        phase: 'followup_srq20',
        zone: 'RED',
        triageTier: 'T0',
        t0Status: 'T0-Suspect',
        score: 1,
        indicators: ['SRQ-20 Butir #17: Pikiran mengakhiri hidup / bunuh diri (Ideasi Suisida)'],
        criticalTriggered: true,
        victimName: survivor.name,
        victimAge: survivor.age,
        victimGender: survivor.gender,
        victimCategory: survivor.category,
        recommendedAction:
          'T0 EMERGENCY (SRQ #17): Terdeteksi pikiran mengakhiri hidup. Sinyal T0-Suspect aktif. Dampingi penyintas 100% tanpa jeda dan siagakan panggilan Tele-Emergency nakes.',
        volunteerNotes: `SRQ-20 Butir #17 dijawab YA oleh penyintas di ${survivor.posko}. Otomatis masuk status T0-Suspect.`,
      });

      setShowItem17Alert(true);
    }
  };

  const toggleFunctional = (id: string) => {
    setFunctionalAnswers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const answeredYesIds = Object.entries(answers)
    .filter(([_, val]) => val === true)
    .map(([id]) => Number(id));

  const totalScore = answeredYesIds.length;
  const isQuestion17Yes = answers[17] === true;

  const handleProceedToFunctional = () => {
    setWizardStep('functional');
  };

  const handleCalculateTriage = () => {
    const result = evaluateSRQ20(answeredYesIds, functionalAnswers, false);
    setAnalysisResult(result);

    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');

    // Save to central assessments
    addAssessment({
      id: survivor.id,
      nik: survivor.nik,
      timestamp: `${timeHours}:${timeMins}`,
      location: survivor.posko,
      method: interviewMode === 'verbal' ? 'VERBAL' : 'CHECKLIST',
      phase: 'followup_srq20',
      zone: result.zone,
      triageTier: result.triageTier,
      t0Status: result.triageTier === 'T0' ? 'T0-Suspect' : undefined,
      score: totalScore,
      indicators: result.indicators,
      criticalTriggered: result.criticalTriggered,
      transcript: transcript || undefined,
      srq20YesList: answeredYesIds,
      functionalSelections: functionalAnswers,
      recommendedAction: result.recommendedAction,
      volunteerNotes: `Wawancara SRQ-20 (${interviewMode}). Skor: ${totalScore}/20. Tier: ${result.triageTier}.`,
      victimName: survivor.name,
      victimAge: survivor.age,
      victimGender: survivor.gender,
      victimCategory: survivor.category,
    });

    setWizardStep('result');
    onComplete(result);
  };

  const renderTierBadge = (tier: TriageTier) => {
    switch (tier) {
      case 'T0':
        return (
          <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-wider animate-pulse">
            🚨 T0 — EMERGENCY
          </span>
        );
      case 'T1':
        return (
          <span className="px-3 py-1 rounded-xl bg-red-100 text-red-800 font-bold text-xs uppercase border border-red-300">
            🔴 T1 — HIGH RISK
          </span>
        );
      case 'T2':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs uppercase border border-amber-300">
            🟡 T2 — MODERATE RISK
          </span>
        );
      case 'T3':
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs uppercase border border-emerald-300">
            🟢 T3 — LOW RISK
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in">
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
            Menu Wawancara SRQ-20 (Hari 4–30)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Penapisan Distres Psikologis Terstruktur (WHO SRQ-20)
          </h2>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
            <span className="font-mono font-bold text-slate-800">{survivor.id}</span>
            <span>·</span>
            <span>{survivor.name} ({survivor.age} th)</span>
            <span>·</span>
            <span>{survivor.posko}</span>
          </div>
        </div>

        {wizardStep === 'interview' && (
          <button
            type="button"
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STEP 1: WAWANCARA 20 PERTANYAAN */}
      {wizardStep === 'interview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Dual-Path Mode Switcher: Verbal vs Non-Verbal (Mutisme) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Jalur Wawancara:</span>
              <span className="text-[11px] text-slate-500">
                Pilih mode verbal (dengan suara) atau non-verbal jika korban mengalami mutisme/syok berat.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setInterviewMode('verbal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  interviewMode === 'verbal'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Verbal (STT)</span>
              </button>

              <button
                type="button"
                onClick={() => setInterviewMode('non_verbal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  interviewMode === 'non_verbal'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Non-Verbal</span>
              </button>
            </div>
          </div>

          {/* Speech-to-Text Bar for Verbal Mode */}
          {interviewMode === 'verbal' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-950 block">
                      Feature Speech-to-Text & Auto-Checklist
                    </span>
                    <span className="text-[10px] text-blue-700">
                      Mendeteksi kata kunci keluhan korban & menandai otomatis (kontrol penuh tetap di tangan relawan)
                    </span>
                  </div>
                </div>

                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartSTT}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Mulai Rekam</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopSTT}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition animate-pulse shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop Rekaman</span>
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="p-2.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 italic">
                  {liveInterim ? `"${liveInterim}"` : 'Mendengarkan ucapan penyintas...'}
                </div>
              )}

              {transcript && (
                <div className="p-2 bg-white/80 border border-blue-200 rounded-xl text-[11px] text-slate-700">
                  <strong className="text-blue-900 block text-[10px] uppercase font-bold">Transkrip Suara:</strong>
                  "{transcript}"
                </div>
              )}
            </div>
          )}

          {/* Red Flag Warning Alert if Q17 is Yes */}
          {isQuestion17Yes && (
            <div className="p-3 bg-red-50 border-2 border-red-600 rounded-2xl flex items-center gap-3 text-red-950 animate-in fade-in">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <span className="font-extrabold text-xs block text-red-900">
                  PERINGATAN KRITIS: Butir #17 (Pikiran Mengakhiri Hidup) Bernilai YA
                </span>
                <span className="text-[11px] text-red-800 block">
                  Kasus ini otomatis dialihkan ke kategori <strong>T0 (Emergency)</strong>. Siagakan PSC 119 dan dampingi penyintas terus-menerus.
                </span>
              </div>
            </div>
          )}

          {/* Score Counter */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-bold text-slate-700">
              Daftar 20 Pertanyaan Terstandar WHO SRQ-20
            </span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Skor 'Ya': {totalScore} / 20
            </span>
          </div>

          {/* List of 20 SRQ Questions */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {SRQ20_QUESTIONS.map((q) => {
              const currentVal = answers[q.id];
              const isExpanded = expandedTooltipId === q.id;

              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-2xl border transition ${
                    q.isRedFlag && currentVal === true
                      ? 'bg-red-50 border-red-500'
                      : currentVal === true
                      ? 'bg-blue-50/70 border-blue-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                        {q.id}
                      </span>
                      <div className="min-w-0">
                        <span className={`text-xs block ${currentVal === true ? 'font-bold text-slate-900' : 'text-slate-800'}`}>
                          {q.text}
                          {q.isRedFlag && (
                            <span className="ml-1 text-[10px] text-red-600 font-bold uppercase">
                              (🚨 Red Flag)
                            </span>
                          )}
                        </span>

                        {/* Guided Tooltip for Volunteer */}
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedTooltipId(isExpanded ? null : q.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>{isExpanded ? 'Sembunyikan Panduan' : 'Panduan Edukasi Relawan'}</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 leading-relaxed animate-in fade-in">
                              <strong>Instruksi Relawan:</strong> {q.volunteerInstruction}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Human-in-the-Loop Yes/No Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAnswerToggle(q.id, false)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition ${
                          currentVal === false
                            ? 'bg-slate-700 border-slate-700 text-white'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        Tidak
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswerToggle(q.id, true)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                          currentVal === true
                            ? q.isRedFlag
                              ? 'bg-red-600 border-red-600 text-white'
                              : 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Ya
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action to proceed to Screen 6 */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Total Skor Sementara: <strong className="text-slate-900">{totalScore}</strong>
            </span>

            <button
              type="button"
              onClick={handleProceedToFunctional}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <span>Lanjut ke Penilaian Fungsi Harian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PENILAIAN FAKTOR RISIKO & FUNGSI HARIAN */}
      {wizardStep === 'functional' && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Penilaian Faktor Risiko & Keberfungsian Hidup Harian
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              Evaluasi Hendaya Keberfungsian Harian Penyintas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Beri tanda centang jika distres emosional telah mengganggu kemampuan bertahan hidup mandiri di posko.
            </p>
          </div>

          <div className="space-y-2">
            {FUNCTIONAL_IMPAIRMENT_ITEMS.map((item) => {
              const isChecked = functionalAnswers.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleFunctional(item.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-start justify-between gap-3 transition ${
                    isChecked
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs">{item.label}</span>
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-amber-600 border-amber-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setWizardStep('interview')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Soal SRQ</span>
            </button>

            <button
              type="button"
              onClick={handleCalculateTriage}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lihat Hasil Asesmen Triase</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: HASIL ASESMEN OTOMATIS & INTEGRASI DATABASE */}
      {wizardStep === 'result' && analysisResult && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Hasil Asesmen Triase Terpadu
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Klasifikasi Tingkat Risiko Kesehatan Mental
            </h3>
          </div>

          {/* Tier Highlight Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {renderTierBadge(analysisResult.triageTier)}
                <span className="text-xs text-slate-500 font-mono">
                  Skor: {analysisResult.score} / 20
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {analysisResult.explanation}
              </p>
            </div>
          </div>

          {/* Recommended Action Protocol */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider block">
              Protokol Intervensi Tindak Lanjut:
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">
              {analysisResult.recommendedAction}
            </p>
          </div>

          {/* Detected Risk Factors */}
          {analysisResult.indicators.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Faktor Gejala Positif ({analysisResult.indicators.length}):
              </span>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                {analysisResult.indicators.map((ind, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                  >
                    ✓ {ind}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Database Integration Success Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              [DATA TERKIRIM & INTEGRASI DATABASE]: Rekam medis tersimpan ke Database Longitudinal berbasis NIK & terhubung ke Dashboard BPBD/Dinkes.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <span>Selesai & Kembali ke Homescreen</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 7 & 9: SCREEN 4 EMERGENCY MODAL FOR ITEM #17 (IDEASI SUISIDA) */}
      {showItem17Alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <Screen4EmergencyAlert
              survivorId={survivor.id}
              survivorName={survivor.name}
              survivorAge={survivor.age}
              survivorGender={survivor.gender}
              posko={survivor.posko}
              timestamp={new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              emergencyReasons={[
                'SRQ-20 Butir #17: Apakah Anda mempunyai pikiran untuk mengakhiri hidup Anda? (JAWABAN: YA)',
                'Sesuai protokol keselamatan RAPID-MIND, terdeteksinya pikiran mengakhiri hidup seketika mengunci status pasien ke T0-SUSPECT tanpa menunggu perhitungan skor akhir.',
              ]}
              volunteerNotes="Penyintas mengonfirmasi adanya pikiran untuk mengakhiri hidup pada saat penapisan SRQ-20."
              onClose={() => setShowItem17Alert(false)}
              onGoToHospitalPortal={() => {
                setShowItem17Alert(false);
                window.location.hash = '/hospital';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
