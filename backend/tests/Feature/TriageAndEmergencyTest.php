<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\EmergencyAlert;
use App\Models\Survivor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TriageAndEmergencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed');
    }

    public function test_quick_login_works_and_returns_token()
    {
        $response = $this->postJson('/api/auth/quick-login', [
            'role' => 'volunteer',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.role', 'volunteer')
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_authoritative_triage_calculation_on_assessment_store()
    {
        // Login as volunteer
        $user = User::where('role', 'volunteer')->first();
        $token = $user->createToken('test')->plainTextToken;

        // Create assessment with SRQ >= 8 and High Risk -> Should calculate T1
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/assessments', [
                'victimId' => 'VCT-TEST-01',
                'name' => 'Budi Penapisan',
                'age' => '30',
                'gender' => 'L',
                'category' => 'Dewasa',
                'posko' => 'Posko A',
                'srqScore' => 10,
                'riskScore' => 6,
                'functionalScore' => 2,
                'criticalTriggered' => false,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        // Total score = 10 + 6 + 2 = 18 >= 15 -> T1 / RED
        $this->assertEquals(18, $data['totalScore']);
        $this->assertEquals('T1', $data['triageTier']);
        $this->assertEquals('RED', $data['zone']);
    }

    public function test_t0_red_flag_emergency_override()
    {
        $user = User::where('role', 'volunteer')->first();
        $token = $user->createToken('test')->plainTextToken;

        // Even with 0 other scores, criticalTriggered = true overrides to T0-Suspect
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/assessments', [
                'victimId' => 'VCT-TEST-T0',
                'name' => 'Slamet Darurat',
                'age' => '45',
                'gender' => 'L',
                'category' => 'Dewasa',
                'posko' => 'Posko A',
                'srqScore' => 1,
                'riskScore' => 0,
                'functionalScore' => 0,
                'criticalTriggered' => true,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals('T0', $data['triageTier']);
        $this->assertEquals('T0-Suspect', $data['t0Status']);
        $this->assertEquals('RED', $data['zone']);
    }

    public function test_two_tiered_triage_confirm_and_downgrade()
    {
        // Ensure survivors exist
        Survivor::firstOrCreate(
            ['id' => 'VCT-001'],
            ['name' => 'Slamet Test', 'age' => '45', 'gender' => 'L', 'category' => 'Dewasa', 'posko' => 'Posko A', 'triage_tier' => 'T0', 't0_status' => 'T0-Suspect']
        );
        Survivor::firstOrCreate(
            ['id' => 'VCT-002'],
            ['name' => 'Pasien Non Kritis', 'age' => '32', 'gender' => 'P', 'category' => 'Dewasa', 'posko' => 'Posko B', 'triage_tier' => 'T0', 't0_status' => 'T0-Suspect']
        );

        // 1. Create T0 emergency
        $alert = EmergencyAlert::create([
            'id' => 'EMG-TEST-99',
            'survivor_id' => 'VCT-001',
            'survivor_name' => 'Slamet Test',
            'posko' => 'Posko A',
            'status' => 'T0-Suspect',
            'emergency_reasons' => ['Ideasi bunuh diri butir 17'],
        ]);

        $doctor = User::where('role', 'hospital')->first();
        $token = $doctor->createToken('doc-test')->plainTextToken;

        // 2. Doctor confirms emergency
        $confirmRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/emergency/{$alert->id}/confirm", [
                'doctorName' => 'dr. Sp.KJ',
                'teleNotes' => 'Kondisi gawat darurat valid, dispatch armada.',
                'assignedBed' => 'IGD Psikiatri Bed 01',
            ]);

        $confirmRes->assertStatus(200)
            ->assertJsonPath('data.t0Status', 'T0-Confirmed');

        // 3. Downgrade another alert to T1
        $alert2 = EmergencyAlert::create([
            'id' => 'EMG-TEST-98',
            'survivor_id' => 'VCT-002',
            'survivor_name' => 'Pasien Non Kritis',
            'posko' => 'Posko B',
            'status' => 'T0-Suspect',
            'emergency_reasons' => ['Agitasi ringan'],
        ]);

        $downgradeRes = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson("/api/emergency/{$alert2->id}/downgrade", [
                'targetTier' => 'T1',
                'doctorName' => 'dr. Sp.KJ',
                'teleNotes' => 'Tidak ada ancaman nyawa segera, turun ke T1.',
            ]);

        $downgradeRes->assertStatus(200)
            ->assertJsonPath('data.t0Status', 'Downgraded')
            ->assertJsonPath('data.downgradedTier', 'T1');
    }

    public function test_idempotent_batch_sync_prevents_duplicates()
    {
        $clientUuid = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

        $batch = [
            'records' => [
                [
                    'clientEventId' => $clientUuid,
                    'recordId' => 'ASM-SYNC-001',
                    'victimId' => 'VCT-SYNC-01',
                    'name' => 'Penyintas Offline',
                    'age' => '28',
                    'gender' => 'P',
                    'category' => 'Dewasa',
                    'posko' => 'Posko B',
                    'srqScore' => 5,
                    'riskScore' => 2,
                    'functionalScore' => 0,
                    'criticalTriggered' => false,
                ]
            ]
        ];

        // First sync
        $res1 = $this->postJson('/api/assessments/sync', $batch);
        $res1->assertStatus(200)->assertJsonPath('syncedCount', 1);

        // Second sync with identical clientEventId
        $res2 = $this->postJson('/api/assessments/sync', $batch);
        $res2->assertStatus(200);

        // Record count in DB should be exactly 1, not 2
        $count = Assessment::where('client_event_id', $clientUuid)->count();
        $this->assertEquals(1, $count);
    }
}
