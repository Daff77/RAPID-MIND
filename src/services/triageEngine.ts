import { TriageZone, TriageTier, TriageAnalysisResult } from '../types/assessment';
import { SRQ20_QUESTIONS } from '../data/srq20Questions';

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
 * Scan transcript and detect matched SRQ-20 question IDs via NLP keywords
 */
export function matchSRQ20Keywords(transcript: string): number[] {
  if (!transcript.trim()) return [];
  const normalized = transcript.toLowerCase();
  const matchedIds: number[] = [];

  for (const q of SRQ20_QUESTIONS) {
    for (const kw of q.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        if (!matchedIds.includes(q.id)) {
          matchedIds.push(q.id);
        }
        break;
      }
    }
  }

  return matchedIds;
}

export interface CentralTriageDecision {
  tier: TriageTier;
  zone: TriageZone;
  reason: string;
  recommendation: string;
  emergencyStatus?: 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded';
}

/**
 * SATU SUMBER LOGIKA TRIASE TERPUSAT (Single Source of Truth)
 * Sesuai spesifikasi Section 11:
 * calculateTriage(srqScore, item17, functionalScore, redFlag)
 *
 * Aturan:
 * - T0 (EMERGENCY): Red Flag = true OR SRQ-20 Item #17 = YES
 * - T1 (HIGH RISK): SRQ-20 >= 11 OR Functional impairment >= 3
 * - T2 (MODERATE RISK): (SRQ-20 = 6–10) OR (Functional impairment = 1–2)
 * - T3 (LOW RISK): SRQ-20 = 0–5 AND Functional impairment = 0
 */
export function calculateTriage(
  srqScore: number,
  item17: boolean,
  functionalScore: number,
  redFlag: boolean
): CentralTriageDecision {
  if (redFlag || item17) {
    return {
      tier: 'T0',
      zone: 'RED',
      reason: redFlag
        ? 'Red Flag Emergency terverifikasi via 3 Verification Gates. Otomatis masuk status T0-Suspect.'
        : 'SRQ-20 Butir #17 bernilai YA (Ideasi Bunuh Diri / Mengakhiri Hidup). Otomatis masuk status T0-Suspect tanpa menunggu skor akhir.',
      recommendation: getTierRecommendedAction('T0'),
      emergencyStatus: 'T0-Suspect',
    };
  }

  if (srqScore >= 11 || functionalScore >= 3) {
    return {
      tier: 'T1',
      zone: 'RED',
      reason: `Tingkat Risiko Tinggi (T1): Skor SRQ-20 = ${srqScore} (≥ 11) atau Hendaya Fungsi Harian = ${functionalScore} (≥ 3). Menunjukkan distres psikologis berat / risiko PTSD.`,
      recommendation: getTierRecommendedAction('T1'),
    };
  }

  if ((srqScore >= 6 && srqScore <= 10) || (functionalScore >= 1 && functionalScore <= 2)) {
    return {
      tier: 'T2',
      zone: 'YELLOW',
      reason: `Tingkat Risiko Sedang (T2): Skor SRQ-20 = ${srqScore} (6–10) atau Hendaya Fungsi Harian = ${functionalScore} (1–2). Memerlukan pendampingan PFA berkala.`,
      recommendation: getTierRecommendedAction('T2'),
    };
  }

  return {
    tier: 'T3',
    zone: 'GREEN',
    reason: `Tingkat Risiko Rendah (T3): Skor SRQ-20 = ${srqScore} (0–5) dan fungsi harian terpelihara. Reaksi adaptasi stres bencana stabil.`,
    recommendation: getTierRecommendedAction('T3'),
  };
}

/**
 * Evaluator for SRQ-20 (Fase Lanjutan Hari 4-30) + Functional Impairments
 * Uses calculateTriage as the single source of truth.
 */
export function evaluateSRQ20(
  yesQuestionIds: number[] = [],
  functionalIds: string[] = [],
  isManualRedFlag: boolean = false
): TriageAnalysisResult {
  const score = yesQuestionIds.length;
  const isQuestion17Yes = yesQuestionIds.includes(17);
  const criticalTriggered = isManualRedFlag || isQuestion17Yes;

  const indicators: string[] = [];

  // Add question indicator labels
  for (const qId of yesQuestionIds) {
    const qObj = SRQ20_QUESTIONS.find((item) => item.id === qId);
    if (qObj) {
      indicators.push(`SRQ-${qObj.id}: ${qObj.text.replace('Apakah Anda ', '').replace('?', '')}`);
    }
  }

  // Add functional impairment indicators
  for (const fId of functionalIds) {
    indicators.push(`Hendaya: ${fId.replace('func_', '')}`);
  }

  // Centralized triage calculation
  const decision = calculateTriage(score, isQuestion17Yes, functionalIds.length, isManualRedFlag);

  return {
    zone: decision.zone,
    triageTier: decision.tier,
    score,
    indicators,
    criticalTriggered,
    recommendedAction: decision.recommendation,
    explanation: decision.reason,
  };
}

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
  let tier: TriageTier = 'T3';
  let score = yellowScore;

  if (hasCritical) {
    zone = 'RED';
    tier = 'T0';
    score = Math.max(score, 4);
  } else if (score >= 4) {
    zone = 'RED';
    tier = 'T1';
  } else if (score >= 2) {
    zone = 'YELLOW';
    tier = 'T2';
  } else {
    zone = 'GREEN';
    tier = 'T3';
  }

  return {
    zone,
    triageTier: tier,
    score,
    indicators,
    criticalTriggered: hasCritical,
    recommendedAction: getTierRecommendedAction(tier),
    explanation: getTierExplanation(tier, score, hasCritical),
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
    emo_crying: 'Persistent crying (Menangis terus-menerus)',
    emo_anxiety: 'Severe anxiety/panic (Kecemasan/panik parah)',
    emo_agitation: 'Extreme agitation (Kegelisahan ekstrem)',
    cog_confusion: 'Confusion/disorientation (Disorientasi/kebingungan)',
    cog_unresponsive: 'Unresponsive (Tidak merespons kontak verbal)',
    cog_loss_control: 'Loss of behavioral control (Kehilangan kendali perilaku)',
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
  let tier: TriageTier = 'T3';

  if (hasCritical) {
    zone = 'RED';
    tier = 'T0';
    score = Math.max(score, 4);
  } else if (score >= 4) {
    zone = 'RED';
    tier = 'T1';
  } else if (score >= 2) {
    zone = 'YELLOW';
    tier = 'T2';
  } else {
    zone = 'GREEN';
    tier = 'T3';
  }

  return {
    zone,
    triageTier: tier,
    score,
    indicators: detectedLabels,
    criticalTriggered: hasCritical,
    recommendedAction: getTierRecommendedAction(tier),
    explanation: getTierExplanation(tier, score, hasCritical),
  };
}

/**
 * Combined STT + Checklist Triage Evaluator
 */
export function analyzeCombined(
  transcript: string,
  selectedItemIds: string[] = []
): TriageAnalysisResult {
  const verbalRes = transcript.trim() ? analyzeTranscript(transcript) : null;
  const checklistRes = selectedItemIds.length > 0 ? analyzeChecklist(selectedItemIds) : null;

  if (!verbalRes && !checklistRes) {
    return {
      zone: 'GREEN',
      triageTier: 'T3',
      score: 0,
      indicators: [],
      criticalTriggered: false,
      recommendedAction: getTierRecommendedAction('T3'),
      explanation: getTierExplanation('T3', 0, false),
    };
  }

  if (verbalRes && !checklistRes) return verbalRes;
  if (!verbalRes && checklistRes) return checklistRes;

  const mergedIndicatorsSet = new Set<string>([
    ...(verbalRes?.indicators || []),
    ...(checklistRes?.indicators || []),
  ]);
  const indicators = Array.from(mergedIndicatorsSet);
  const criticalTriggered = !!(verbalRes?.criticalTriggered || checklistRes?.criticalTriggered);

  let zone: TriageZone = 'GREEN';
  let tier: TriageTier = 'T3';

  if (criticalTriggered || verbalRes?.triageTier === 'T0' || checklistRes?.triageTier === 'T0') {
    zone = 'RED';
    tier = 'T0';
  } else if (verbalRes?.triageTier === 'T1' || checklistRes?.triageTier === 'T1') {
    zone = 'RED';
    tier = 'T1';
  } else if (verbalRes?.triageTier === 'T2' || checklistRes?.triageTier === 'T2') {
    zone = 'YELLOW';
    tier = 'T2';
  }

  const score = Math.max(verbalRes?.score || 0, checklistRes?.score || 0);

  return {
    zone,
    triageTier: tier,
    score,
    indicators,
    criticalTriggered,
    recommendedAction: getTierRecommendedAction(tier),
    explanation: getTierExplanation(tier, score, criticalTriggered),
  };
}

export function getTierRecommendedAction(tier: TriageTier): string {
  switch (tier) {
    case 'T0':
      return 'T0 EMERGENCY (RED FLAG): Peringatan dini instan terkirim ke PSC 119 dan RS Rujukan. Lakukan isolasi dari stresor akut, dampingi penyintas 100% tanpa jeda, koordinasikan penjemputan ambulans via tele-emergency.';
    case 'T1':
      return 'T1 HIGH RISK (SKOR SRQ-20 ≥ 11): Rujukan ke Psikolog Klinis atau Dokter Spesialis Kesehatan Jiwa (Sp.KJ). Dampingi dengan Psychological First Aid terstruktur dan jadwalkan evaluasi 24 jam.';
    case 'T2':
      return 'T2 MODERATE RISK (SKOR SRQ-20 6–10): Pendampingan PFA berlanjut oleh Resilience Coach / Relawan terlatih. Berikan teknik grounding pernapasan, pastikan kebutuhan dasar terpenuhi, re-evaluasi 3-7 hari.';
    case 'T3':
    default:
      return 'T3 LOW RISK (SKOR SRQ-20 0–5): Kondisi psikologis stabil dalam batas reaksi stres wajar pascabencana. Berikan edukasi kesehatan jiwa, libatkan dalam kegiatan gotong royong posko dan komunitas.';
  }
}

export function getTierExplanation(tier: TriageTier, score: number, hasCritical: boolean): string {
  if (tier === 'T0' || hasCritical) {
    return 'Terdeteksi tanda bahaya darurat (ideasi bunuh diri, psikosis akut, atau mutisme syok ekstrem). Otomatis dialihkan ke protokol rujukan darurat T0.';
  }
  if (tier === 'T1') {
    return `Tingkat distres psikologis tinggi (${score} indikator SRQ-20 teridentifikasi). Menunjukkan risiko depresi akut atau gangguan stres pascatrauma (PTSD).`;
  }
  if (tier === 'T2') {
    return `Tingkat distres psikologis sedang (${score} indikator SRQ-20 teridentifikasi). Membutuhkan intervensi pendampingan emosional terarah.`;
  }
  return `Tingkat distres psikologis ringan/stabil (${score} indikator). Penyintas menunjukkan resiliensi yang baik dalam fase adaptasi bencana.`;
}
