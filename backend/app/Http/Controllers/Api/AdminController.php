<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\DisasterPost;
use App\Models\EmergencyAlert;
use App\Models\Survivor;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get aggregate KPI metrics for BPBD / Dinkes command center.
     */
    public function stats(Request $request): JsonResponse
    {
        $totalAssessments = Assessment::count();
        $totalSurvivors = Survivor::count();
        $totalUsers = User::count();
        $totalVolunteers = User::where('role', 'volunteer')->count();

        // Triage tier counts from Assessments
        $t0Count = Assessment::where('triage_tier', 'T0')
            ->orWhere('t0_status', 'T0-Suspect')
            ->orWhere('t0_status', 'T0-Confirmed')
            ->count();

        $t1Count = Assessment::where('triage_tier', 'T1')->count();
        $t2Count = Assessment::where('triage_tier', 'T2')->count();
        $t3Count = Assessment::where('triage_tier', 'T3')->count();

        // Zone counts
        $greenCount = Assessment::where('zone', 'GREEN')->count();
        $yellowCount = Assessment::where('zone', 'YELLOW')->count();
        $redCount = Assessment::where('zone', 'RED')->count();

        // Posko breakdown
        $poskoStats = [];
        $posts = DisasterPost::all();
        foreach ($posts as $post) {
            $assessmentsInPost = Assessment::where('location', $post->name)->count();
            $t0InPost = Assessment::where('location', $post->name)->where('triage_tier', 'T0')->count();
            $volunteersInPost = User::where('role', 'volunteer')->where('assigned_post', $post->name)->count();

            $poskoStats[] = [
                'posko' => $post->name,
                'disaster_name' => $post->disaster_name,
                'coordinates' => [$post->latitude, $post->longitude],
                'assessments_count' => $assessmentsInPost,
                't0_count' => $t0InPost,
                'volunteers_count' => $volunteersInPost,
                'current_occupancy' => $post->current_occupancy,
                'max_capacity' => $post->max_capacity,
            ];
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'totalSurvivors' => $totalSurvivors,
                'totalAssessments' => $totalAssessments,
                'totalVolunteers' => $totalVolunteers,
                'totalUsers' => $totalUsers,
                'triage' => [
                    't0' => $t0Count,
                    't1' => $t1Count,
                    't2' => $t2Count,
                    't3' => $t3Count,
                ],
                'zones' => [
                    'green' => $greenCount,
                    'yellow' => $yellowCount,
                    'red' => $redCount,
                ],
                'poskoStats' => $poskoStats,
            ],
        ]);
    }

    /**
     * Get 30-day longitudinal screening progression.
     */
    public function longitudinal(Request $request): JsonResponse
    {
        $assessments = Assessment::orderBy('assessment_date', 'asc')->get();

        // Group by day or phase
        $daily = [];
        foreach ($assessments as $a) {
            $date = $a->assessment_date ? substr($a->assessment_date, 0, 10) : date('Y-m-d');
            if (!isset($daily[$date])) {
                $daily[$date] = [
                    'date' => $date,
                    'total' => 0,
                    't0' => 0,
                    't1' => 0,
                    't2' => 0,
                    't3' => 0,
                ];
            }
            $daily[$date]['total']++;
            $tier = strtolower($a->triage_tier ?: 't3');
            if (isset($daily[$date][$tier])) {
                $daily[$date][$tier]++;
            }
        }

        return response()->json([
            'status' => 'success',
            'data' => array_values($daily),
        ]);
    }

    /**
     * List disaster posts.
     */
    public function posts(): JsonResponse
    {
        $posts = DisasterPost::all();

        return response()->json([
            'status' => 'success',
            'data' => $posts->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'disasterName' => $p->disaster_name,
                    'lat' => (float) $p->latitude,
                    'lng' => (float) $p->longitude,
                    'currentOccupancy' => $p->current_occupancy,
                    'maxCapacity' => $p->max_capacity,
                    'coordinatorName' => $p->coordinator_name,
                    'coordinatorPhone' => $p->coordinator_phone,
                    'status' => $p->status,
                ];
            }),
        ]);
    }
}
