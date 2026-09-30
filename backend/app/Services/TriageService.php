<?php

namespace App\Services;

class TriageService
{
    /**
     * SATU SUMBER LOGIKA TRIASE TERPUSAT (Single Source of Truth)
     * Sesuai Dokumen Resmi RAPID-MIND Full Paper & Alur RapidMind.md:
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
    public function evaluateIntegratedAssessment(
        int $srqScore,
        bool $item17 = false,
        int $riskFactorScore = 0,
        int $functionalScore = 0,
        bool $redFlag = false
    ): array {
        $totalIntegratedScore = $srqScore + $riskFactorScore + $functionalScore;

        // 1. T0 EMERGENCY: Bypassing Score Engine
        if ($redFlag || $item17) {
            return [
                'tier' => 'T0',
                'zone' => 'RED',
                'statusTitle' => 'T0 Critical Emergency (Red Flag Override)',
                'totalIntegratedScore' => $totalIntegratedScore,
                'srqScore' => $srqScore,
                'riskFactorScore' => $riskFactorScore,
                'functionalScore' => $functionalScore,
                'reason' => $redFlag
                    ? 'Floating Red Flag Emergency aktif (Krisis bunuh diri, psikosis akut, amuk/agitasi, atau kegawatan medis). Sistem langsung mengunci ke status T0-Suspect (Bypassing Score Engine).'
                    : 'SRQ-20 Butir #17 bernilai YA (Ideasi Mengakhiri Hidup / Bunuh Diri). Otomatis dialihkan ke status T0-Suspect tanpa menunggu kalkulasi skor akhir.',
                'recommendation' => 'T0 EMERGENCY (RED FLAG OVERRIDE): Sinyal SOS darurat aktif ke PSC 119 dan Faskes. Dampingi fisik tanpa jeda (JANGAN ditinggalkan sendirian), amankan benda tajam/bahaya, dan siagakan panggilan Tele-Emergency.',
                'emergencyStatus' => 'T0-Suspect',
                'criticalTriggered' => true,
            ];
        }

        // 2. T1 HIGH RISK: Total Integrated Score >= 15 Point ATAU Skor Keberfungsian F >= 6 Point
        if ($totalIntegratedScore >= 15 || $functionalScore >= 6) {
            $reason = "Tingkat Risiko Tinggi (T1): Total Skor Integrasi = {$totalIntegratedScore}/37 (SRQ: {$srqScore}, Risiko: {$riskFactorScore}, Fungsi: {$functionalScore}). "
                . ($functionalScore >= 6 ? 'Terdapat kelumpuhan fungsi harian berat (Skor F >= 6).' : 'Total skor melampaui ambang batas klinis (>= 15).')
                . ' Penyintas mengalami distres emosional berat yang memerlukan asesmen klinis prioritas.';

            return [
                'tier' => 'T1',
                'zone' => 'RED',
                'statusTitle' => 'Recommendation for Priority Clinical Assessment',
                'totalIntegratedScore' => $totalIntegratedScore,
                'srqScore' => $srqScore,
                'riskFactorScore' => $riskFactorScore,
                'functionalScore' => $functionalScore,
                'reason' => $reason,
                'recommendation' => 'Prioritas Asesmen Klinis: Rujuk ke Fasilitas Pelayanan Kesehatan / Dokter Spesialis Kedokteran Jiwa (Sp.KJ) / Psikolog Klinis untuk evaluasi komprehensif dan intervensi medis/psikoterapi.',
                'emergencyStatus' => null,
                'criticalTriggered' => false,
            ];
        }

        // 3. T2 MODERATE RISK: Total Integrated Score 7 – 14 Point
        if ($totalIntegratedScore >= 7 && $totalIntegratedScore <= 14) {
            return [
                'tier' => 'T2',
                'zone' => 'YELLOW',
                'statusTitle' => 'Recommendation for Psychosocial Follow-Up',
                'totalIntegratedScore' => $totalIntegratedScore,
                'srqScore' => $srqScore,
                'riskFactorScore' => $riskFactorScore,
                'functionalScore' => $functionalScore,
                'reason' => "Tingkat Risiko Sedang (T2): Total Skor Integrasi = {$totalIntegratedScore}/37 (SRQ: {$srqScore}, Risiko: {$riskFactorScore}, Fungsi: {$functionalScore}). Distres emosional tingkat sedang atau skor SRQ sedang yang diperberat faktor kerentanan posko.",
                'recommendation' => 'Daftar Pantau Utama Posko (Watchlist): Masukkan ke dalam kelompok dukungan psikososial komunitas, edukasi manajemen stres/relaksasi, serta jadwalkan pemantauan berkala (re-asesmen 7 hari).',
                'emergencyStatus' => null,
                'criticalTriggered' => false,
            ];
        }

        // 4. T3 LOW RISK: Total Integrated Score 0 – 6 Point
        return [
            'tier' => 'T3',
            'zone' => 'GREEN',
            'statusTitle' => 'Routine Community Support',
            'totalIntegratedScore' => $totalIntegratedScore,
            'srqScore' => $srqScore,
            'riskFactorScore' => $riskFactorScore,
            'functionalScore' => $functionalScore,
            'reason' => "Tingkat Risiko Rendah (T3): Total Skor Integrasi = {$totalIntegratedScore}/37 (SRQ: {$srqScore}, Risiko: {$riskFactorScore}, Fungsi: {$functionalScore}). Gejala emosional dalam batas adaptasi wajar bencana dan keberfungsian harian mandiri.",
            'recommendation' => 'Dukungan Komunitas Rutin: Penyintas dalam kondisi adaptif/resilien. Cukup berikan informasi bantuan kebutuhan dasar, libatkan dalam kegiatan gotong-royong posko, dan pantau secara berkala.',
            'emergencyStatus' => null,
            'criticalTriggered' => false,
        ];
    }
}
