<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Controlled migration to standardize assessment identifier as canonical RM (RM-2026-XXXXXX)
     * and strictly preserve the 1-to-many relationship: Survivor -> Assessments.
     */
    public function up(): void
    {
        // 1. Ensure `rm_code` and `survivor_id` exist on `assessments`
        Schema::table('assessments', function (Blueprint $table) {
            if (!Schema::hasColumn('assessments', 'rm_code')) {
                $table->string('rm_code')->nullable()->index()->after('record_id');
            }
            if (!Schema::hasColumn('assessments', 'survivor_id')) {
                $table->string('survivor_id')->nullable()->index()->after('client_event_id');
            }
        });

        // 2. Perform controlled data migration while preserving all clinical and survivor data
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        if ($isSqlite) {
            DB::statement('PRAGMA foreign_keys = OFF;');
        }

        DB::transaction(function () {
            // A. Migrate any survivor that was legacy-assigned an RM- code as its person ID
            // Concept: Survivor entity must NOT be named RM (RM is for assessment records).
            $survivors = DB::table('survivors')->get();
            $survivorIdMap = [];

            foreach ($survivors as $survivor) {
                if (str_starts_with($survivor->id, 'RM-') || str_starts_with($survivor->id, 'PB-')) {
                    $newSurvivorId = 'SURV-' . substr($survivor->id, 3);
                    $survivorIdMap[$survivor->id] = $newSurvivorId;

                    DB::table('survivors')
                        ->where('id', $survivor->id)
                        ->update(['id' => $newSurvivorId]);
                }
            }

            // B. Migrate Assessments data
            $assessments = DB::table('assessments')->get();
            foreach ($assessments as $a) {
                $updates = [];

                // 1. Determine canonical RM code
                // Check if legacy pb_code column exists
                $pbCode = isset($a->pb_code) ? $a->pb_code : null;
                $currentRm = $a->rm_code ?? null;
                $currentRecordId = $a->record_id ?? null;

                if (!empty($pbCode)) {
                    // Category A: Migrate legacy PB assessment code to RM
                    $canonicalRm = str_replace('PB-', 'RM-', $pbCode);
                } elseif (!empty($currentRm)) {
                    $canonicalRm = $currentRm;
                } elseif (!empty($currentRecordId) && str_starts_with($currentRecordId, 'RM-')) {
                    $canonicalRm = $currentRecordId;
                } elseif (!empty($currentRecordId) && str_starts_with($currentRecordId, 'PB-')) {
                    $canonicalRm = str_replace('PB-', 'RM-', $currentRecordId);
                } elseif (!empty($currentRecordId) && str_starts_with($currentRecordId, 'ASM-')) {
                    $canonicalRm = str_replace('ASM-', 'RM-', $currentRecordId);
                } else {
                    $canonicalRm = 'RM-' . date('Y') . '-' . str_pad((string) ($a->id ?? rand(100, 9999)), 6, '0', STR_PAD_LEFT);
                }

                $updates['rm_code'] = $canonicalRm;
                $updates['record_id'] = $canonicalRm;

                // 2. Preserve survivor relationship
                $existingSurvivorId = $a->survivor_id ?? null;
                $existingVictimId = $a->victim_id ?? null;
                $legacyPbId = isset($a->pb_id) ? $a->pb_id : null;

                $targetSurvivorId = $existingSurvivorId ?: ($existingVictimId ?: $legacyPbId);

                // Remap if survivor ID was updated from RM- to SURV-
                if ($targetSurvivorId && isset($survivorIdMap[$targetSurvivorId])) {
                    $targetSurvivorId = $survivorIdMap[$targetSurvivorId];
                }

                if ($targetSurvivorId) {
                    $updates['survivor_id'] = $targetSurvivorId;
                    $updates['victim_id'] = $targetSurvivorId;
                }

                if (!empty($updates)) {
                    DB::table('assessments')
                        ->where('record_id', $a->record_id)
                        ->update($updates);
                }
            }

            // C. Remap EmergencyAlerts foreign keys if survivor ID or record_id shifted
            $alerts = DB::table('emergency_alerts')->get();
            foreach ($alerts as $alert) {
                $alertUpdates = [];
                if ($alert->survivor_id && isset($survivorIdMap[$alert->survivor_id])) {
                    $alertUpdates['survivor_id'] = $survivorIdMap[$alert->survivor_id];
                }
                if ($alert->record_id && str_starts_with($alert->record_id, 'ASM-')) {
                    $alertUpdates['record_id'] = str_replace('ASM-', 'RM-', $alert->record_id);
                } elseif ($alert->record_id && str_starts_with($alert->record_id, 'PB-')) {
                    $alertUpdates['record_id'] = str_replace('PB-', 'RM-', $alert->record_id);
                }
                if (!empty($alertUpdates)) {
                    DB::table('emergency_alerts')
                        ->where('id', $alert->id)
                        ->update($alertUpdates);
                }
            }
        });

        if ($isSqlite) {
            DB::statement('PRAGMA foreign_keys = ON;');
        }

        // 3. Remove obsolete PB columns and indexes if present
        Schema::table('assessments', function (Blueprint $table) {
            if (Schema::hasColumn('assessments', 'pb_code')) {
                $table->dropColumn('pb_code');
            }
            if (Schema::hasColumn('assessments', 'pb_id')) {
                $table->dropColumn('pb_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessments', function (Blueprint $table) {
            if (Schema::hasColumn('assessments', 'rm_code')) {
                $table->dropIndex(['rm_code']);
                $table->dropColumn('rm_code');
            }
            if (Schema::hasColumn('assessments', 'survivor_id')) {
                $table->dropIndex(['survivor_id']);
                $table->dropColumn('survivor_id');
            }
        });
    }
};
