<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Survivor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SurvivorController extends Controller
{
    /**
     * List all survivors with optional search.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Survivor::query();

        if ($request->filled('q')) {
            $q = strtolower(trim($request->input('q')));
            $query->where(function ($b) use ($q) {
                $b->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(posko_id) LIKE ?', ["%{$q}%"])
                  ->orWhereRaw('LOWER(id) LIKE ?', ["%{$q}%"]);
            });
        }

        if ($request->filled('posko') && $request->input('posko') !== 'ALL') {
            $query->where('posko', $request->input('posko'));
        }

        $survivors = $query->orderBy('registered_at', 'desc')
            ->get()
            ->map(fn (Survivor $s) => $s->toFrontendArray());

        return response()->json([
            'survivors' => $survivors,
        ]);
    }

    /**
     * Search survivors (Auto-Lookup system).
     */
    public function search(Request $request): JsonResponse
    {
        $q = strtolower(trim($request->input('q', '')));
        if (!$q) {
            return response()->json(['matches' => []]);
        }

        $matches = Survivor::where(function ($b) use ($q) {
            $b->whereRaw('LOWER(name) LIKE ?', ["%{$q}%"])
              ->orWhereRaw('LOWER(nik) LIKE ?', ["%{$q}%"])
              ->orWhereRaw('LOWER(posko_id) LIKE ?', ["%{$q}%"])
              ->orWhereRaw('LOWER(id) LIKE ?', ["%{$q}%"]);
        })
        ->orderBy('registered_at', 'desc')
        ->limit(10)
        ->get()
        ->map(fn (Survivor $s) => $s->toFrontendArray());

        return response()->json([
            'matches' => $matches,
        ]);
    }

    /**
     * Show single survivor with history.
     */
    public function show(string $id): JsonResponse
    {
        $survivor = Survivor::with('assessments')->where('id', $id)->orWhere('nik', $id)->first();

        if (!$survivor) {
            return response()->json(['message' => 'Penyintas tidak ditemukan.'], 404);
        }

        return response()->json([
            'survivor' => $survivor->toFrontendArray(),
            'assessments' => $survivor->assessments->map(fn ($a) => $a->toFrontendArray()),
        ]);
    }

    /**
     * Create or update survivor.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'nullable|string',
            'nik' => 'nullable|string',
            'poskoId' => 'nullable|string',
            'name' => 'required|string',
            'age' => 'required|string',
            'gender' => 'required|string|in:L,P',
            'category' => 'required|string',
            'posko' => 'required|string',
            'phone' => 'nullable|string',
            'currentPhase' => 'nullable|string',
            'pfaRecord' => 'nullable|array',
            'srq20Score' => 'nullable|integer',
            'triageTier' => 'nullable|string',
            't0Status' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $id = $validated['id'] ?? ('RM-' . date('Y') . '-' . str_pad((string) (Survivor::count() + 1), 6, '0', STR_PAD_LEFT));

        $survivor = Survivor::updateOrCreate(
            ['id' => $id],
            [
                'nik' => $validated['nik'] ?? null,
                'posko_id' => $validated['poskoId'] ?? null,
                'name' => $validated['name'],
                'age' => $validated['age'],
                'gender' => $validated['gender'],
                'category' => $validated['category'],
                'posko' => $validated['posko'],
                'phone' => $validated['phone'] ?? null,
                'registered_at' => now(),
                'current_phase' => $validated['currentPhase'] ?? 'acute_pfa',
                'pfa_record' => $validated['pfaRecord'] ?? null,
                'srq20_score' => $validated['srq20Score'] ?? null,
                'triage_tier' => $validated['triageTier'] ?? 'T3',
                't0_status' => $validated['t0Status'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'survivor' => $survivor->toFrontendArray(),
        ], 201);
    }

    /**
     * Update NIK inline action.
     */
    public function updateNik(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'nik' => 'required|string|min:8|max:20',
        ]);

        $survivor = Survivor::where('id', $id)->firstOrFail();
        $survivor->update(['nik' => trim($validated['nik'])]);

        return response()->json([
            'success' => true,
            'survivor' => $survivor->toFrontendArray(),
        ]);
    }
}
