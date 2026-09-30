<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\Survivor;
use App\Services\EmergencyService;
use App\Services\SyncService;
use App\Services\TriageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AssessmentController extends Controller
{
    protected TriageService $triageService;
    protected EmergencyService $emergencyService;
    protected SyncService $syncService;

    public function __construct(
        TriageService $triageService,
        EmergencyService $emergencyService,
        SyncService $syncService
    ) {
        $this->triageService = $triageService;
        $this->emergencyService = $emergencyService;
        $this->syncService = $syncService;
    }

    /**
     * List central assessments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Assessment::query();

        if ($request->filled('tier') && $request->input('tier') !== 'ALL') {
            $query->where('triage_tier', $request->input('tier'));
        }

        if ($request->filled('location') && $request->input('location') !== 'ALL') {
            $query->where('location', $request->input('location'));
        }

        if ($request->filled('phase') && $request->input('phase') !== 'ALL') {
            $query->where('phase', $request->input('phase'));
        }

        if ($request->filled('q')) {
            $q = strtolower(trim($request->input('q')));
            $query->where(function ($b) use ($q) {
                $b->whereRaw('LOWER(victim_name) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(victim_id) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(record_id) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(location) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(transcript) LIKE ?', ["%{$q}%"]);
            });
        }

        $records = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Assessment $a) => $a->toFrontendArray());

        return response()->json([
            'assessments' => $records,
            'total' => count($records),
        ]);
    }

    /**
     * Store assessment record with authoritative triage calculation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recordId' => 'nullable|string',
            'clientEventId' => 'nullable|string',
            'id' => 'nullable|string', // survivor/victim id
            'victimId' => 'nullable|string',
            'nik' => 'nullable|string',
            'timestamp' => 'nullable|string',
            'location' => 'nullable|string',
            'posko' => 'nullable|string',
            'method' => 'nullable|string',
            'phase' => 'nullable|string',
            'score' => 'nullable|integer',
            'srqScore' => 'nullable|integer',
            'indicators' => 'nullable|array',
            'criticalTriggered' => 'nullable|boolean',
            'transcript' => 'nullable|string',
            'checklistSelections' => 'nullable|array',
            'srq20YesList' => 'nullable|array',
            'functionalSelections' => 'nullable|array',
            'riskFactorSelections' => 'nullable|array',
            'riskFactorScore' => 'nullable|integer',
            'riskScore' => 'nullable|integer',
            'functionalScores' => 'nullable|array',
            'functionalScoreTotal' => 'nullable|integer',
            'functionalScore' => 'nullable|integer',
            'volunteerNotes' => 'nullable|string',
            'volunteerId' => 'nullable|string',
            'victimName' => 'nullable|string',
            'name' => 'nullable|string',
            'victimAge' => 'nullable|string',
            'age' => 'nullable|string',
            'victimGender' => 'nullable|string',
            'gender' => 'nullable|string',
            'victimCategory' => 'nullable|string',
            'category' => 'nullable|string',
        ]);

        $victimId = $validated['victimId'] ?? $validated['id'] ?? ('VCT-' . strtoupper(\Illuminate\Support\Str::random(6)));
        $victimName = $validated['name'] ?? $validated['victimName'] ?? 'Penyintas Lapangan';
        $location = $validated['location'] ?? $validated['posko'] ?? 'Posko A';
        $method = $validated['method'] ?? 'srq20_screening';

        $survivor = Survivor::firstOrCreate(
            ['id' => $victimId],
            [
                'name' => $victimName,
                'age' => $validated['age'] ?? $validated['victimAge'] ?? '30',
                'gender' => $validated['gender'] ?? $validated['victimGender'] ?? 'P',
                'category' => $validated['category'] ?? $validated['victimCategory'] ?? 'Dewasa',
                'posko' => $location,
                'registered_at' => now(),
                'current_phase' => $validated['phase'] ?? 'followup_srq20',
            ]
        );

        // Authoritative Server-side Triage
        $srqScore = (int) ($validated['srqScore'] ?? $validated['score'] ?? 0);
        $item17 = in_array(17, $validated['srq20YesList'] ?? []) || !empty($validated['criticalTriggered']);
        $riskScore = (int) ($validated['riskScore'] ?? $validated['riskFactorScore'] ?? 0);
        $funcScore = (int) ($validated['functionalScore'] ?? $validated['functionalScoreTotal'] ?? 0);
        $isRedFlag = !empty($validated['criticalTriggered']);

        $triage = $this->triageService->evaluateIntegratedAssessment(
            $srqScore,
            $item17,
            $riskScore,
            $funcScore,
            $isRedFlag
        );

        $recordId = $validated['recordId'] ?? ('ASM-' . date('Y') . '-' . str_pad((string) (Assessment::count() + 1), 6, '0', STR_PAD_LEFT));

        $assessment = Assessment::updateOrCreate(
            ['record_id' => $recordId],
            [
                'client_event_id' => $validated['clientEventId'] ?? null,
                'victim_id' => $survivor->id,
                'nik' => $validated['nik'] ?? $survivor->nik,
                'timestamp' => $validated['timestamp'] ?? date('H:i'),
                'location' => $location,
                'method' => $method,
                'phase' => $validated['phase'] ?? 'followup_srq20',
                'zone' => $triage['zone'],
                'triage_tier' => $triage['tier'],
                't0_status' => $triage['emergencyStatus'],
                'score' => $srqScore,
                'indicators' => $validated['indicators'] ?? [],
                'critical_triggered' => $triage['criticalTriggered'],
                'transcript' => $validated['transcript'] ?? null,
                'checklist_selections' => $validated['checklistSelections'] ?? [],
                'srq20_yes_list' => $validated['srq20YesList'] ?? [],
                'functional_selections' => $validated['functionalSelections'] ?? [],
                'risk_factor_selections' => $validated['riskFactorSelections'] ?? [],
                'risk_factor_score' => $riskScore,
                'functional_scores' => $validated['functionalScores'] ?? null,
                'functional_score_total' => $funcScore,
                'total_integrated_score' => $triage['totalIntegratedScore'],
                'status_title' => $triage['statusTitle'],
                'recommended_action' => $triage['recommendation'],
                'sync_status' => 'synced',
                'volunteer_notes' => $validated['volunteerNotes'] ?? null,
                'volunteer_id' => $validated['volunteerId'] ?? null,
                'victim_name' => $victimName,
                'victim_age' => $validated['age'] ?? $validated['victimAge'] ?? $survivor->age,
                'victim_gender' => $validated['gender'] ?? $validated['victimGender'] ?? $survivor->gender,
                'victim_category' => $validated['category'] ?? $validated['victimCategory'] ?? $survivor->category,
            ]
        );

        // Update survivor profile summary
        $survivor->update([
            'srq20_score' => $srqScore,
            'triage_tier' => $triage['tier'],
            't0_status' => $triage['emergencyStatus'],
            'current_phase' => 'followup_srq20',
        ]);

        // If T0, trigger emergency alert
        if ($triage['tier'] === 'T0') {
            $this->emergencyService->createEmergency([
                'id' => 'EMG-' . $assessment->record_id,
                'recordId' => $assessment->record_id,
                'survivorId' => $survivor->id,
                'survivorName' => $survivor->name,
                'posko' => $assessment->location,
                'emergencyReasons' => $validated['indicators'] ?? ['Red Flag Critical Emergency'],
                'volunteerNotes' => $validated['volunteerNotes'] ?? null,
            ], $validated['volunteerId'] ?? null);
        }

        return response()->json([
            'status' => 'success',
            'success' => true,
            'data' => $assessment->toFrontendArray(),
            'assessment' => $assessment->toFrontendArray(),
            'triage' => $triage,
        ], 201);
    }

    /**
     * Batch synchronization of offline assessments.
     */
    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'records' => 'required|array',
            'records.*' => 'required|array',
        ]);

        $result = $this->syncService->syncBatch($validated['records']);

        return response()->json([
            'success' => true,
            'syncedCount' => $result['syncedCount'],
            'skippedCount' => $result['skippedCount'],
            'errors' => $result['errors'],
        ]);
    }

    /**
     * Get single assessment by ID.
     */
    public function show(string $recordId): JsonResponse
    {
        $record = Assessment::where('record_id', $recordId)->firstOrFail();

        return response()->json([
            'assessment' => $record->toFrontendArray(),
        ]);
    }
}
