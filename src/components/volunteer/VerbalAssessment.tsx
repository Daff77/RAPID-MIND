import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Lock,
  Edit3,
  ShieldAlert,
  Check,
  ClipboardList,
} from 'lucide-react';
import { LocationPost, TriageAnalysisResult, VictimData } from '../../types/assessment';
import { analyzeCombined } from '../../services/triageEngine';
import {
  isSpeechRecognitionSupported,
  isMicrophoneSupported,
  requestMicrophoneStream,
  stopMediaStream,
  startLiveSpeechRecognition,
  SpeechSession,
} from '../../services/speechRecognition';

interface VerbalAssessmentProps {
  victimId: string;
  location: LocationPost;
  victimData?: VictimData;
  isVictimDataAvailable?: boolean;
  initialTranscript?: string;
  initialChecklist?: string[];
  onAnalysisComplete: (
    result: TriageAnalysisResult,
    transcript: string,
    checklistSelections?: string[]
  ) => void;
  onBack: () => void;
}

type VerbalUIState =
  | 'READY'
  | 'REQUESTING_PERMISSION'
  | 'RECORDING'
  | 'PROCESSING'
  | 'TRANSCRIPT'
  | 'NO_SPEECH'
  | 'PERMISSION_ERROR'
  | 'UNSUPPORTED';

interface STTChecklistItem {
  id: string;
  label: string;
  isCritical?: boolean;
  category: 'critical' | 'emotional' | 'cognitive';
}

const STT_CHECKLIST_ITEMS: STTChecklistItem[] = [
  // Critical Safety & Severe Cognitive Flags (Auto-Red Zone)
  {
    id: 'cog_unresponsive',
    label: 'Tidak merespons kontak verbal (Unresponsive)',
    isCritical: true,
    category: 'critical',
  },
  {
    id: 'cog_loss_control',
    label: 'Kehilangan kendali perilaku (Loss of control)',
    isCritical: true,
    category: 'critical',
  },
  {
    id: 'safe_harm_self',
    label: 'Risiko membahayakan diri sendiri (Self-harm intent)',
    isCritical: true,
    category: 'critical',
  },
  {
    id: 'safe_harm_others',
    label: 'Risiko membahayakan orang lain (Aggression)',
    isCritical: true,
    category: 'critical',
  },
  // Emotional & Cognitive Distress Indicators (Yellow Zone)
  {
    id: 'emo_crying',
    label: 'Menangis terus-menerus / histeris (Persistent crying)',
    category: 'emotional',
  },
  {
    id: 'emo_anxiety',
    label: 'Kecemasan / panik akut (Severe panic/anxiety)',
    category: 'emotional',
  },
  {
    id: 'emo_agitation',
    label: 'Kegelisahan ekstrem & gemetar fisik (Agitation / Tremor)',
    category: 'emotional',
  },
  {
    id: 'cog_confusion',
    label: 'Disorientasi & kebingungan ruang/waktu (Confusion)',
    category: 'cognitive',
  },
];

export const VerbalAssessment: React.FC<VerbalAssessmentProps> = ({
  victimId,
  location,
  victimData,
  isVictimDataAvailable = true,
  initialTranscript,
  initialChecklist = [],
  onAnalysisComplete,
  onBack,
}) => {
  const isVictimReady =
    isVictimDataAvailable &&
    (victimData?.isAvailable || (victimData?.name && victimData.name.trim().length > 0));

  const [uiState, setUiState] = useState<VerbalUIState>(
    initialTranscript ? 'TRANSCRIPT' : 'READY'
  );
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [selectedChecklistIds, setSelectedChecklistIds] = useState<string[]>(initialChecklist);
  const [liveInterimText, setLiveInterimText] = useState<string>('');
  const [language, setLanguage] = useState<'id-ID' | 'en-US'>('id-ID');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState<boolean>(true);

  const timerIntervalRef = useRef<number | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const activeSessionRef = useRef<SpeechSession | null>(null);
  const capturedTextRef = useRef<string>('');

  const isBrowserSTTAvailable = isSpeechRecognitionSupported() && isMicrophoneSupported();

  useEffect(() => {
    return () => {
      cleanupAudioSession();
    };
  }, []);

  useEffect(() => {
    if (uiState === 'RECORDING') {
      setTimerSeconds(0);
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current !== null) clearInterval(timerIntervalRef.current);
    };
  }, [uiState]);

  const cleanupAudioSession = () => {
    if (activeSessionRef.current) {
      activeSessionRef.current.stop();
      activeSessionRef.current = null;
    }
    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = null;
    }
    if (timerIntervalRef.current !== null) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const toggleChecklistItem = (id: string) => {
    setSelectedChecklistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStartRealRecording = async () => {
    if (!isVictimReady) return;

    cleanupAudioSession();
    setLiveInterimText('');
    capturedTextRef.current = '';
    setErrorMessage(null);

    if (!isBrowserSTTAvailable) {
      setUiState('UNSUPPORTED');
      return;
    }

    setUiState('REQUESTING_PERMISSION');

    try {
      const stream = await requestMicrophoneStream();
      activeStreamRef.current = stream;

      const session = startLiveSpeechRecognition(stream, {
        language: language,
        onInterim: (interim) => {
          setLiveInterimText(interim);
          if (!capturedTextRef.current) {
            capturedTextRef.current = interim;
          }
        },
        onFinal: (finalText) => {
          capturedTextRef.current = finalText;
        },
        onError: (_errMsg, errType) => {
          if (errType === 'permission') {
            cleanupAudioSession();
            setErrorMessage('Akses mikrofon ditolak oleh browser.');
            setUiState('PERMISSION_ERROR');
          } else if (errType === 'unsupported') {
            cleanupAudioSession();
            setUiState('UNSUPPORTED');
          }
        },
      });

      activeSessionRef.current = session;
      setUiState('RECORDING');
    } catch {
      cleanupAudioSession();
      setErrorMessage('Izin mikrofon diperlukan untuk merekam suara.');
      setUiState('PERMISSION_ERROR');
    }
  };

  const handleStopRecording = () => {
    setUiState('PROCESSING');

    if (activeSessionRef.current) {
      activeSessionRef.current.stop();
    }
    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
    }

    setTimeout(() => {
      cleanupAudioSession();

      const candidateText = (
        liveInterimText.length >= capturedTextRef.current.length
          ? liveInterimText
          : capturedTextRef.current
      ).trim();

      if (candidateText.length > 0) {
        setTranscript(candidateText);
        setUiState('TRANSCRIPT');
      } else {
        setTranscript('');
        setUiState('NO_SPEECH');
      }
    }, 350);
  };

  const handleAnalyze = () => {
    if (!transcript.trim() && selectedChecklistIds.length === 0) return;
    const analysis = analyzeCombined(transcript, selectedChecklistIds);
    onAnalysisComplete(analysis, transcript, selectedChecklistIds);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const hasCriticalChecked = selectedChecklistIds.some((id) =>
    ['cog_unresponsive', 'cog_loss_control', 'safe_harm_self', 'safe_harm_others'].includes(id)
  );

  // REQUIREMENT 4: "fitur stt yang bisa digunakan setelah data korban tersedia"
  // If victim data is not available, block the STT feature with explicit instruction!
  if (!isVictimReady) {
    return (
      <div className="bg-white border border-amber-200 rounded-2xl p-6 space-y-4 shadow-2xs text-center animate-in fade-in">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-900">
            Fitur STT Belum Dapat Digunakan
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Sesuai protokol keselamatan, <strong>fitur STT (Speech-to-Text)</strong> hanya bisa digunakan setelah <strong>data korban tersedia dan diverifikasi</strong> terlebih dahulu.
          </p>
        </div>

        <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-left text-xs text-amber-900 space-y-1">
          <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
            Data Yang Wajib Tersedia:
          </span>
          <ul className="list-disc list-inside text-[11px] text-amber-900/90 space-y-0.5">
            <li>ID Korban (VCT-xxx)</li>
            <li>Nama / Inisial Lengkap Korban</li>
            <li>Usia & Kategori (Anak / Remaja / Dewasa / Lansia)</li>
            <li>Jenis Kelamin & Lokasi Posko</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onBack}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
          >
            <Edit3 className="w-4 h-4" />
            <span>Lengkapi Data Korban Sekarang</span>
          </button>
        </div>
      </div>
    );
  }

  // Victim data IS available -> STT feature is UNLOCKED and ready!
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs">
      {/* 1. Verified Victim Data Banner (Requirement 4 feedback) */}
      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-emerald-950 font-mono text-[11px]">
                {victimId}
              </span>
              <span className="text-emerald-700 font-bold truncate">
                {victimData?.name || 'Korban Terverifikasi'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-800 font-medium">
                {victimData?.age ? `${victimData.age} Th` : ''} · {victimData?.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 block truncate">
              {location} · Data Korban Tersedia (STT Aktif)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-[11px] text-emerald-800 hover:underline font-semibold shrink-0"
          title="Ubah Data Korban"
        >
          Ubah
        </button>
      </div>

      {/* Language Switcher & Audio Bar */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
          <Mic className="w-3.5 h-3.5 text-blue-600" />
          <span>Perekaman Suara (Speech-to-Text)</span>
        </div>

        {/* Compact Lang Switch */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
          <button
            type="button"
            disabled={uiState === 'RECORDING'}
            onClick={() => setLanguage('id-ID')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              language === 'id-ID' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            Bahasa Indonesia
          </button>
          <button
            type="button"
            disabled={uiState === 'RECORDING'}
            onClick={() => setLanguage('en-US')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              language === 'en-US' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* STATE: READY */}
      {uiState === 'READY' && (
        <div className="py-4 text-center space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">
              "Bagaimana perasaan dan kondisi yang Anda rasakan saat ini?"
            </p>
            <p className="text-xs text-slate-400">
              Tekan tombol mikrofon di bawah untuk mendengarkan ungkapan korban secara langsung.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition"
              aria-label="Mulai Merekam Suara"
            >
              <Mic className="w-7 h-7" />
            </button>
            <span className="text-xs font-bold text-slate-700">Mulai Rekam Suara (STT)</span>
          </div>
        </div>
      )}

      {/* STATE: REQUESTING PERMISSION */}
      {uiState === 'REQUESTING_PERMISSION' && (
        <div className="py-6 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Menghubungkan ke mikrofon perangkat...</p>
        </div>
      )}

      {/* STATE: RECORDING */}
      {uiState === 'RECORDING' && (
        <div className="py-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Sedang Merekam Suara
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 tabular-numbers">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 text-left min-h-[48px]">
            {liveInterimText ? (
              <p className="font-medium italic text-slate-900">"{liveInterimText}"</p>
            ) : (
              <p className="text-slate-400 italic">Mendengarkan ucapan... Silakan korban berbicara.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleStopRecording}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Selesai & Proses Rekaman Suara</span>
          </button>
        </div>
      )}

      {/* STATE: PROCESSING */}
      {uiState === 'PROCESSING' && (
        <div className="py-6 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Menganalisis transkrip ucapan...</p>
        </div>
      )}

      {/* STATE: NO SPEECH */}
      {uiState === 'NO_SPEECH' && (
        <div className="py-3 text-center space-y-3">
          <p className="text-xs font-semibold text-slate-800">
            Tidak ada suara yang terdeteksi dari mikrofon.
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs"
            >
              Coba Rekam Lagi
            </button>
          </div>
        </div>
      )}

      {/* STATE: PERMISSION ERROR / UNSUPPORTED */}
      {(uiState === 'PERMISSION_ERROR' || uiState === 'UNSUPPORTED') && (
        <div className="py-3 text-center space-y-3">
          <p className="text-xs font-semibold text-red-700">
            {errorMessage || 'Fitur pengenalan suara mikrofon tidak didukung browser ini.'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs"
            >
              Ulangi Izin
            </button>
          </div>
        </div>
      )}

      {/* STATE: TRANSCRIPT REVIEW (Editable) */}
      {uiState === 'TRANSCRIPT' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 block">
              Transkrip Suara Korban (Hasil STT)
            </label>
            <span className="text-[10px] text-slate-400">Dapat diedit jika perlu</span>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            placeholder="Tuliskan atau konfirmasi hasil transkrip rekaman suara di sini..."
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed transition"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                cleanupAudioSession();
                setTranscript('');
                setLiveInterimText('');
                setUiState('READY');
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Rekam ulang suara</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. REQUIREMENT 3: "saat fitur stt ada checklist box" */}
      {/* Integrated Checklist Box right on the STT Screen! */}
      <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900">
              Observasi Checklist Saat Wawancara STT
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {selectedChecklistIds.length} dicentang
            </span>
            <button
              type="button"
              onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              {isChecklistExpanded ? 'Sembunyikan' : 'Buka'}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          Centang tanda atau gejala perilaku yang teramati langsung selama wawancara suara. Checklist ini akan diintegrasikan dengan hasil STT.
        </p>

        {/* Warning if critical item is checked */}
        {hasCriticalChecked && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-900 font-semibold">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Indikator kritis terdeteksi: Otomatis memicu protokol Zona Merah (RED).</span>
          </div>
        )}

        {isChecklistExpanded && (
          <div className="space-y-3 pt-1">
            {/* Critical Checklist Section */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                🚨 Indikator Kritis & Keselamatan (Critical Safety)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {STT_CHECKLIST_ITEMS.filter((i) => i.isCritical).map((item) => {
                  const isChecked = selectedChecklistIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                        isChecked
                          ? 'bg-red-50 border-red-300 text-red-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs leading-snug">{item.label}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                          isChecked
                            ? 'bg-red-600 border-red-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Emotional & Cognitive Section */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                ⚠️ Gejala Emosional & Kognitif (Emotional & Cognitive Distress)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {STT_CHECKLIST_ITEMS.filter((i) => !i.isCritical).map((item) => {
                  const isChecked = selectedChecklistIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                        isChecked
                          ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs leading-snug">{item.label}</span>
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
            </div>
          </div>
        )}
      </div>

      {/* Primary Action Button: Analisis Gabungan STT + Checklist */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!transcript.trim() && selectedChecklistIds.length === 0}
          className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition"
        >
          <span>
            {transcript.trim() && selectedChecklistIds.length > 0
              ? 'Analisis Triase (STT + Checklist Box)'
              : transcript.trim()
              ? 'Analisis Transkrip STT'
              : 'Analisis Hasil Checklist Box'}
          </span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
