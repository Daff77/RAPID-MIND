import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import { LocationPost, TriageAnalysisResult } from '../../types/assessment';
import { analyzeTranscript } from '../../services/triageEngine';
import { PRESET_TRANSCRIPTS, PresetTranscript } from '../../services/speechSimulation';
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
  initialTranscript?: string;
  onAnalysisComplete: (result: TriageAnalysisResult, transcript: string) => void;
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

export const VerbalAssessment: React.FC<VerbalAssessmentProps> = ({
  victimId,
  location,
  initialTranscript,
  onAnalysisComplete,
  onBack,
}) => {
  const [uiState, setUiState] = useState<VerbalUIState>(
    initialTranscript ? 'TRANSCRIPT' : 'READY'
  );
  const [transcript, setTranscript] = useState<string>(initialTranscript || '');
  const [liveInterimText, setLiveInterimText] = useState<string>('');
  const [language, setLanguage] = useState<'id-ID' | 'en-US'>('id-ID');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [showDemoOptions, setShowDemoOptions] = useState<boolean>(false);

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

  const handleStartRealRecording = async () => {
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
        onError: (errMsg, errType) => {
          if (errType === 'permission') {
            cleanupAudioSession();
            setErrorMessage('Microphone access denied.');
            setUiState('PERMISSION_ERROR');
          } else if (errType === 'unsupported') {
            cleanupAudioSession();
            setUiState('UNSUPPORTED');
          }
        },
      });

      activeSessionRef.current = session;
      setUiState('RECORDING');
    } catch (err: any) {
      cleanupAudioSession();
      setErrorMessage('Microphone access is required.');
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

  const handleSelectDemoPreset = (preset: PresetTranscript) => {
    cleanupAudioSession();
    setTranscript(preset.transcript);
    setShowDemoOptions(false);
    setUiState('TRANSCRIPT');
  };

  const handleAnalyze = () => {
    if (!transcript.trim()) return;
    const analysis = analyzeTranscript(transcript);
    onAnalysisComplete(analysis, transcript);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs">
      {/* Context & Language Switcher */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900">{victimId}</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-medium">{location}</span>
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
            ID
          </button>
          <button
            type="button"
            disabled={uiState === 'RECORDING'}
            onClick={() => setLanguage('en-US')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              language === 'en-US' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* STATE: READY */}
      {uiState === 'READY' && (
        <div className="py-4 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-800">
            "How are you feeling right now?"
          </p>

          <div className="flex flex-col items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition"
              aria-label="Start Recording"
            >
              <Mic className="w-7 h-7" />
            </button>
            <span className="text-xs font-bold text-slate-700">Start Recording</span>
          </div>
        </div>
      )}

      {/* STATE: REQUESTING PERMISSION */}
      {uiState === 'REQUESTING_PERMISSION' && (
        <div className="py-6 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Requesting microphone access...</p>
        </div>
      )}

      {/* STATE: RECORDING */}
      {uiState === 'RECORDING' && (
        <div className="py-4 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              Recording
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 tabular-numbers">
              {formatTimer(timerSeconds)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 text-left min-h-[44px]">
            {liveInterimText ? (
              <p className="font-medium italic">"{liveInterimText}"</p>
            ) : (
              <p className="text-slate-400 italic">Listening... Speak into microphone.</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleStopRecording}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Stop Recording</span>
          </button>
        </div>
      )}

      {/* STATE: PROCESSING */}
      {uiState === 'PROCESSING' && (
        <div className="py-6 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-700">Processing speech...</p>
        </div>
      )}

      {/* STATE: NO SPEECH */}
      {uiState === 'NO_SPEECH' && (
        <div className="py-3 text-center space-y-3">
          <p className="text-xs font-semibold text-slate-800">No speech detected.</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => setShowDemoOptions(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
            >
              Use Demo
            </button>
          </div>
        </div>
      )}

      {/* STATE: PERMISSION ERROR / UNSUPPORTED */}
      {(uiState === 'PERMISSION_ERROR' || uiState === 'UNSUPPORTED') && (
        <div className="py-3 text-center space-y-3">
          <p className="text-xs font-semibold text-red-700">
            {errorMessage || 'Speech recognition unavailable.'}
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleStartRealRecording}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => setShowDemoOptions(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs"
            >
              Use Demo
            </button>
          </div>
        </div>
      )}

      {/* STATE: TRANSCRIPT REVIEW & ANALYZE */}
      {uiState === 'TRANSCRIPT' && transcript && (
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Transcript
          </label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={3}
            className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded-xl p-3 text-xs sm:text-sm text-slate-900 outline-none leading-relaxed transition"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!transcript.trim()}
              className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>

            <button
              type="button"
              onClick={() => {
                cleanupAudioSession();
                setTranscript('');
                setLiveInterimText('');
                setUiState('READY');
              }}
              className="h-11 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Subtle Demo Presets Drawer */}
      <div className="pt-2 border-t border-slate-100 text-left">
        <button
          type="button"
          onClick={() => setShowDemoOptions(!showDemoOptions)}
          className="text-[11px] font-medium text-slate-400 hover:text-slate-700 transition"
        >
          {showDemoOptions ? '▾ Hide Demo Presets' : '▸ Demo Presets'}
        </button>

        {showDemoOptions && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 mt-2 animate-in fade-in">
            {PRESET_TRANSCRIPTS.slice(0, 3).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectDemoPreset(preset)}
                className="p-2 rounded-lg text-left text-xs bg-slate-50 hover:bg-blue-50 border border-slate-200 transition"
              >
                <span className="font-bold text-slate-800 block text-[11px]">
                  {preset.expectedZone}
                </span>
                <p className="text-[11px] text-slate-600 truncate italic">
                  "{preset.transcript}"
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
