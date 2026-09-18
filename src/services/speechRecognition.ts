/**
 * Dedicated Speech-to-Text (STT) Service for RAPID-MIND
 * Wraps browser MediaDevices and SpeechRecognition API with robust error handling and cleanup.
 */

export interface SpeechRecognitionOptions {
  language?: string; // default 'id-ID'
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (errorMessage: string, errorType: 'permission' | 'unsupported' | 'no-speech' | 'network' | 'unknown') => void;
  onEnd?: () => void;
}

export interface SpeechSession {
  stop: () => void;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function isMicrophoneSupported(): boolean {
  return typeof navigator !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (!isMicrophoneSupported()) {
    throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
  }
  return await navigator.mediaDevices.getUserMedia({ audio: true });
}

export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {
        console.warn('Error stopping audio track', e);
      }
    });
  } catch (e) {
    console.warn('Error accessing tracks on stream', e);
  }
}

/**
 * Starts a live Speech Recognition session coupled with MediaStream management.
 */
export function startLiveSpeechRecognition(
  audioStream: MediaStream,
  options: SpeechRecognitionOptions
): SpeechSession {
  if (!isSpeechRecognitionSupported()) {
    stopMediaStream(audioStream);
    options.onError?.('Speech recognition is not supported in this browser.', 'unsupported');
    return { stop: () => {} };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = options.language || 'id-ID';
  recognition.maxAlternatives = 1;

  let accumulatedFinal = '';
  let isManuallyStopped = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript || '';
      if (result.isFinal) {
        finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
      } else {
        interimTranscript += (interimTranscript ? ' ' : '') + text.trim();
      }
    }

    const currentCombined = [finalTranscript, interimTranscript].filter(Boolean).join(' ');
    options.onInterim?.(currentCombined);

    if (finalTranscript) {
      options.onFinal?.(finalTranscript);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    if (isManuallyStopped) return;
    console.warn('Speech recognition error event:', event.error);

    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      options.onError?.('Microphone access is required for live speech recognition.', 'permission');
    } else if (event.error === 'no-speech') {
      // User hasn't spoken yet or paused - do not hard-error, let timer and stream continue
      console.log('No speech detected in interval.');
    } else if (event.error === 'audio-capture') {
      options.onError?.('No microphone detected or audio capture failed.', 'permission');
    } else if (event.error === 'network') {
      options.onError?.('Speech recognition network error occurred.', 'network');
    } else {
      options.onError?.(`Speech recognition error: ${event.error}`, 'unknown');
    }
  };

  recognition.onend = () => {
    stopMediaStream(audioStream);
    options.onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    console.error('Failed to start speech recognition engine:', err);
    stopMediaStream(audioStream);
    options.onError?.('Failed to start speech recognition engine.', 'unknown');
  }

  return {
    stop: () => {
      isManuallyStopped = true;
      try {
        recognition.stop();
      } catch (e) {
        // already stopped
      }
      stopMediaStream(audioStream);
    },
  };
}
