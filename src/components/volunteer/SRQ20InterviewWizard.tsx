import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
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
  const { addAssessment } = useAssessment();

  const [wizardStep, setWizardStep] = useState<'interview' | 'functional' | 'result'>('interview');
  const [interviewMode, setInterviewMode] = useState<'verbal' | 'non_verbal'>('verbal');
  const [showItem17Alert, setShowItem17Alert] = useState<boolean>(false);
  const [activeSessionRecordId, setActiveSessionRecordId] = useState<string | null>(null);

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

  const liveIntegratedScore = totalSRQScore + riskFactorScoreTotal + functionalScoreTotal;

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

        {wizardStep === 'interview' && (
          <button
            type="button"
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition min-h-[44px] flex items-center gap-1 text-xs font-semibold"
            title="Kembali ke Beranda Relawan"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Kembali</span>
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
                className={`p-4 sm:p-6 rounded-3xl border-2 transition space-y-4 shadow-xs ${
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
                  <div className="p-3 bg-red-50 border border-red-300 rounded-2xl flex items-start gap-2.5 text-red-950">
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
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1">
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
                    className={`min-h-[56px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                      answers[currentQ.id] === false
                        ? 'bg-slate-800 text-white border-2 border-slate-800 shadow-md ring-2 ring-slate-400/40'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 shadow-xs'
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
                    className={`min-h-[56px] rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition active:scale-[0.98] ${
                      answers[currentQ.id] === true
                        ? currentQ.isRedFlag
                          ? 'bg-red-600 text-white border-2 border-red-600 shadow-md ring-2 ring-red-400/40'
                          : 'bg-blue-600 text-white border-2 border-blue-600 shadow-md ring-2 ring-blue-400/40'
                        : currentQ.isRedFlag
                          ? 'bg-white hover:bg-red-50 text-red-700 border-2 border-red-300 shadow-xs'
                          : 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-300 shadow-xs'
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

                {/* PREV / NEXT QUESTION CONTROLS (MIN-H 52PX) */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="flex-1 sm:flex-initial px-4 min-h-[52px] rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.99] disabled:opacity-30 disabled:pointer-events-none text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200 transition shadow-xs"
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
                      className="flex-1 sm:flex-initial px-5 min-h-[52px] rounded-2xl bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs"
                    >
                      <span>Berikutnya</span>
                      <ArrowRight className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProceedToFunctional}
                      className={`flex-1 sm:flex-initial px-5 min-h-[52px] rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-xs ${
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
                    ? 'Lanjut ke Evaluasi Faktor Risiko & Fungsi (Screen 6) →'
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
