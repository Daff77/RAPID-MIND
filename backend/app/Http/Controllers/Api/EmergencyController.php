<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyAlert;
use App\Services\EmergencyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmergencyController extends Controller
{
    public function __construct(
        protected EmergencyService $emergencyService
    ) {}

    /**
     * List all emergency alerts (sorted with T0-Suspect first, then newest).
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmergencyAlert::query()->with('survivor');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($posko = $request->query('posko')) {
            $query->where('posko', $posko);
        }

        // Custom order: T0-Suspect -> T0-Confirmed -> Downgraded
        $alerts = $query->orderByRaw("
            CASE 
                WHEN status = 'T0-Suspect' THEN 1 
                WHEN status = 'T0-Confirmed' THEN 2 
                ELSE 3 
            END ASC
        ")->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $alerts->map(fn ($a) => $a->toFrontendArray()),
            'count' => $alerts->count(),
        ]);
    }

    /**
     * Trigger / Report a new T0 emergency alert (Volunteer Red Flag).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|string',
            'clientEventId' => 'nullable|string',
            'recordId' => 'nullable|string',
            'survivorId' => 'nullable|string',
            'victimId' => 'nullable|string',
            'survivorName' => 'nullable|string',
            'victimName' => 'nullable|string',
            'victimAge' => 'nullable|string',
            'victimGender' => 'nullable|string',
            'posko' => 'nullable|string',
            'location' => 'nullable|string',
            'emergencyReasons' => 'nullable|array',
            'indicators' => 'nullable|array',
            'gpsLat' => 'nullable|numeric',
            'gpsLng' => 'nullable|numeric',
            'reporterVolunteerId' => 'nullable|string',
            'volunteerNotes' => 'nullable|string',
        ]);

        $volunteerId = $request->user()?->badge_number ?? $request->user()?->username;

        $alert = $this->emergencyService->createEmergency($validated, $volunteerId);

        return response()->json([
            'status' => 'success',
            'message' => 'Sinyal darurat T0-Suspect berhasil dicatat dan dipancarkan ke Faskes/PSC 119.',
            'data' => $alert->toFrontendArray(),
        ], 201);
    }

    /**
     * Show single emergency alert.
     */
    public function show(string $id): JsonResponse
    {
        $alert = EmergencyAlert::where('id', $id)
            ->orWhere('record_id', $id)
            ->orWhere('survivor_id', $id)
            ->first();

        if (!$alert) {
            return response()->json([
                'status' => 'error',
                'message' => 'Data sinyal darurat tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $alert->toFrontendArray(),
        ]);
    }

    /**
     * Healthcare Tele-Emergency Verification: Confirm T0 Emergency.
     */
    public function confirm(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'doctorName' => 'nullable|string',
            'teleNotes' => 'nullable|string',
            'assignedBed' => 'nullable|string',
        ]);

        $doctorName = $validated['doctorName'] ?? $request->user()?->name ?? 'dr. Budi Santoso, Sp.KJ';
        $userId = $request->user()?->id;

        try {
            $alert = $this->emergencyService->confirmEmergency(
                emergencyId: $id,
                doctorName: $doctorName,
                teleNotes: $validated['teleNotes'] ?? null,
                assignedBed: $validated['assignedBed'] ?? null,
                userId: $userId
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Status pasien berhasil dikonfirmasi sebagai T0-Confirmed (Rujukan Segera).',
                'data' => $alert->toFrontendArray(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alert darurat tidak ditemukan.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengonfirmasi status kedaruratan: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Healthcare Tele-Emergency Verification: Downgrade to T1 or T2.
     */
    public function downgrade(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'targetTier' => 'required|in:T1,T2',
            'doctorName' => 'nullable|string',
            'teleNotes' => 'nullable|string',
        ]);

        $doctorName = $validated['doctorName'] ?? $request->user()?->name ?? 'dr. Budi Santoso, Sp.KJ';
        $userId = $request->user()?->id;

        try {
            $alert = $this->emergencyService->downgradeEmergency(
                emergencyId: $id,
                doctorName: $doctorName,
                targetTier: $validated['targetTier'],
                teleNotes: $validated['teleNotes'] ?? null,
                userId: $userId
            );

            return response()->json([
                'status' => 'success',
                'message' => "Status pasien berhasil diturunkan ke {$validated['targetTier']}.",
                'data' => $alert->toFrontendArray(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Alert darurat tidak ditemukan.',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menurunkan status kedaruratan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
