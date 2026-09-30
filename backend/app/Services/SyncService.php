<?php

namespace App\Services;

use App\Models\Assessment;
use App\Models\Survivor;
use Illuminate\Support\Facades\DB;

class SyncService
{
    protected TriageService $triageService;
    protected EmergencyService $emergencyService;

    public function __construct(TriageService $triageService, EmergencyService $emergencyService)
    {
        $this->triageService = $triageService;
        $this->emergencyService = $emergencyService;
    }

    /**
     * Idempotently process a batch of offline assessments.
     */
    public function syncBatch(array $records): array
    {
        $synced = [];
        $skipped = [];
        $errors = [];

        DB::transaction(function () use ($records, &$synced, &$skipped, &$errors) {
            foreach ($records as $item) {
                try {
                    $recordId = $item['recordId'] ?? $item['id'] ?? null;
                    $clientEventId = $item['clientEventId'] ?? $recordId;

                    // Idempotency: check if already exists by record_id or client_event_id
                    $existing = null;
                    if ($recordId) {
                        $existing = Assessment::where('record_id', $recordId)->first();
                    }
                    if (!$existing && $clientEventId) {
                        $existing = Assessment::where('client_event_id', $clientEventId)->first();
                    }

                    if ($existing) {
                        $skipped[] = $existing->record_id;
                        continue;
                    }

                    // Ensure survivor exists
                    $victimId = $item['victimId'] ?? $item['id'] ?? ('VCT-' . date('Y') . '-000001');
                    $victimName = $item['name'] ?? $item['victimName'] ?? 'Penyintas Lapangan';
                    $location = $item['posko'] ?? $item['location'] ?? 'Posko A';
                    $survivor = Survivor::find($victimId);
                    if (!$survivor) {
                        $survivor = Survivor::create([
                            'id' => $victimId,
                            'nik' => $item['nik'] ?? null,
                            'name' => $victimName,
                            'age' => (string) ($item['age'] ?? $item['victimAge'] ?? '30'),
                            'gender' => $item['gender'] ?? $item['victimGender'] ?? 'P',
                            'category' => $item['category'] ?? $item['victimCategory'] ?? 'Dewasa',
                            'posko' => $location,
                            'registered_at' => now(),
                            'current_phase' => $item['phase'] ?? 'followup_srq20',
                            'triage_tier' => $item['triageTier'] ?? 'T3',
                            't0_status' => $item['t0Status'] ?? null,
                        ]);
                    }

                    // Server-side authoritative validation of triage scores
                    $srqScore = (int) ($item['srqScore'] ?? $item['score'] ?? 0);
                    $item17 = in_array(17, $item['srq20YesList'] ?? []) || !empty($item['criticalTriggered']);
                    $riskScore = (int) ($item['riskScore'] ?? $item['riskFactorScore'] ?? 0);
                    $funcScore = (int) ($item['functionalScore'] ?? $item['functionalScoreTotal'] ?? 0);
                    $isRedFlag = !empty($item['criticalTriggered']) || ($item['triageTier'] ?? '') === 'T0';

                    $triage = $this->triageService->evaluateIntegratedAssessment(
                        $srqScore,
                        $item17,
                        $riskScore,
                        $funcScore,
                        $isRedFlag
                    );

                    $assessment = Assessment::create([
                        'record_id' => $recordId ?: ('ASM-' . date('Y') . '-' . str_pad((string) (Assessment::count() + 1), 6, '0', STR_PAD_LEFT)),
                        'client_event_id' => $clientEventId,
                        'victim_id' => $survivor->id,
                        'nik' => $item['nik'] ?? $survivor->nik,
                        'timestamp' => $item['timestamp'] ?? date('H:i'),
                        'location' => $item['location'] ?? $survivor->posko,
                        'method' => $item['method'] ?? 'VERBAL',
                        'phase' => $item['phase'] ?? 'followup_srq20',
                        'zone' => $triage['zone'],
                        'triage_tier' => $triage['tier'],
                        't0_status' => $triage['emergencyStatus'],
                        'score' => $srqScore,
                        'indicators' => $item['indicators'] ?? [],
                        'critical_triggered' => $triage['criticalTriggered'],
                        'transcript' => $item['transcript'] ?? null,
                        'checklist_selections' => $item['checklistSelections'] ?? [],
                        'srq20_yes_list' => $item['srq20YesList'] ?? [],
                        'functional_selections' => $item['functionalSelections'] ?? [],
                        'risk_factor_selections' => $item['riskFactorSelections'] ?? [],
                        'risk_factor_score' => $riskScore,
                        'functional_scores' => $item['functionalScores'] ?? null,
                        'functional_score_total' => $funcScore,
                        'total_integrated_score' => $triage['totalIntegratedScore'],
                        'status_title' => $triage['statusTitle'],
                        'recommended_action' => $triage['recommendation'],
                        'sync_status' => 'synced',
                        'volunteer_notes' => $item['volunteerNotes'] ?? null,
                        'volunteer_id' => $item['volunteerId'] ?? null,
                        'victim_name' => $item['victimName'] ?? $survivor->name,
                        'victim_age' => (string) ($item['victimAge'] ?? $survivor->age),
                        'victim_gender' => $item['victimGender'] ?? $survivor->gender,
                        'victim_category' => $item['victimCategory'] ?? $survivor->category,
                    ]);

                    // Update survivor summary
                    $survivor->update([
                        'srq20_score' => $srqScore,
                        'triage_tier' => $triage['tier'],
                        't0_status' => $triage['emergencyStatus'],
                        'current_phase' => 'followup_srq20',
                    ]);

                    // If emergency T0, trigger emergency alert
                    if ($triage['tier'] === 'T0') {
                        $this->emergencyService->createEmergency([
                            'id' => 'EMG-' . $assessment->record_id,
                            'clientEventId' => $clientEventId,
                            'recordId' => $assessment->record_id,
                            'survivorId' => $survivor->id,
                            'survivorName' => $survivor->name,
                            'posko' => $assessment->location,
                            'emergencyReasons' => $item['indicators'] ?? ['T0 Emergency'],
                            'volunteerNotes' => $item['volunteerNotes'] ?? null,
                        ], $item['volunteerId'] ?? null);
                    }

                    $synced[] = $assessment->toFrontendArray();
                } catch (\Throwable $e) {
                    $errors[] = [
                        'record' => $item['recordId'] ?? $item['id'] ?? 'unknown',
                        'error' => $e->getMessage(),
                    ];
                }
            }
        });

        return [
            'syncedCount' => count($synced),
            'skippedCount' => count($skipped),
            'syncedRecords' => $synced,
            'errors' => $errors,
        ];
    }
}
