import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Check,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  MessageSquare,
  Info,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Activity,
  Database,
} from 'lucide-react';
import { SurvivorProfile, TriageAnalysisResult } from '../../types/assessment';
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

const CATEGORY_META: Record<string, { label: string; badgeClass: string }> = {
  somatic: {
    label: 'Gejala Somatik / Fisik',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  anxiety: {
    label: 'Kecemasan / Neurotik',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  depressive: {
    label: 'Gejala Depresi / Afektif',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  energy: {
    label: 'Energi & Kelelahan',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  safety: {
    label: '🚨 Keamanan Jiwa (Kritis)',
    badgeClass: 'bg-red-50 text-red-800 border-red-200',
  },
};

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
  const { addAssessment, isOnline } = useAssessment();

  const [wizardStep, setWizardStep] = useState<'interview' | 'functional' | 'result'>('interview');
  const [interviewMode, setInterviewMode] = useState<'verbal' | 'non_verbal'>('verbal');
  const [showItem17Alert, setShowItem17Alert] = useState<boolean>(false);
  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);
  const [isSavedOffline, setIsSavedOffline] = useState<boolean>(false);
  const [recordedTime, setRecordedTime] = useState<string>('');

  // SRQ-20 Answers: map of question id to boolean (true = Ya, false = Tidak)
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);

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

  const _liveIntegratedScore = totalSRQScore + riskFactorScoreTotal + functionalScoreTotal;

  const handleProceedToFunctional = () => {
    if (!isAllSRQAnswered) {
      setValidationAttempted(true);
      // Auto-jump ke butir pertanyaan pertama yang masih kosong
      const firstMissingId = unansweredQuestionIds[0];
      if (firstMissingId) {
        setCurrentQuestionIndex(firstMissingId - 1);
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
    const timeString = `${timeHours}:${timeMins}`;
    setRecordedTime(timeString);

    // Save assessment record to central database
    const saveRes = addAssessment({
      recordId: activeSessionRecordId || undefined,
      id: survivor.id,
      victimId: survivor.id,
      nik: survivor.nik,
      timestamp: timeString,
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
    if (saveRes?.isOfflineSaved !== undefined) {
      setIsSavedOffline(saveRes.isOfflineSaved);
    }

    setWizardStep('result');
    onComplete(result);
  };



  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 animate-in fade-in">
      {/* Header Context (Khusus Step Interview SRQ-20 agar tidak duplikat di step lain) */}
      {wizardStep === 'interview' && (
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[10px] uppercase tracking-wider">
                FASE LANJUTAN · HARI 4–30
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
              Wawancara Penapisan SRQ-20
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium flex-wrap">
              <span className="font-mono font-bold text-slate-800">{survivor.id}</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">
                {survivor.name} ({survivor.age} th, {survivor.gender === 'L' ? 'L' : 'P'})
              </span>
              <span>·</span>
              <span>{survivor.posko}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition min-h-[44px] flex items-center gap-1 text-xs font-semibold"
            title="Kembali ke Beranda Relawan"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>
      )}

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
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
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
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[44px] ${
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

          {/* Onboarding Script Card for Volunteer */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Pesan Pembuka Relawan (Script Onboarding):</span>
            </span>
            <p className="text-xs text-blue-950 italic leading-relaxed font-medium">
              "{SRQ20_ONBOARDING_SCRIPT}"
            </p>
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

          {/* Speech-to-Text Bar for Verbal Mode */}
          {interviewMode === 'verbal' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-950 block">
                      Fitur Speech-to-Text & Auto-Checklist
                    </span>
                    <span className="text-[10px] text-blue-700 leading-tight block">
                      Deteksi kata kunci keluhan secara otomatis (kontrol manual tetap di tangan relawan)
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
            <div className="p-3.5 bg-red-50 border-2 border-red-500 rounded-2xl flex items-center gap-3 text-red-950 animate-in fade-in">
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

          {/* Progress & 20 Questions Jump Bar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">
                  Butir {SRQ20_QUESTIONS[currentQuestionIndex].id} / 20
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    isAllSRQAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  {isAllSRQAnswered
                    ? '✓ 20/20 Terjawab Lengkap'
                    : `${answeredQuestionsCount} / 20 Terjawab`}
                </span>
              </div>
              <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-xl border border-blue-200 text-xs shadow-2xs">
                Skor 'Ya': {totalSRQScore}
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

            {/* 20 Questions Jump Matrix (10x2 on mobile, perfectly fit without scroll) */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 pt-1">
              {SRQ20_QUESTIONS.map((q, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const val = answers[q.id];
                const isAnswered = val !== undefined;
                const isRedFlagItem = q.isRedFlag;
                const isMissing = validationAttempted && !isAnswered;

                let btnStyle = 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100';
                if (val === true) {
                  btnStyle = isRedFlagItem
                    ? 'bg-red-600 border-red-600 text-white font-bold'
                    : 'bg-blue-600 border-blue-600 text-white font-bold';
                } else if (val === false) {
                  btnStyle = 'bg-slate-200 border-slate-300 text-slate-700 font-semibold';
                } else if (isMissing) {
                  btnStyle = 'bg-rose-50 border-rose-400 text-rose-800 animate-pulse';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-8 sm:h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition border relative ${btnStyle} ${
                      isCurrent
                        ? 'ring-2 ring-blue-600 ring-offset-1 scale-105 z-10 shadow-xs'
                        : ''
                    }`}
                    title={`Butir ${q.id}: ${val === true ? 'YA' : val === false ? 'TIDAK' : 'Belum Dijawab'}`}
                  >
                    <span>{q.id}</span>
                    {isRedFlagItem && val !== true && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FOCUSED ONE-QUESTION-AT-A-TIME WORKBENCH */}
          {(() => {
            const currentQ = SRQ20_QUESTIONS[currentQuestionIndex];
            const currentCat = CATEGORY_META[currentQ.category] || {
              label: currentQ.category,
              badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
            };

            return (
              <div
                className={`p-4 sm:p-6 rounded-xl border-2 transition space-y-4 ${
                  currentQ.isRedFlag
                    ? 'bg-red-50/20 border-red-300'
                    : 'bg-white border-slate-200'
                }`}
              >
                {/* Question Card Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                      {currentQ.id}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentCat.badgeClass}`}
                    >
                      {currentCat.label}
                    </span>
                  </div>

                  {/* Status Chip */}
                  <div>
                    {answers[currentQ.id] === true ? (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Pilihan: YA</span>
                      </span>
                    ) : answers[currentQ.id] === false ? (
                      <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Pilihan: TIDAK</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                        Belum Dijawab
                      </span>
                    )}
                  </div>
                </div>

                {/* Critical Red Flag Indicator Warning if Question 17 */}
                {currentQ.isRedFlag && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2.5 text-red-950">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-extrabold block text-red-900">
                        🚨 INDIKATOR KRITIS KEAMANAN JIWA (RED FLAG)
                      </span>
                      <span className="text-[11px] text-red-800 block mt-0.5 leading-relaxed">
                        Jika dijawab "YA", sistem seketika mengunci status triase ke <strong>T0-SUSPECT (Emergency Override)</strong> dan memicu rujukan segera ke Faskes / PSC 119.
                      </span>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pertanyaan Standar WHO SRQ-20
                  </span>
                  <h3 className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
                    {currentQ.text}
                  </h3>
                </div>

                {/* Conversational Script */}
                {currentQ.scriptQuestion && (
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Panduan Percakapan Relawan:</span>
                    </span>
                    <p className="text-xs sm:text-sm text-blue-950 italic leading-relaxed font-medium">
                      "{currentQ.scriptQuestion}"
                    </p>
                  </div>
                )}

                {/* Volunteer Clinical Instruction */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900">Petunjuk Observasi Relawan: </span>
                  <span>{currentQ.volunteerInstruction}</span>
                </div>

                {/* FAT-FINGER FRIENDLY YES/NO CONTROLS (MIN-H 56PX) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerToggle(currentQ.id, false)}
                    className={`min-h-[56px] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                      answers[currentQ.id] === false
                        ? 'bg-slate-800 text-white border-2 border-slate-800 shadow-md ring-2 ring-slate-400/40'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300'
                    }`}
                  >
                    <X
                      className={`w-5 h-5 ${
                        answers[currentQ.id] === false ? 'text-white stroke-[2.5]' : 'text-slate-400'
                      }`}
                    />
                    <span>TIDAK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswerToggle(currentQ.id, true)}
                    className={`min-h-[56px] rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                      answers[currentQ.id] === true
                        ? currentQ.isRedFlag
                          ? 'bg-red-600 text-white border-2 border-red-600 shadow-md ring-2 ring-red-400/40'
                          : 'bg-blue-600 text-white border-2 border-blue-600 shadow-md ring-2 ring-blue-400/40'
                        : currentQ.isRedFlag
                          ? 'bg-white hover:bg-red-50 text-red-700 border-2 border-red-300'
                          : 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-300'
                    }`}
                  >
                    <Check
                      className={`w-5 h-5 ${
                        answers[currentQ.id] === true ? 'text-white stroke-[3]' : 'text-slate-400'
                      }`}
                    />
                    <span>YA</span>
                  </button>
                </div>

                {/* PREV / NEXT QUESTION CONTROLS (MIN-H 56PX) */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="flex-1 sm:flex-initial px-4 min-h-[56px] rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 transition"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-600" />
                    <span>Sebelumnya</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-500 hidden sm:inline-block">
                    Butir {currentQuestionIndex + 1} dari 20
                  </span>

                  {currentQuestionIndex < 19 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIndex((prev) => Math.min(19, prev + 1))}
                      className="flex-1 sm:flex-initial px-5 min-h-[56px] rounded-xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                    >
                      <span>Berikutnya</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToFunctional}
                      className={`flex-1 sm:flex-initial px-5 min-h-[56px] rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                        isAllSRQAnswered
                          ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white'
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                    >
                      <span>{isAllSRQAnswered ? 'Lanjut ke Modul Evaluasi' : 'Periksa Soal'}</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* BATCH ACTION & VALIDATION ALERTS */}
          <div className="space-y-3 pt-1">
            {!isAllSRQAnswered && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
                <span className="text-slate-600 font-medium">
                  Masih ada <strong className="text-slate-900">{unansweredQuestionIds.length} butir</strong> yang belum dijawab.
                </span>
                <button
                  type="button"
                  onClick={handleFillRemainingAsNo}
                  className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto min-h-[44px]"
                  title="Tandai sisa butir soal yang belum diisi menjadi Tidak"
                >
                  <span>⚡ Set Sisa ({unansweredQuestionIds.length}) Menjadi 'Tidak'</span>
                </button>
              </div>
            )}

            {validationAttempted && !isAllSRQAnswered && (
              <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-start gap-2.5 text-rose-950 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1.5 flex-1">
                  <span className="font-bold block text-rose-900">
                    Tidak dapat lanjut: Seluruh 20 butir soal SRQ-20 wajib dijawab!
                  </span>
                  <p className="text-[11px] text-rose-800">
                    Klik nomor butir di bawah untuk langsung menjawab:
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {unansweredQuestionIds.map((qId) => (
                      <button
                        key={qId}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(qId - 1)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-900 font-mono font-bold text-xs shadow-2xs"
                      >
                        #{qId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom primary proceed button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleProceedToFunctional}
                className={`w-full min-h-[52px] rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-xs ${
                  isAllSRQAnswered
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                }`}
              >
                <span>
                  {isAllSRQAnswered
                    ? 'Lanjut ke Penilaian Kondisi (Faktor Risiko & Fungsi) →'
                    : `Lengkapi 20 Soal (${answeredQuestionsCount}/20 Terjawab) Untuk Lanjut`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: MODUL ASSESSMENT FAKTOR RISIKO & KEBERFUNGSIAN (SCREEN 6) */}
      {wizardStep === 'functional' && (
        <div className="space-y-6 animate-in fade-in pb-16 sm:pb-20">
          {/* Header Context */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[10px] uppercase tracking-wider">
                  LANGKAH 2 DARI 2 · PENILAIAN KONDISI
                </span>
                <span className="text-[11px] font-semibold text-slate-500">
                  Tahap Akhir Sebelum Triase
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                Penilaian Kondisi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Faktor risiko & keberfungsian sehari-hari
              </p>
            </div>

            <button
              type="button"
              onClick={() => setWizardStep('interview')}
              className="text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition min-h-[44px] flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title="Kembali ke Penapisan SRQ-20"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Kembali ke SRQ-20</span>
            </button>
          </div>

          {/* SECTION 01: FAKTOR RISIKO */}
          <section className="space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  01
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Faktor Risiko
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">
                Pilih kondisi yang sesuai berdasarkan cerita atau observasi penyintas.
              </p>
            </div>

            <div className="space-y-2.5">
              {RISK_FACTOR_ITEMS.map((item) => {
                const isChecked = selectedRiskFactors.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleRiskFactor(item.id)}
                    className={`w-full p-4 rounded-2xl border-2 text-left flex items-start justify-between gap-3 transition min-h-[56px] active:scale-[0.99] ${
                      isChecked
                        ? 'bg-blue-50/70 border-blue-600 text-slate-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                            isChecked
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.code}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                        {item.description}
                      </p>
                    </div>

                    {/* Selection Indicator Checkbox */}
                    <div
                      className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isChecked
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SECTION 02: KEBERFUNGSIAN SEHARI-HARI */}
          <section className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                  02
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Keberfungsian Sehari-hari
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">
                Nilai kemampuan penyintas dalam menjalankan aktivitas sehari-hari.
              </p>
            </div>

            <div className="space-y-4">
              {FUNCTIONAL_DOMAINS.map((domain) => {
                const currentPts = functionalScores[domain.id] ?? 0;

                return (
                  <div
                    key={domain.id}
                    className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-xs">
                        {domain.code}
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {domain.title}
                      </h4>
                    </div>

                    <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-950 italic font-medium leading-relaxed">
                        "{domain.question}"
                      </p>
                    </div>

                    {/* 3 Large Vertical Options (Min-H 56px on mobile) */}
                    <div className="space-y-2 pt-1">
                      {domain.options.map((opt) => {
                        const isSelected = currentPts === opt.points;

                        let selectedStyle = '';
                        if (isSelected) {
                          if (opt.points === 0) {
                            selectedStyle =
                              'bg-emerald-50/80 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
                          } else if (opt.points === 1) {
                            selectedStyle =
                              'bg-amber-50/80 border-amber-600 text-amber-950 font-bold ring-2 ring-amber-500/20';
                          } else {
                            selectedStyle =
                              'bg-rose-50/80 border-rose-600 text-rose-950 font-bold ring-2 ring-rose-500/20';
                          }
                        } else {
                          selectedStyle =
                            'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
                        }

                        return (
                          <button
                            key={opt.points}
                            type="button"
                            onClick={() => setFunctionalOption(domain.id, opt.points)}
                            className={`w-full p-3.5 sm:p-4 rounded-xl border-2 text-left flex items-center justify-between gap-3 transition min-h-[56px] active:scale-[0.99] ${selectedStyle}`}
                          >
                            <div className="min-w-0 flex items-center gap-3">
                              <span className="text-base shrink-0">
                                {opt.points === 0 ? '🟢' : opt.points === 1 ? '🟡' : '🔴'}
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs sm:text-sm block leading-snug">
                                  {opt.detail}
                                </span>
                              </div>
                            </div>

                            {/* Radio Check Indicator */}
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
                                isSelected
                                  ? opt.points === 0
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : opt.points === 1
                                    ? 'border-amber-600 bg-amber-600 text-white'
                                    : 'border-rose-600 bg-rose-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BOTTOM ACTIONS (MOBILE-FIRST 56PX) */}
          <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setWizardStep('interview')}
              className="w-full sm:w-auto px-5 min-h-[56px] rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Kembali ke Soal SRQ</span>
            </button>

            <button
              type="button"
              onClick={handleCalculateTriage}
              className="w-full sm:flex-1 min-h-[56px] px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/25 transition"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Lihat Hasil Analisis Triase →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: HASIL ASESMEN TRIASE TERINTEGRASI (SCREEN 7) */}
      {wizardStep === 'result' && analysisResult && (() => {
        const tier = analysisResult.triageTier;
        const isT0 = tier === 'T0';
        const isT1 = tier === 'T1';
        const isT2 = tier === 'T2';
        const isT3 = tier === 'T3';

        return (
          <div className="space-y-5 animate-in fade-in pb-20 sm:pb-24">
            {/* Header Context */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold text-[10px] uppercase tracking-wider">
                    TAHAP AKHIR · HASIL ASESMEN
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Keputusan Triase Terintegrasi
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-1">
                  Hasil Assessment
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keputusan triase & rekomendasi tindak lanjut lapangan
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="text-slate-500 hover:text-slate-800 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition min-h-[44px] flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Selesai & Kembali ke Homescreen"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Beranda</span>
              </button>
            </div>

            {/* Survivor Identity Context Strip (Compact, Non-Dominant) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl text-xs text-slate-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {survivor.id}
                </span>
                <span className="font-bold text-slate-900">
                  {survivor.name}
                </span>
                <span className="text-slate-400">·</span>
                <span>{survivor.age} th ({survivor.gender === 'L' ? 'Laki-laki' : 'Perempuan'})</span>
                <span className="text-slate-400">·</span>
                <span className="font-medium text-slate-700">{survivor.posko}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{recordedTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
              </div>
            </div>

            {/* STATUS RESULT CARD (DOMINANT ELEMENT) */}
            <div
              className={`p-5 sm:p-6 rounded-2xl border-2 space-y-4 transition ${
                isT0
                  ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20'
                  : isT1
                  ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20'
                  : isT2
                  ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                  : 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
              }`}
            >
              {/* Badge & Urgency Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-3.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Semantic Tier Badge */}
                  <span
                    className={`px-3.5 py-1.5 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-xs ${
                      isT0
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isT1
                        ? 'bg-orange-600 text-white'
                        : isT2
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-emerald-600 text-white font-bold'
                    }`}
                  >
                    {isT0 && <AlertOctagon className="w-4 h-4 text-white shrink-0" />}
                    {isT1 && <AlertTriangle className="w-4 h-4 text-white shrink-0" />}
                    {isT2 && <Activity className="w-4 h-4 text-slate-950 shrink-0" />}
                    {isT3 && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    <span>
                      {isT0
                        ? 'T0 — CRITICAL EMERGENCY'
                        : isT1
                        ? 'T1 — HIGH RISK'
                        : isT2
                        ? 'T2 — MODERATE RISK'
                        : 'T3 — LOW RISK'}
                    </span>
                  </span>

                  {/* Accessible Urgency Tag */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${
                      isT0
                        ? 'bg-rose-100 text-rose-950 border-rose-300'
                        : isT1
                        ? 'bg-orange-100 text-orange-950 border-orange-300'
                        : isT2
                        ? 'bg-amber-100 text-amber-950 border-amber-300'
                        : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                    }`}
                  >
                    {isT0
                      ? 'Kegawatdaruratan Kritis Lapangan'
                      : isT1
                      ? 'Prioritas Klinis / Rujukan'
                      : isT2
                      ? 'Pemantauan Psikososial'
                      : 'Kondisi Adaptif / Resilien'}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-700 bg-white/90 px-3 py-1.5 rounded-xl border border-black/10 self-start sm:self-auto">
                  Skor Integrasi: {analysisResult.totalIntegratedScore} / 37 Poin
                </div>
              </div>

              {/* Status Title & Clinical Explanation */}
              <div className="space-y-1.5">
                <h3
                  className={`text-base sm:text-lg font-bold leading-snug ${
                    isT0
                      ? 'text-rose-950'
                      : isT1
                      ? 'text-orange-950'
                      : isT2
                      ? 'text-amber-950'
                      : 'text-emerald-950'
                  }`}
                >
                  {analysisResult.statusTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {analysisResult.explanation}
                </p>
              </div>
            </div>

            {/* ⚠️ CATATAN ETIK & MEDIS BAKU RAPID-MIND */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border-2 border-amber-300 text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block uppercase tracking-wider text-amber-900 text-[11px] mb-0.5">
                  Catatan Etik & Medis Sistem Triase:
                </span>
                <p className="font-semibold text-amber-950 italic">
                  "Hasil asesmen ini bersifat REKOMENDASI SISTEM sebagai alat bantu keputusan awal hingga dilakukan VALIDASI KLINIS resmi oleh Tenaga Kesehatan / Spesialis Profesional."
                </p>
              </div>
            </div>

            {/* ACTION CARD (TINDAKAN BERIKUTNYA) */}
            <div className="p-4 sm:p-5 bg-white border-2 border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isT0
                      ? 'bg-rose-600 animate-ping'
                      : isT1
                      ? 'bg-orange-600'
                      : isT2
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Tindakan Berikutnya (Protokol Lapangan)
                </span>
              </div>

              {/* Action Protocol Narrative */}
              <div
                className={`p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm leading-relaxed font-medium ${
                  isT0
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                    : isT1
                    ? 'bg-orange-50/70 border-orange-200 text-orange-950'
                    : isT2
                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                    : 'bg-blue-50/70 border-blue-200 text-blue-950'
                }`}
              >
                {analysisResult.recommendedAction}
              </div>

              {/* Primary & Secondary Action CTAs (Min-H 56px on Mobile) */}
              <div className="pt-1 flex flex-col gap-2.5">
                {isT0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowItem17Alert(true)}
                      className="w-full min-h-[56px] px-6 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition uppercase tracking-wider"
                    >
                      <AlertOctagon className="w-5 h-5 text-white shrink-0" />
                      <span>Buka Protokol Rujukan Darurat T0</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '/hospital';
                      }}
                      className="w-full min-h-[56px] px-5 rounded-xl bg-white hover:bg-rose-50 active:scale-[0.99] text-rose-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-300 transition"
                    >
                      <span>Koordinasi Portal Rujukan RS / PSC 119 →</span>
                    </button>
                  </>
                )}

                {isT1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = '/hospital';
                      }}
                      className="w-full min-h-[56px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-600/30 transition"
                    >
                      <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                      <span>Rujuk ke Fasilitas Kesehatan (Role 2) →</span>
                    </button>
                    <button
                      type="button"
                      onClick={onBack}
                      className="w-full min-h-[56px] px-5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-300 transition"
                    >
                      <span>Selesai & Kembali ke Homescreen</span>
                    </button>
                  </>
                )}

                {isT2 && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full min-h-[56px] px-6 rounded-xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Catat ke Watchlist Posko & Selesai</span>
                  </button>
                )}

                {isT3 && (
                  <button
                    type="button"
                    onClick={onBack}
                    className="w-full min-h-[56px] px-6 rounded-xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Selesai & Kembali ke Homescreen</span>
                  </button>
                )}
              </div>
            </div>

            {/* SCORE BREAKDOWN (STRUCTURED 4-CELL GRID) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Komponen Skor Terintegrasi
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Maksimum 37 Poin
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                    Skor SRQ-20
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-900 block mt-0.5">
                    {analysisResult.score} <span className="text-xs text-slate-400 font-normal">/ 20</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Distres Emosional</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                    Faktor Risiko (A)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-900 block mt-0.5">
                    {analysisResult.riskFactorScore ?? 0} <span className="text-xs text-slate-400 font-normal">/ 8</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Kerentanan Lapangan</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase">
                    Fungsi Harian (B)
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-slate-900 block mt-0.5">
                    {analysisResult.functionalScore ?? 0} <span className="text-xs text-slate-400 font-normal">/ 9</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Hendaya Aktivitas</span>
                </div>

                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-center">
                  <span className="text-[10px] text-blue-800 block font-bold uppercase">
                    Total Integrasi
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-blue-950 block mt-0.5">
                    {analysisResult.totalIntegratedScore} <span className="text-xs text-blue-600 font-normal">/ 37</span>
                  </span>
                  <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">Skor Kumulatif</span>
                </div>
              </div>
            </div>

            {/* DETECTED CLINICAL INDICATORS (PROGRESSIVE DISCLOSURE) */}
            {analysisResult.indicators.length > 0 && (
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Indikator Klinis & Kerentanan Terdeteksi ({analysisResult.indicators.length})
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    Dari Wawancara & Observasi
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto pt-0.5">
                  {analysisResult.indicators.map((ind, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{ind}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DATA PERSISTENCE & SYNC STATUS BANNER */}
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                !isOnline || isSavedOffline
                  ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}
            >
              {!isOnline || isSavedOffline ? (
                <Database className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="font-bold block">
                  {!isOnline || isSavedOffline
                    ? 'Tersimpan di Perangkat (Offline)'
                    : 'Tersimpan & Tersinkronisasi Otomatis'}
                </span>
                <span className="text-[11px] block mt-0.5 opacity-90">
                  {!isOnline || isSavedOffline
                    ? `Rekam medis telah disimpan lokal (IndexedDB) berbasis ID ${survivor.id}. Data akan otomatis disinkronkan ke server pusat saat koneksi internet pulih.`
                    : `Rekam medis longitudinal tersimpan aman berbasis ID ${survivor.id} & NIK. Tersinkronisasi otomatis ke Dashboard Faskes (PSC 119) dan Posko Komando BPBD/Dinkes.`}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SCREEN 4 EMERGENCY MODAL FOR ITEM #17 (IDEASI SUISIDA) ATAU T0 DI SCREEN 7 */}
      {showItem17Alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <Screen4EmergencyAlert
              survivorId={survivor.id}
              survivorName={survivor.name}
              survivorAge={survivor.age}
              survivorGender={survivor.gender}
              posko={survivor.posko}
              timestamp={recordedTime || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              emergencyReasons={
                analysisResult && analysisResult.indicators.length > 0
                  ? analysisResult.indicators
                  : [
                      'SRQ-20 Butir #17: Apakah Anda mempunyai pikiran untuk mengakhiri hidup Anda? (JAWABAN: YA)',
                      'Sesuai protokol keselamatan RAPID-MIND, terdeteksinya pikiran mengakhiri hidup seketika mengunci status pasien ke T0-SUSPECT tanpa menunggu perhitungan skor akhir.',
                    ]
              }
              volunteerNotes={
                analysisResult
                  ? `Hasil Triase: T0-SUSPECT. ${analysisResult.explanation}`
                  : 'Penyintas mengonfirmasi adanya pikiran untuk mengakhiri hidup pada saat penapisan SRQ-20.'
              }
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
