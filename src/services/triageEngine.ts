import { TriageZone, TriageTier, TriageAnalysisResult } from '../types/assessment';
import { SRQ20_QUESTIONS } from '../data/srq20Questions';
import { RISK_FACTOR_ITEMS } from '../data/riskAndFunctionalAssessment';

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
  { term: 'bunuh diri', category: 'critical', label: 'Ideasi bunuh diri (Suicide ideation)' },
  { term: 'mati', category: 'critical', label: 'Ideasi ingin mati' },
  { term: 'nyerah', category: 'critical', label: 'Ungkapan menyerah hidup' },
  { term: 'nyusul', category: 'critical', label: 'Ungkapan ingin menyusul' },
  { term: 'suicide', category: 'critical', label: 'Suicidal intent' },
  { term: 'halusinasi', category: 'critical', label: 'Halusinasi / Delusi' },
  { term: 'disosiasi', category: 'critical', label: 'Disosiasi berat / Katatonia' },

  // Moderate distress indicators (Yellow)
  { term: 'takut', category: 'yellow', label: 'Takut (Fear)' },
  { term: 'was-was', category: 'yellow', label: 'Was-was (Apprehension)' },
  { term: 'gampang kaget', category: 'yellow', label: 'Gampang kaget' },
  { term: 'cemas', category: 'yellow', label: 'Cemas (Anxiety)' },
  { term: 'tegang', category: 'yellow', label: 'Tegang (Tension)' },
  { term: 'panik', category: 'yellow', label: 'Panik (Panic)' },
  { term: 'bingung', category: 'yellow', label: 'Bingung / Linglung' },
  { term: 'linglung', category: 'yellow', label: 'Linglung' },
  { term: 'sedih', category: 'yellow', label: 'Sedih mendalam' },
  { term: 'hampa', category: 'yellow', label: 'Perasaan hampa' },
  { term: 'menangis', category: 'yellow', label: 'Menangis terus' },
  { term: 'nangis', category: 'yellow', label: 'Nangis terus' },
  { term: 'gemetar', category: 'yellow', label: 'Gemetar / Tremor fisik' },
  { term: 'deg-degan', category: 'yellow', label: 'Dada berdebar-debar' },
  { term: 'mual', category: 'yellow', label: 'Mual psikosomatik' },
  { term: 'tidak nafsu makan', category: 'yellow', label: 'Penurunan nafsu makan' },
  { term: 'males makan', category: 'yellow', label: 'Kehilangan selera makan' },
  { term: 'gak bisa tidur', category: 'yellow', label: 'Insomnia / Gangguan tidur' },
  { term: 'lelah terus', category: 'yellow', label: 'Kelelahan psikis kronis' },
];

/**
 * Scan transcript and detect matched SRQ-20 question IDs via NLP keywords
 * Sesuai daftar kata kunci dokumen panduan wawancara relawan
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
  statusTitle: string;
  totalIntegratedScore: number;
  srqScore: number;
  riskFactorScore: number;
  functionalScore: number;
  reason: string;
  recommendation: string;
  emergencyStatus?: 'T0-Suspect' | 'T0-Confirmed' | 'Downgraded';
}

/**
 * SATU SUMBER LOGIKA TRIASE TERPUSAT (Single Source of Truth)
 * Sesuai Dokumen Resmi RAPID-MIND Full Paper:
 *
 * Formula:
 * Total Integrated Score = Skor SRQ20 (0-20) + Skor Risk Factor (0-8) + Skor Functional (0-9)
 * Rentang Total Skor: 0 - 37 Point
 *
 * THRESHOLD:
 * 1. T0 (CRITICAL EMERGENCY): Red Flag = true OR SRQ-20 Item #17 = "Ya"
 *    -> Bypassing Score Engine. Status: T0-Suspect.
 * 2. T1 (HIGH RISK): Total Integrated Score >= 15 Point (ATAU Skor Keberfungsian F >= 6 Point)
 *    -> Status: "Recommendation for Priority Clinical Assessment"
 * 3. T2 (MODERATE RISK): Total Integrated Score 7 – 14 Point
 *    -> Status: "Recommendation for Psychosocial Follow-Up"
 * 4. T3 (LOW RISK): Total Integrated Score 0 – 6 Point
 *    -> Status: "Routine Community Support"
 */
export function calculateIntegratedTriage(
  srqScore: number,
  item17: boolean,
  riskFactorScore: number = 0,
  functionalScore: number = 0,
  redFlag: boolean = false
): CentralTriageDecision {
  const totalIntegratedScore = srqScore + riskFactorScore + functionalScore;

  // 1. T0 EMERGENCY: Bypassing Score Engine
  if (redFlag || item17) {
    return {
      tier: 'T0',
      zone: 'RED',
      statusTitle: 'T0 Critical Emergency (Red Flag Override)',
      totalIntegratedScore,
      srqScore,
      riskFactorScore,
      functionalScore,
      reason: redFlag
        ? 'Floating Red Flag Emergency aktif (Krisis bunuh diri, psikosis akut, amuk/agitasi, atau kegawatan medis). Sistem langsung mengunci ke status T0-Suspect (Bypassing Score Engine).'
        : 'SRQ-20 Butir #17 bernilai YA (Ideasi Mengakhiri Hidup / Bunuh Diri). Otomatis dialihkan ke status T0-Suspect tanpa menunggu kalkulasi skor akhir.',
      recommendation: getTierRecommendedAction('T0'),
      emergencyStatus: 'T0-Suspect',
    };
  }

  // 2. T1 HIGH RISK: Total Integrated Score >= 15 Point ATAU Skor Keberfungsian F >= 6 Point
  if (totalIntegratedScore >= 15 || functionalScore >= 6) {
    return {
      tier: 'T1',
      zone: 'RED',
      statusTitle: 'Recommendation for Priority Clinical Assessment',
      totalIntegratedScore,
      srqScore,
      riskFactorScore,
      functionalScore,
      reason: `Tingkat Risiko Tinggi (T1): Total Skor Integrasi = ${totalIntegratedScore}/37 (SRQ: ${srqScore}, Risiko: ${riskFactorScore}, Fungsi: ${functionalScore}). ${
        functionalScore >= 6
          ? 'Terdapat kelumpuhan fungsi harian berat (Skor F >= 6).'
          : 'Total skor melampaui ambang batas klinis (>= 15).'
      } Penyintas mengalami distres emosional berat yang memerlukan asesmen klinis prioritas.`,
      recommendation: getTierRecommendedAction('T1'),
    };
  }

  // 3. T2 MODERATE RISK: Total Integrated Score 7 – 14 Point
  if (totalIntegratedScore >= 7 && totalIntegratedScore <= 14) {
    return {
      tier: 'T2',
      zone: 'YELLOW',
      statusTitle: 'Recommendation for Psychosocial Follow-Up',
      totalIntegratedScore,
      srqScore,
      riskFactorScore,
      functionalScore,
      reason: `Tingkat Risiko Sedang (T2): Total Skor Integrasi = ${totalIntegratedScore}/37 (SRQ: ${srqScore}, Risiko: ${riskFactorScore}, Fungsi: ${functionalScore}). Distres emosional tingkat sedang atau skor SRQ sedang yang diperberat faktor kerentanan posko.`,
      recommendation: getTierRecommendedAction('T2'),
    };
  }

  // 4. T3 LOW RISK: Total Integrated Score 0 – 6 Point
  return {
    tier: 'T3',
    zone: 'GREEN',
    statusTitle: 'Routine Community Support',
    totalIntegratedScore,
    srqScore,
    riskFactorScore,
    functionalScore,
    reason: `Tingkat Risiko Rendah (T3): Total Skor Integrasi = ${totalIntegratedScore}/37 (SRQ: ${srqScore}, Risiko: ${riskFactorScore}, Fungsi: ${functionalScore}). Gejala emosional tergolong wajar pascabencana, keberfungsian harian mandiri, dan adaptif/resilien.`,
    recommendation: getTierRecommendedAction('T3'),
  };
}

/**
 * Backward compatibility wrapper for calculateTriage
 */
export function calculateTriage(
  srqScore: number,
  item17: boolean,
  functionalScore: number,
  redFlag: boolean
): CentralTriageDecision {
  return calculateIntegratedTriage(srqScore, item17, 0, functionalScore, redFlag);
}

/**
 * Evaluator for Complete Integrated Assessment (SRQ-20 + Risk Factors + Functional Domains)
 */
export function evaluateIntegratedAssessment(
  yesQuestionIds: number[] = [],
  selectedRiskFactorIds: string[] = [],
  functionalScoresMap: Record<string, number> = {},
  isManualRedFlag: boolean = false
): TriageAnalysisResult {
  const srqScore = yesQuestionIds.length;
  const isQuestion17Yes = yesQuestionIds.includes(17);
  const criticalTriggered = isManualRedFlag || isQuestion17Yes;

  // Calculate Risk Factor Score (Bagian A: max 8)
  let riskFactorScore = 0;
  for (const rfId of selectedRiskFactorIds) {
    const item = RISK_FACTOR_ITEMS.find((r) => r.id === rfId);
    if (item) {
      riskFactorScore += item.points;
    }
  }

  // Calculate Functional Impairment Score (Bagian B: max 9)
  let functionalScore = 0;
  Object.values(functionalScoresMap).forEach((pts) => {
    functionalScore += pts || 0;
  });

  const decision = calculateIntegratedTriage(
    srqScore,
    isQuestion17Yes,
    riskFactorScore,
    functionalScore,
    isManualRedFlag
  );

  const indicators: string[] = [];

  // Add question indicator labels
  for (const qId of yesQuestionIds) {
    const qObj = SRQ20_QUESTIONS.find((item) => item.id === qId);
    if (qObj) {
      indicators.push(`SRQ-${qObj.id}: ${qObj.text.replace('Apakah Anda ', '').replace('Apakah Sdr ', '').replace('?', '')}`);
    }
  }

  // Add Risk Factor indicators
  for (const rfId of selectedRiskFactorIds) {
    const rfObj = RISK_FACTOR_ITEMS.find((item) => item.id === rfId);
    if (rfObj) {
      indicators.push(`Faktor Risiko [${rfObj.code}]: ${rfObj.title} (+${rfObj.points}pt)`);
    }
  }

  // Add Functional Domain indicators
  Object.entries(functionalScoresMap).forEach(([fDomain, pts]) => {
    if (pts > 0) {
      indicators.push(`Hendaya [${fDomain}]: ${pts === 3 ? 'Lumpuh / Ekstrem (3pt)' : 'Terganggu Sedang (1pt)'}`);
    }
  });

  return {
    zone: decision.zone,
    triageTier: decision.tier,
    score: srqScore,
    riskFactorScore,
    functionalScore,
    totalIntegratedScore: decision.totalIntegratedScore,
    statusTitle: decision.statusTitle,
    indicators,
    criticalTriggered,
    recommendedAction: decision.recommendation,
    explanation: decision.reason,
  };
}

/**
 * Backward compatibility evaluator for SRQ20
 */
export function evaluateSRQ20(
  yesQuestionIds: number[] = [],
  functionalIds: string[] = [],
  isManualRedFlag: boolean = false
): TriageAnalysisResult {
  const fakeFunctionalMap: Record<string, number> = {};
  functionalIds.forEach((id, idx) => {
    fakeFunctionalMap[`F${idx + 1}`] = 1;
  });
  return evaluateIntegratedAssessment(yesQuestionIds, [], fakeFunctionalMap, isManualRedFlag);
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
      return '🚨 T0 EMERGENCY: Sinyal darurat terkirim real-time ke PSC 119 & RS Rujukan. JANGAN tinggalkan penyintas sendirian secara fisik! Dampingi terus, amankan benda berbahaya di sekitar, dan koordinasikan penjemputan ambulans via Tele-Emergency.';
    case 'T1':
      return '🔴 T1 (Recommendation for Priority Clinical Assessment): Prioritas Rujukan ke Faskes Role 2 (Puskesmas/Dokter/Psikiater). Perlu evaluasi medis dan kemungkinan intervensi farmakoterapi/psikoterapi intensif.';
    case 'T2':
      return '🟡 T2 (Recommendation for Psychosocial Follow-Up): Masukkan ke Daftar Pantau Utama Posko (Watchlist). Intervensi Konseling Kelompok, Stress Management, dan pendampingan oleh Perawat/Tenaga Kesehatan Terlatih Faskes. Re-evaluasi ulang dalam 7 hari.';
    case 'T3':
    default:
      return '🟢 T3 (Routine Community Support): Penyintas dalam kondisi adaptif/resilien. Berikan Dukungan Psikososial Komunitas (PFA Lanjutan), libatkan dalam kegiatan sosial gotong royong posko, dan penuhi kebutuhan logistik dasarnya.';
  }
}

export function getTierExplanation(tier: TriageTier, score: number, hasCritical: boolean): string {
  if (tier === 'T0' || hasCritical) {
    return 'Terdeteksi tanda bahaya darurat (ideasi bunuh diri, psikosis akut, amuk/agitasi berat, atau krisis somatik). Sistem langsung mengunci ke status T0-Suspect (Bypassing Score Engine).';
  }
  if (tier === 'T1') {
    return 'Penyintas mengalami distres emosional berat yang disertai dengan kelumpuhan fungsi harian atau memiliki tumpukan faktor risiko trauma yang sangat masif.';
  }
  if (tier === 'T2') {
    return 'Distres emosional tingkat sedang (gejala kecemasan/somatik menonjol) atau skor SRQ-20 sedang yang diperberat oleh faktor risiko tinggi.';
  }
  return 'Gejala emosional tergolong wajar pascabencana, keberfungsian harian masih terjaga mandiri, dan tidak memiliki faktor risiko laten yang mengancam.';
}
