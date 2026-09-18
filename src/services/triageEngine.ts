import { TriageZone, TriageAnalysisResult } from '../types/assessment';

export interface KeywordRule {
  term: string;
  category: 'critical' | 'yellow';
  label: string;
}

export const DICTIONARY_INDICATORS: KeywordRule[] = [
  // Critical safety & cognitive breakdown indicators (Red)
  { term: 'tidak merespons', category: 'critical', label: 'Tidak merespons (Unresponsive)' },
  { term: 'unresponsive', category: 'critical', label: 'Unresponsive' },
  { term: 'membahayakan diri', category: 'critical', label: 'Membahayakan diri (Self-harm risk)' },
  { term: 'harm to self', category: 'critical', label: 'Risk of harm to self' },
  { term: 'membahayakan orang lain', category: 'critical', label: 'Membahayakan orang lain (Aggression)' },
  { term: 'harm to others', category: 'critical', label: 'Risk of harm to others' },
  { term: 'kehilangan kendali', category: 'critical', label: 'Kehilangan kendali (Loss of control)' },
  { term: 'lost control', category: 'critical', label: 'Loss of behavioral control' },
  { term: 'loss of control', category: 'critical', label: 'Loss of behavioral control' },
  { term: 'bunuh diri', category: 'critical', label: 'Ideasi bunuh diri (Suicide ideation)' },
  { term: 'suicide', category: 'critical', label: 'Suicidal intent' },
  { term: 'suicidal', category: 'critical', label: 'Suicidal behavior' },
  { term: 'halusinasi', category: 'critical', label: 'Halusinasi / Delusi' },
  { term: 'hallucination', category: 'critical', label: 'Severe hallucination' },

  // Moderate distress indicators (Yellow)
  { term: 'takut', category: 'yellow', label: 'Takut (Fear)' },
  { term: 'scared', category: 'yellow', label: 'Fear / Scared' },
  { term: 'afraid', category: 'yellow', label: 'Fear / Afraid' },
  { term: 'fear', category: 'yellow', label: 'Fear' },
  { term: 'cemas', category: 'yellow', label: 'Cemas (Anxiety)' },
  { term: 'anxious', category: 'yellow', label: 'Anxious' },
  { term: 'anxiety', category: 'yellow', label: 'Severe anxiety' },
  { term: 'panik', category: 'yellow', label: 'Panik (Panic)' },
  { term: 'panic', category: 'yellow', label: 'Panic' },
  { term: 'panicked', category: 'yellow', label: 'Panicked state' },
  { term: 'bingung', category: 'yellow', label: 'Bingung (Disoriented)' },
  { term: 'confused', category: 'yellow', label: 'Confusion' },
  { term: 'disoriented', category: 'yellow', label: 'Disorientation' },
  { term: 'sedih', category: 'yellow', label: 'Sedih mendalam (Deep sadness)' },
  { term: 'sad', category: 'yellow', label: 'Profound sadness' },
  { term: 'crying', category: 'yellow', label: 'Persistent crying' },
  { term: 'menangis', category: 'yellow', label: 'Menangis terus-menerus' },
  { term: 'khawatir', category: 'yellow', label: 'Khawatir (Worry/Apprehension)' },
  { term: 'worried', category: 'yellow', label: 'Severe worry' },
  { term: 'tidak tenang', category: 'yellow', label: 'Tidak tenang (Restlessness)' },
  { term: 'restless', category: 'yellow', label: 'Restlessness' },
  { term: 'cant calm down', category: 'yellow', label: 'Inability to calm down' },
  { term: "can't calm down", category: 'yellow', label: 'Inability to calm down' },
  { term: 'gemetar', category: 'yellow', label: 'Gemetar / Tremor fisik' },
  { term: 'shaking', category: 'yellow', label: 'Physical trembling/shaking' },
  { term: 'sesak', category: 'yellow', label: 'Sesak emosional / Hiperventilasi' },
  { term: 'trauma', category: 'yellow', label: 'Reaksi trauma akut' },
];

/**
 * Deterministic Verbal Transcript Triage Evaluator
 */
export function analyzeTranscript(transcript: string): TriageAnalysisResult {
  const normalized = transcript.toLowerCase();
  const detectedLabels = new Set<string>();
  let hasCritical = false;
  let yellowScore = 0;

  for (const rule of DICTIONARY_INDICATORS) {
    if (normalized.includes(rule.term.toLowerCase())) {
      if (rule.category === 'critical') {
        hasCritical = true;
        detectedLabels.add(rule.label);
      } else {
        if (!detectedLabels.has(rule.label)) {
          detectedLabels.add(rule.label);
          yellowScore += 1;
        }
      }
    }
  }

  const indicators = Array.from(detectedLabels);
  let zone: TriageZone = 'GREEN';
  let score = yellowScore;

  if (hasCritical) {
    zone = 'RED';
    score = Math.max(score, 4);
  } else if (score >= 4) {
    zone = 'RED';
  } else if (score >= 2) {
    zone = 'YELLOW';
  } else {
    zone = 'GREEN';
  }

  return {
    zone,
    score,
    indicators,
    criticalTriggered: hasCritical,
    recommendedAction: getRecommendedAction(zone),
    explanation: getZoneExplanation(zone, indicators.length, hasCritical),
  };
}

/**
 * Deterministic Quick Checklist Triage Evaluator
 */
export function analyzeChecklist(selectedItemIds: string[]): TriageAnalysisResult {
  const criticalItems = [
    'cog_unresponsive',
    'cog_loss_control',
    'safe_harm_self',
    'safe_harm_others',
  ];

  const itemLabelMap: Record<string, string> = {
    // Emotional
    emo_crying: 'Persistent crying (Menangis terus-menerus)',
    emo_anxiety: 'Severe anxiety/panic (Kecemasan/panik parah)',
    emo_agitation: 'Extreme agitation (Kegelisahan ekstrem)',
    // Cognitive
    cog_confusion: 'Confusion/disorientation (Disorientasi/kebingungan)',
    cog_unresponsive: 'Unresponsive (Tidak merespons kontak verbal)',
    cog_loss_control: 'Loss of behavioral control (Kehilangan kendali perilaku)',
    // Safety
    safe_harm_self: 'Risk of harm to self (Risiko membahayakan diri)',
    safe_harm_others: 'Risk of harm to others (Risiko membahayakan orang lain)',
  };

  const detectedLabels: string[] = [];
  let hasCritical = false;
  let score = 0;

  for (const id of selectedItemIds) {
    const label = itemLabelMap[id] || id;
    detectedLabels.push(label);

    if (criticalItems.includes(id)) {
      hasCritical = true;
    } else {
      score += 1;
    }
  }

  let zone: TriageZone = 'GREEN';
  if (hasCritical) {
    zone = 'RED';
    score = Math.max(score, 4);
  } else if (score >= 4) {
    zone = 'RED';
  } else if (score >= 2) {
    zone = 'YELLOW';
  } else {
    zone = 'GREEN';
  }

  return {
    zone,
    score,
    indicators: detectedLabels,
    criticalTriggered: hasCritical,
    recommendedAction: getRecommendedAction(zone),
    explanation: getZoneExplanation(zone, detectedLabels.length, hasCritical),
  };
}

export function getRecommendedAction(zone: TriageZone): string {
  switch (zone) {
    case 'RED':
      return 'CRITICAL PROTOCOL: Immediate intervention under Psychological First Aid (PFA) and medical referral. Ensure physical safety, isolate from acute stressors, assign an escort, and alert Posko coordinator immediately.';
    case 'YELLOW':
      return 'PRIORITY FOLLOW-UP: Re-evaluate within 2-4 hours. Offer basic psychological grounding, hydration, verify shelter support, and connect with family members if accessible.';
    case 'GREEN':
    default:
      return 'STANDARD MONITORING: Provide basic comfort and humanitarian supplies. Direct to general community center and inform volunteer station if acute symptoms emerge.';
  }
}

export function getZoneExplanation(zone: TriageZone, indicatorCount: number, hasCritical: boolean): string {
  if (hasCritical) {
    return 'Critical safety or acute unresponsiveness flag detected. Automatic override to RED protocol irrespective of cumulative score.';
  }
  if (zone === 'RED') {
    return `Severe psychological distress detected across multiple risk dimensions (${indicatorCount} active indicators).`;
  }
  if (zone === 'YELLOW') {
    return `Moderate psychological distress indicators observed (${indicatorCount} indicators). Requires structured follow-up.`;
  }
  return indicatorCount === 0
    ? 'Baseline emotional state within standard acute stress response range.'
    : `Mild stress indicators observed (${indicatorCount} indicator). Routine humanitarian support adequate.`;
}
