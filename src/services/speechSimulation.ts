export interface PresetTranscript {
  id: string;
  label: string;
  lang: 'id' | 'en';
  transcript: string;
  expectedZone: 'GREEN' | 'YELLOW' | 'RED';
}

export const PRESET_TRANSCRIPTS: PresetTranscript[] = [
  {
    id: 'yellow_demo',
    label: 'Scenario 2 — Yellow (Fear & Panic)',
    lang: 'en',
    transcript: "I am very scared. I don't know where my family is. I feel panicked and I can't calm down.",
    expectedZone: 'YELLOW',
  },
  {
    id: 'green_demo',
    label: 'Scenario 1 — Green (Calm Baseline)',
    lang: 'en',
    transcript: "I feel tired and a bit overwhelmed, but I am resting and my neighbor is here with me. We have clean water.",
    expectedZone: 'GREEN',
  },
  {
    id: 'red_demo',
    label: 'Scenario 3 — Red (Critical Crisis)',
    lang: 'id',
    transcript: "Saya kehilangan kendali, tidak tahu harus bagaimana lagi... rasanya mau membahayakan diri sendiri dan saya tidak merespons panggilan mereka.",
    expectedZone: 'RED',
  },
  {
    id: 'yellow_id',
    label: 'Indonesian — Yellow (Cemas & Khawatir)',
    lang: 'id',
    transcript: "Saya sangat takut dan cemas. Rumah kami rusak berat dan anak saya terus menangis, saya bingung sekali.",
    expectedZone: 'YELLOW',
  },
];

export async function simulateAudioProcessing(selectedPresetId?: string): Promise<string> {
  // Simulate natural network/STT speech model inference latency (1100ms)
  await new Promise((resolve) => setTimeout(resolve, 1100));

  if (selectedPresetId) {
    const found = PRESET_TRANSCRIPTS.find((p) => p.id === selectedPresetId);
    if (found) return found.transcript;
  }

  // Default demo transcript requested by specification:
  return "I am very scared. I don't know where my family is. I feel panicked and I can't calm down.";
}

/**
 * Optional Web Speech API integration with transparent graceful fallback
 */
export function isBrowserSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}
