<?php

namespace App\Services;

use App\Events\EmergencyConfirmed;
use App\Events\EmergencyCreated;
use App\Events\EmergencyDowngraded;
use App\Models\Assessment;
use App\Models\EmergencyAlert;
use App\Models\Survivor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmergencyService
{
    /**
     * Create an emergency T0 alert (Two-Tiered Triage Step 1: T0-Suspect)
     */
    public function createEmergency(array $data, ?string $reporterVolunteerId = null): EmergencyAlert
    {
        return DB::transaction(function () use ($data, $reporterVolunteerId) {
            $id = $data['id'] ?? ('EMG-' . date('Ymd') . '-' . strtoupper(Str::random(6)));
            $survivorId = $data['survivorId'] ?? $data['victimId'] ?? $data['id'] ?? null;
            $survivorName = $data['survivorName'] ?? $data['victimName'] ?? 'Penyintas Lapangan';
            $posko = $data['posko'] ?? $data['location'] ?? 'Posko A';

            // Ensure survivor exists
            $survivor = null;
            if ($survivorId) {
                $survivor = Survivor::find($survivorId);
            }

            if (!$survivor && $survivorId) {
                $survivor = Survivor::create([
                    'id' => $survivorId,
                    'name' => $survivorName,
                    'age' => $data['victimAge'] ?? '35',
                    'gender' => $data['victimGender'] ?? 'P',
                    'category' => $data['victimCategory'] ?? 'Dewasa',
                    'posko' => $posko,
                    'registered_at' => now(),
                    'current_phase' => 'acute_pfa',
                    'triage_tier' => 'T0',
                    't0_status' => 'T0-Suspect',
                ]);
            } elseif ($survivor) {
                $survivor->update([
                    'triage_tier' => 'T0',
                    't0_status' => 'T0-Suspect',
                ]);
            }

            $alert = EmergencyAlert::updateOrCreate(
                ['id' => $id],
                [
                    'client_event_id' => $data['clientEventId'] ?? null,
                    'record_id' => $data['recordId'] ?? null,
                    'survivor_id' => $survivor ? $survivor->id : ($survivorId ?: 'VCT-ACTIVE'),
                    'survivor_name' => $survivorName,
                    'posko' => $posko,
                    'status' => 'T0-Suspect',
                    'emergency_reasons' => $data['emergencyReasons'] ?? $data['indicators'] ?? ['Pemicu kedaruratan Red Flag manual oleh relawan lapangan'],
                    'gps_lat' => isset($data['gpsLat']) ? (float) $data['gpsLat'] : null,
                    'gps_lng' => isset($data['gpsLng']) ? (float) $data['gpsLng'] : null,
                    'reporter_volunteer_id' => $reporterVolunteerId ?: ($data['reporterVolunteerId'] ?? $data['volunteerId'] ?? null),
                    'volunteer_notes' => $data['volunteerNotes'] ?? null,
                ]
            );

            // Broadcast real-time event to Healthcare Dashboard
            broadcast(new EmergencyCreated($alert))->toOthers();

            return $alert;
        });
    }

    /**
     * Validate & Confirm Emergency (Two-Tiered Triage Step 2: T0-Confirmed)
     */
    public function confirmEmergency(
        string $emergencyId,
        string $doctorName,
        ?string $teleNotes = null,
        ?string $assignedBed = null,
        ?int $userId = null
    ): EmergencyAlert {
        return DB::transaction(function () use ($emergencyId, $doctorName, $teleNotes, $assignedBed, $userId) {
            $alert = EmergencyAlert::findOrFail($emergencyId);

            $alert->update([
                'status' => 'T0-Confirmed',
                'verified_by_user_id' => $userId,
                'verified_by_doctor_name' => $doctorName,
                'verified_at' => now(),
                'tele_notes' => $teleNotes ?: "Terverifikasi via Tele-Emergency oleh {$doctorName}: Pasien dalam kondisi distres gawat darurat valid.",
                'transport_stage' => 'dispatch',
                'assigned_bed' => $assignedBed ?: 'IGD Psikiatri Bed 01',
            ]);

            // Update associated survivor & assessment
            if ($alert->survivor_id) {
                Survivor::where('id', $alert->survivor_id)->update([
                    't0_status' => 'T0-Confirmed',
                    'triage_tier' => 'T0',
                ]);
            }

            if ($alert->record_id) {
                Assessment::where('record_id', $alert->record_id)->update([
                    't0_status' => 'T0-Confirmed',
                    'hospital_referral_status' => 'in_transit',
                    'hospital_notes' => $alert->tele_notes,
                    'hospital_bed' => $alert->assigned_bed,
                ]);
            }

            broadcast(new EmergencyConfirmed($alert))->toOthers();

            return $alert;
        });
    }

    /**
     * Downgrade Emergency to T1 or T2
     */
    public function downgradeEmergency(
        string $emergencyId,
        string $doctorName,
        string $targetTier, // 'T1' or 'T2'
        ?string $teleNotes = null,
        ?int $userId = null
    ): EmergencyAlert {
        return DB::transaction(function () use ($emergencyId, $doctorName, $targetTier, $teleNotes, $userId) {
            $alert = EmergencyAlert::findOrFail($emergencyId);

            $alert->update([
                'status' => 'Downgraded',
                'downgraded_tier' => $targetTier,
                'verified_by_user_id' => $userId,
                'verified_by_doctor_name' => $doctorName,
                'verified_at' => now(),
                'tele_notes' => $teleNotes ?: "Validasi Tele-Emergency oleh {$doctorName}: Pasien tidak dalam ancaman nyawa kritis. Status diturunkan ke {$targetTier}.",
            ]);

            if ($alert->survivor_id) {
                Survivor::where('id', $alert->survivor_id)->update([
                    't0_status' => 'Downgraded',
                    'triage_tier' => $targetTier,
                ]);
            }

            if ($alert->record_id) {
                Assessment::where('record_id', $alert->record_id)->update([
                    't0_status' => 'Downgraded',
                    'triage_tier' => $targetTier,
                    'zone' => $targetTier === 'T1' ? 'RED' : 'YELLOW',
                    'tele_emergency_notes' => $alert->tele_notes,
                ]);
            }

            broadcast(new EmergencyDowngraded($alert))->toOthers();

            return $alert;
        });
    }
}
