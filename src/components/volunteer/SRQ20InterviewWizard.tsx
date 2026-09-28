import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  HelpCircle,
  Volume2,
  Check,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  Info,
  AlertCircle,
} from 'lucide-react';
import { SurvivorProfile, TriageAnalysisResult, TriageTier } from '../../types/assessment';
import { SRQ20_QUESTIONS, SRQ20_ONBOARDING_SCRIPT } from '../../data/srq20Questions';
import { RISK_FACTOR_ITEMS, FUNCTIONAL_DOMAINS } from '../../data/riskAndFunctionalAssessment';
import {
  evaluateIntegratedAssessment,
  matchSRQ20Keywords,
} from '../../services/triageEngine';
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
  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);

  // SRQ-20 Answers: map of question id to boolean (true = Ya, false = Tidak)
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [expandedTooltipId, setExpandedTooltipId] = useState<number | null>(null);

  // Bagian A: Checklist Faktor Risiko (R1-R5, Bobot: 2, 2, 1, 2, 1)
  const [selectedRiskFactors, setSelectedRiskFactors] = useState<string[]>([]);

  // Bagian B: Checklist Penilaian Fungsi Harian (F1, F2, F3: 0, 1, 3 point)
  const [functionalScores, setFunctionalScores] = useState<Record<string, number>>({
    F1: 0,
    F2: 0,
    F3: 0,
  });

  // Speech-to-Text State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [liveInterim, setLiveInterim] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');

  // Triage Analysis Result
  const [analysisResult, setAnalysisResult] = useState<TriageAnalysisResult | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeSessionRef = useRef<SpeechSession | null>(null);
  const capturedTextRef = useRef<string>('');
  const baseTranscriptRef = useRef<string>('');

  const isBrowserSTTAvailable = isSpeechRecognitionSupported() && isMicrophoneSupported();

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

  useEffect(() => {
    return () => {
      cleanupAudioSession();
    };
  }, []);

  const handleStartSTT = async () => {
    cleanupAudioSession();
    setLiveInterim('');
    capturedTextRef.current = '';
    baseTranscriptRef.current = transcript.trim();

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
          const fullInterim = baseTranscriptRef.current
            ? `${baseTranscriptRef.current} ${interim.trim()}`
            : interim.trim();
          const detected = matchSRQ20Keywords(fullInterim);
          if (detected.length > 0) {
            // Auto-check detected questions (Human in the loop: volunteer can still override)
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
          const fullFinal = baseTranscriptRef.current
            ? `${baseTranscriptRef.current} ${finalText.trim()}`
            : finalText.trim();
          setTranscript(fullFinal);
          const detected = matchSRQ20Keywords(fullFinal);
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
    setLiveInterim('');
  };

  const handleAnswerToggle = (id: number, val: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: val,
    }));

    // CRITICAL SAFETY GATE: Jika Item #17 = YA -> T0 Emergency Override!
    if (id === 17 && val === true) {
      const now = new Date();
      const timeHours = String(now.getHours()).padStart(2, '0');
      const timeMins = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${timeHours}:${timeMins}`;

      const res = addAssessment({
        recordId: activeSessionRecordId || undefined,
        id: survivor.id,
        victimId: survivor.id,
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
          'T0 EMERGENCY (RED FLAG OVERRIDE): Terdeteksi pikiran mengakhiri hidup (Butir #17). Sinyal T0-Suspect aktif. Dampingi penyintas 100% tanpa jeda dan siagakan panggilan Tele-Emergency nakes.',
        volunteerNotes: `SRQ-20 Butir #17 dijawab YA oleh penyintas di ${survivor.posko}. Sistem langsung mengunci ke status T0-Suspect (Bypassing Score Engine).`,
      });

      if (res?.record?.recordId) {
        setActiveSessionRecordId(res.record.recordId);
      }

      setShowItem17Alert(true);
    }
  };

  // Toggle Risk Factors (Bagian A)
  const toggleRiskFactor = (rfId: string) => {
    setSelectedRiskFactors((prev) =>
      prev.includes(rfId) ? prev.filter((id) => id !== rfId) : [...prev, rfId]
    );
  };

  // Select Functional Impairment Option (Bagian B)
  const setFunctionalOption = (domainId: string, points: number) => {
    setFunctionalScores((prev) => ({
      ...prev,
      [domainId]: points,
    }));
  };

  // Validation state: melarang lanjut ke Screen 6 jika masih ada soal yang kosong
  const [validationAttempted, setValidationAttempted] = useState<boolean>(false);

  const answeredYesIds = Object.entries(answers)
    .filter(([, val]) => val === true)
    .map(([id]) => Number(id));

  const totalSRQScore = answeredYesIds.length;
  const isQuestion17Yes = answers[17] === true;

  // Track completeness of 20 questions
  const answeredQuestionsCount = SRQ20_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const isAllSRQAnswered = answeredQuestionsCount === SRQ20_QUESTIONS.length;
  const unansweredQuestions = SRQ20_QUESTIONS.filter(
    (q) => answers[q.id] === undefined
  );
  const unansweredQuestionIds = unansweredQuestions.map((q) => q.id);

  // Helper untuk menandai sisa butir yang belum terisi dengan "Tidak"
  const handleFillRemainingAsNo = () => {
    setAnswers((prev) => {
      const updated = { ...prev };
      SRQ20_QUESTIONS.forEach((q) => {
        if (updated[q.id] === undefined) {
          updated[q.id] = false;
        }
      });
      return updated;
    });
    setValidationAttempted(false);
  };

  // Calculate live subscores
  const riskFactorScoreTotal = selectedRiskFactors.reduce((acc, rfId) => {
    const item = RISK_FACTOR_ITEMS.find((r) => r.id === rfId);
    return acc + (item ? item.points : 0);
  }, 0);

  const functionalScoreTotal = Object.values(functionalScores).reduce(
    (acc, pts) => acc + (pts || 0),
    0
  );

  const liveIntegratedScore = totalSRQScore + riskFactorScoreTotal + functionalScoreTotal;

  const handleProceedToFunctional = () => {
    if (!isAllSRQAnswered) {
      setValidationAttempted(true);
      // Auto-scroll ke butir pertanyaan pertama yang masih kosong
      const firstMissingId = unansweredQuestionIds[0];
      if (firstMissingId) {
        const el = document.getElementById(`srq-question-${firstMissingId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    setValidationAttempted(false);
    setWizardStep('functional');
  };

  const handleCalculateTriage = () => {
    const result = evaluateIntegratedAssessment(
      answeredYesIds,
      selectedRiskFactors,
      functionalScores,
      false
    );
    setAnalysisResult(result);

    const now = new Date();
    const timeHours = String(now.getHours()).padStart(2, '0');
    const timeMins = String(now.getMinutes()).padStart(2, '0');

    // Save assessment record to central database
    const saveRes = addAssessment({
      recordId: activeSessionRecordId || undefined,
      id: survivor.id,
      victimId: survivor.id,
      nik: survivor.nik,
      timestamp: `${timeHours}:${timeMins}`,
      location: survivor.posko,
      method: interviewMode === 'verbal' ? 'VERBAL' : 'CHECKLIST',
      phase: 'followup_srq20',
      zone: result.zone,
      triageTier: result.triageTier,
      t0Status: result.triageTier === 'T0' ? 'T0-Suspect' : undefined,
      score: totalSRQScore,
      riskFactorSelections: selectedRiskFactors,
      riskFactorScore: riskFactorScoreTotal,
      functionalScores,
      functionalScoreTotal,
      totalIntegratedScore: result.totalIntegratedScore,
      statusTitle: result.statusTitle,
      indicators: result.indicators,
      criticalTriggered: result.criticalTriggered,
      transcript: transcript || undefined,
      srq20YesList: answeredYesIds,
      recommendedAction: result.recommendedAction,
      volunteerNotes: `Wawancara SRQ-20 (${interviewMode.toUpperCase()}). Skor Total Terintegrasi: ${result.totalIntegratedScore}/37 (SRQ: ${totalSRQScore}, Risiko: ${riskFactorScoreTotal}, Fungsi: ${functionalScoreTotal}). Tier: ${result.triageTier} - ${result.statusTitle}.`,
      victimName: survivor.name,
      victimAge: survivor.age,
      victimGender: survivor.gender,
      victimCategory: survivor.category,
    });

    if (saveRes?.record?.recordId) {
      setActiveSessionRecordId(saveRes.record.recordId);
    }

    setWizardStep('result');
    onComplete(result);
  };

  const renderTierBadge = (tier: TriageTier) => {
    switch (tier) {
      case 'T0':
        return (
          <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-xs">
            <span>🚨 T0 — EMERGENCY</span>
          </span>
        );
      case 'T1':
        return (
          <span className="px-3 py-1 rounded-xl bg-red-100 text-red-800 font-bold text-xs uppercase border border-red-300 flex items-center gap-1.5">
            <span>🔴 T1 — HIGH RISK</span>
          </span>
        );
      case 'T2':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs uppercase border border-amber-300 flex items-center gap-1.5">
            <span>🟡 T2 — MODERATE RISK</span>
          </span>
        );
      case 'T3':
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs uppercase border border-emerald-300 flex items-center gap-1.5">
            <span>🟢 T3 — LOW RISK</span>
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
            Screen 5: Menu Wawancara SRQ-20 (Hari 4–30)
          </span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Penapisan Terstruktur SRQ-20 & Modul Faktor Risiko / Fungsi
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
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition min-h-[44px]"
            title="Kembali ke Homescreen"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* STEP 1: WAWANCARA 20 PERTANYAAN (SCREEN 5) */}
      {wizardStep === 'interview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Dual-Path Mode Switcher: Verbal vs Non-Verbal (Adaptive Assessment) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Jalur Wawancara:</span>
              <span className="text-[11px] text-slate-500">
                Pilih Verbal (rekaman suara STT) atau Non-Verbal jika penyintas mengalami mutisme/syok trauma.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-slate-200/80 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setInterviewMode('verbal')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
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
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[40px] ${
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

          {/* Non-Verbal Mode Adaptive Assessment Guidance */}
          {interviewMode === 'non_verbal' && (
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl space-y-2 text-indigo-950 text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <strong className="font-bold">
                  Mode Pengumpulan Data Alternatif (Adaptive Assessment):
                </strong>
              </div>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                Penyintas tidak dipaksa berbicara. Relawan aktif berinteraksi dengan:
              </p>
              <ul className="list-disc list-inside text-[11px] text-indigo-900 space-y-1 pl-1">
                <li><strong>Isyarat / Ketukan Layar:</strong> Minta penyintas mengangguk/menggeleng, atau mengetuk langsung tombol Ya/Tidak di bawah.</li>
                <li><strong>Observasi Terpandu:</strong> Nilai berdasarkan bahasa tubuh, ekspresi wajah, atau konfirmasi anggota keluarga di sampingnya.</li>
              </ul>
            </div>
          )}

          {/* Onboarding Script Card for Volunteer */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Pesan Pembuka Relawan (Script Onboarding):</span>
            </span>
            <p className="text-xs text-blue-950 italic leading-relaxed font-medium">
              "{SRQ20_ONBOARDING_SCRIPT}"
            </p>
          </div>

          {/* Speech-to-Text Bar for Verbal Mode */}
          {interviewMode === 'verbal' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Mic className="w-4 h-4" />
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
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition shrink-0 min-h-[44px]"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Mulai Rekam</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopSTT}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition animate-pulse shrink-0 min-h-[44px]"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>Stop Rekaman</span>
                  </button>
                )}
              </div>

              {isRecording && (
                <div className="p-2.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 italic animate-pulse">
                  {liveInterim ? `"${liveInterim}"` : 'Mendengarkan ucapan percakapan relawan dan penyintas...'}
                </div>
              )}

              {transcript && (
                <div className="p-2.5 bg-white border border-blue-200 rounded-xl text-[11px] text-slate-700 flex items-start justify-between gap-3">
                  <div className="space-y-0.5 flex-1">
                    <strong className="text-blue-900 block text-[10px] uppercase font-bold">
                      Transkrip Wawancara:
                    </strong>
                    <p className="leading-relaxed text-slate-800">"{transcript}"</p>
                  </div>
                  {!isRecording && (
                    <button
                      type="button"
                      onClick={() => {
                        setTranscript('');
                        baseTranscriptRef.current = '';
                        capturedTextRef.current = '';
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-semibold shrink-0 transition"
                      title="Hapus transkrip jika ingin mengulang dari awal"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Red Flag Warning Alert if Q17 is Yes */}
          {isQuestion17Yes && (
            <div className="p-3.5 bg-red-50 border-2 border-red-600 rounded-2xl flex items-center gap-3 text-red-950 animate-in fade-in">
              <ShieldAlert className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <span className="font-extrabold text-xs block text-red-900">
                  🚨 CRITICAL SAFETY GATE: Butir #17 (Pikiran Mengakhiri Hidup) Bernilai YA
                </span>
                <span className="text-[11px] text-red-800 block">
                  Kasus ini seketika mengunci status ke <strong>T0-SUSPECT (Emergency)</strong> tanpa memperhitungkan skor lainnya. Siagakan PSC 119 dan dampingi penyintas terus-menerus.
                </span>
              </div>
            </div>
          )}

          {/* Progress & Completion Status Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  Daftar 20 Butir Soal Terstandar WHO SRQ-20
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition ${
                    isAllSRQAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {isAllSRQAnswered
                    ? '✓ 20/20 Terjawab Lengkap'
                    : `${answeredQuestionsCount} / 20 Terjawab`}
                </span>
              </div>
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 text-xs">
                Skor 'Ya': {totalSRQScore} / 20
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllSRQAnswered ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${(answeredQuestionsCount / 20) * 100}%` }}
              />
            </div>

            {!isAllSRQAnswered && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px]">
                <span className="text-amber-800 font-medium">
                  ⚠️ <strong>Wajib dijawab semua:</strong> Masih ada{' '}
                  <strong className="text-amber-950">{unansweredQuestionIds.length}</strong> butir
                  soal yang kosong.
                </span>
                <button
                  type="button"
                  onClick={handleFillRemainingAsNo}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-[10px] transition shrink-0 self-start sm:self-center flex items-center gap-1 shadow-2xs"
                  title="Tandai semua soal yang belum diisi menjadi Tidak"
                >
                  <span>⚡ Set Sisa ({unansweredQuestionIds.length}) Menjadi 'Tidak'</span>
                </button>
              </div>
            )}
          </div>

          {/* List of 20 SRQ Questions */}
          <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1">
            {SRQ20_QUESTIONS.map((q) => {
              const currentVal = answers[q.id];
              const isExpanded = expandedTooltipId === q.id;
              const isUnanswered = currentVal === undefined;
              const isFlaggedMissing = validationAttempted && isUnanswered;

              return (
                <div
                  key={q.id}
                  id={`srq-question-${q.id}`}
                  className={`p-3.5 rounded-2xl border transition ${
                    isFlaggedMissing
                      ? 'bg-rose-50/70 border-rose-400 ring-2 ring-rose-200'
                      : q.isRedFlag && currentVal === true
                      ? 'bg-red-50 border-red-500'
                      : currentVal === true
                      ? 'bg-blue-50/70 border-blue-300'
                      : currentVal === false
                      ? 'bg-slate-50/90 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {q.id}
                      </span>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs ${
                              currentVal === true ? 'font-bold text-slate-900' : 'text-slate-800'
                            }`}
                          >
                            {q.text}
                          </span>
                          {q.isRedFlag && (
                            <span className="text-[10px] text-red-600 font-bold uppercase">
                              (🚨 Red Flag)
                            </span>
                          )}

                          {/* Status Badge */}
                          {isFlaggedMissing ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              <span>Wajib Diisi (Kosong)</span>
                            </span>
                          ) : currentVal === true ? (
                            <span className="px-2 py-0.2 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">
                              Pilihan: YA
                            </span>
                          ) : currentVal === false ? (
                            <span className="px-2 py-0.2 rounded-md bg-slate-200 text-slate-700 font-semibold text-[10px]">
                              Pilihan: TIDAK
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                              Belum Dijawab
                            </span>
                          )}
                        </div>

                        {/* Conversational Script */}
                        {q.scriptQuestion && (
                          <p className="text-[11px] text-blue-900/90 italic leading-relaxed">
                            "{q.scriptQuestion}"
                          </p>
                        )}

                        {/* Guided Tooltip for Volunteer */}
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedTooltipId(isExpanded ? null : q.id)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 pt-0.5"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>
                              {isExpanded ? 'Sembunyikan Panduan Relawan' : 'Lihat Petunjuk Relawan'}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="mt-1.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-950 leading-relaxed animate-in fade-in">
                              <strong>Petunjuk Relawan:</strong> {q.volunteerInstruction}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fat-Finger Friendly Yes/No Controls */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleAnswerToggle(q.id, false)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition min-h-[44px] flex items-center gap-1.5 ${
                          currentVal === false
                            ? 'bg-slate-700 border-slate-700 text-white shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tidak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAnswerToggle(q.id, true)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition min-h-[44px] flex items-center gap-1.5 ${
                          currentVal === true
                            ? q.isRedFlag
                              ? 'bg-red-600 border-red-600 text-white shadow-xs'
                              : 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Ya</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action to proceed to Screen 6 */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {validationAttempted && !isAllSRQAnswered && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-950 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block text-rose-900">
                    Tidak dapat lanjut: Seluruh 20 butir soal SRQ-20 wajib dijawab!
                  </span>
                  <span className="text-[11px] text-rose-800 block mt-0.5">
                    Tersisa <strong>{unansweredQuestionIds.length} butir</strong> yang masih kosong
                    (Butir #{unansweredQuestionIds.slice(0, 8).join(', #')}
                    {unansweredQuestionIds.length > 8 ? '...' : ''}). Harap pilih opsi "Ya" atau
                    "Tidak" pada setiap pertanyaan sebelum melanjutkan ke Screen 6.
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>
                    Skor 'Ya': <strong className="text-slate-900">{totalSRQScore}</strong> / 20
                  </span>
                  <span>·</span>
                  <span
                    className={
                      isAllSRQAnswered
                        ? 'text-emerald-700 font-semibold'
                        : 'text-amber-800 font-semibold'
                    }
                  >
                    {isAllSRQAnswered
                      ? '✓ 20 Terjawab Lengkap'
                      : `${answeredQuestionsCount} / 20 Terjawab`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToFunctional}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition min-h-[48px] ${
                  isAllSRQAnswered
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-xs cursor-pointer'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 cursor-pointer'
                }`}
                title={
                  isAllSRQAnswered
                    ? 'Lanjut ke Evaluasi Faktor Risiko & Fungsi'
                    : `Harap lengkapi 20 soal (${answeredQuestionsCount}/20 terjawab)`
                }
              >
                <span>
                  {isAllSRQAnswered
                    ? 'Lanjut ke Evaluasi Faktor Risiko & Fungsi'
                    : `Lengkapi 20 Soal (${answeredQuestionsCount}/20 Terjawab)`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MODUL ASSESSMENT FAKTOR RISIKO & KEBERFUNGSIAN (SCREEN 6) */}
      {wizardStep === 'functional' && (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Screen 6: Modul Assessment (Fase Hari 4–30)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
              Penilaian Faktor Risiko (Bagian A) & Keberfungsian Hidup (Bagian B)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Lakukan penilaian ini berdasarkan observasi langsung dan cerita penyintas untuk menghitung Skor Skoring Integrasi.
            </p>
          </div>

          {/* BAGIAN A: CHECKLIST FAKTOR RISIKO (RISK FACTORS) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  BAGIAN A: CHECKLIST FAKTOR RISIKO (0–8 Point)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Mengukur tingkat kerentanan latar belakang (vulnerability context).
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                Skor A: {riskFactorScoreTotal} / 8 Point
              </span>
            </div>

            <div className="space-y-2">
              {RISK_FACTOR_ITEMS.map((item) => {
                const isChecked = selectedRiskFactors.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleRiskFactor(item.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between gap-3 transition min-h-[56px] ${
                      isChecked
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          {item.code} · +{item.points} Point
                        </span>
                        <span className="text-xs font-bold">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-amber-600 border-amber-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* BAGIAN B: CHECKLIST PENILAIAN FUNGSI HARIAN (FUNCTIONAL ASSESSMENT) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  BAGIAN B: PENILAIAN FUNGSI HARIAN (0–9 Point)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Mengukur hendaya kemampuan hidup sehari-hari (1-Tap Selection: 0, 1, atau 3 Point).
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs">
                Skor B: {functionalScoreTotal} / 9 Point
              </span>
            </div>

            <div className="space-y-4">
              {FUNCTIONAL_DOMAINS.map((domain) => {
                const currentPts = functionalScores[domain.id] ?? 0;

                return (
                  <div key={domain.id} className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">
                        {domain.code}. {domain.title}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {currentPts} Point
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-900 italic font-medium">
                      "{domain.question}"
                    </p>

                    {/* 3 Fat-Finger Tap Options: 0, 1, 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                      {domain.options.map((opt) => {
                        const isSelected = currentPts === opt.points;
                        return (
                          <button
                            key={opt.points}
                            type="button"
                            onClick={() => setFunctionalOption(domain.id, opt.points)}
                            className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition min-h-[56px] ${
                              isSelected
                                ? opt.level === 'green'
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                                  : opt.level === 'yellow'
                                  ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                                  : 'bg-red-50 border-red-500 text-red-950 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="text-[11px] block leading-tight">
                              {opt.level === 'green' ? '🟢' : opt.level === 'yellow' ? '🟡' : '🔴'} {opt.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                              ({opt.points} Point)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Formula Preview */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Formula & Rumus Skoring Integrasi (0 – 37 Point)
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
              <span>SRQ-20: {totalSRQScore}</span>
              <span className="text-slate-500">+</span>
              <span>Faktor Risiko: {riskFactorScoreTotal}</span>
              <span className="text-slate-500">+</span>
              <span>Fungsi Harian: {functionalScoreTotal}</span>
              <span className="text-slate-500">=</span>
              <span className="text-emerald-400 text-sm">
                Total Terintegrasi: {liveIntegratedScore} / 37 Point
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setWizardStep('interview')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 min-h-[48px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Soal SRQ</span>
            </button>

            <button
              type="button"
              onClick={handleCalculateTriage}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition min-h-[48px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Kalkulasi Triase Integrasi Otomatis</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: HASIL ASESMEN OTOMATIS & INTEGRASI DATABASE (SCREEN 7) */}
      {wizardStep === 'result' && analysisResult && (
        <div className="space-y-4 animate-in fade-in">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
              Screen 7: Result Screen (Auto-Calculated Triage Zone)
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Klasifikasi Triase Terintegrasi (Formula 0–37 Point)
            </h3>
          </div>

          {/* Tier Highlight Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                {renderTierBadge(analysisResult.triageTier)}
                <span className="text-xs font-bold text-slate-800">
                  {analysisResult.statusTitle}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                Skor Integrasi: {analysisResult.totalIntegratedScore} / 37 Point
              </div>
            </div>

            {/* Score Component Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Skor SRQ-20</span>
                <span className="font-bold text-slate-800">{analysisResult.score} / 20</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Faktor Risiko (A)</span>
                <span className="font-bold text-slate-800">{analysisResult.riskFactorScore ?? 0} / 8</span>
              </div>
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Fungsi Harian (B)</span>
                <span className="font-bold text-slate-800">{analysisResult.functionalScore ?? 0} / 9</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {analysisResult.explanation}
            </p>
          </div>

          {/* Recommended Action Protocol */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider block">
              Rekomendasi Tindak Lanjut Sistem:
            </span>
            <p className="text-xs text-blue-950 font-medium leading-relaxed">
              {analysisResult.recommendedAction}
            </p>
          </div>

          {/* Detected Risk Factors & Symptoms */}
          {analysisResult.indicators.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Indikator Klinis & Faktor Kerentanan ({analysisResult.indicators.length}):
              </span>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                {analysisResult.indicators.map((ind, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px]"
                  >
                    ✓ {ind}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Database Integration Success Banner */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              [INTEGRASI DATABASE BERHASIL]: Rekam medis longitudinal tersimpan aman berbasis ID {survivor.id} & NIK. Tersinkronisasi otomatis ke Dashboard Faskes (PSC 119) dan Dashboard Utama BPBD/Dinkes.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-xs transition min-h-[48px]"
            >
              <span>Selesai & Kembali ke Homescreen</span>
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 4 EMERGENCY MODAL FOR ITEM #17 (IDEASI SUISIDA) */}
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
