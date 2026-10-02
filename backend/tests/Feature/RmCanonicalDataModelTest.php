<?php

namespace Tests\Feature;

use App\Models\Assessment;
use App\Models\Survivor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RmCanonicalDataModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed');
    }

    /**
     * Test that the database schema has rm_code and survivor_id, and no obsolete PB columns.
     */
    public function test_schema_has_canonical_rm_and_survivor_fields_without_obsolete_pb_columns(): void
    {
        $this->assertTrue(Schema::hasColumn('assessments', 'rm_code'), 'assessments table must have rm_code');
        $this->assertTrue(Schema::hasColumn('assessments', 'survivor_id'), 'assessments table must have survivor_id');
        $this->assertFalse(Schema::hasColumn('assessments', 'pb_code'), 'assessments table must not have pb_code');
        $this->assertFalse(Schema::hasColumn('assessments', 'pb_id'), 'assessments table must not have pb_id');

        $this->assertTrue(Schema::hasColumn('survivors', 'id'), 'survivors table must have id');
        $this->assertTrue(Schema::hasColumn('survivors', 'nik'), 'survivors table must have nik');
        $this->assertFalse(Schema::hasColumn('survivors', 'pb_code'), 'survivors table must not have pb_code');
    }

    /**
     * Test that 1 Survivor has multiple distinct RM assessments (Longitudinal History).
     */
    public function test_survivor_longitudinal_history_preserves_multiple_rm_assessments(): void
    {
        $nando = Survivor::where('name', 'Nando')->first();
        $this->assertNotNull($nando);
        $this->assertEquals('3578012345670089', $nando->nik);
        $this->assertStringStartsWith('SURV-', $nando->id, 'Survivor ID must NOT be an RM code');

        // Nando has 3 longitudinal assessments
        $assessments = $nando->assessments;
        $this->assertCount(3, $assessments, 'Nando must have exactly 3 longitudinal assessments');

        $rmCodes = $assessments->pluck('rm_code')->all();
        $this->assertContains('RM-2026-000089', $rmCodes);
        $this->assertContains('RM-2026-000142', $rmCodes);
        $this->assertContains('RM-2026-000231', $rmCodes);

        // Verify that each assessment belongs to the survivor
        foreach ($assessments as $assessment) {
            $this->assertEquals($nando->id, $assessment->survivor_id);
            $this->assertStringStartsWith('RM-', $assessment->rm_code);
            $this->assertStringStartsWith('RM-', $assessment->record_id);
        }
    }

    /**
     * Test storing a new assessment generates a canonical RM-2026-XXXXXX code.
     */
    public function test_storing_assessment_generates_canonical_rm_code(): void
    {
        $user = User::where('role', 'volunteer')->first();
        $token = $user->createToken('test-rm')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/assessments', [
                'name' => 'Dewi Penapisan Baru',
                'nik' => '3201019900001234',
                'age' => '32',
                'gender' => 'P',
                'category' => 'Dewasa',
                'posko' => 'Posko A',
                'srqScore' => 6,
                'riskScore' => 1,
                'functionalScore' => 0,
                'criticalTriggered' => false,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertStringStartsWith('RM-', $data['rmCode']);
        $this->assertStringStartsWith('RM-', $data['recordId']);
        $this->assertStringStartsWith('RM-', $data['id']);
        $this->assertStringStartsWith('SURV-', $data['survivorId'], 'Survivor ID must be a person entity identifier, not RM');
    }

    /**
     * Test that if a legacy PB identifier is submitted, it is migrated to RM.
     */
    public function test_legacy_pb_identifier_is_migrated_to_rm(): void
    {
        $user = User::where('role', 'volunteer')->first();
        $token = $user->createToken('test-legacy-pb')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/assessments', [
                'recordId' => 'PB-2026-000999',
                'name' => 'Legacy Survivor Test',
                'nik' => '3201019900009999',
                'age' => '40',
                'gender' => 'L',
                'category' => 'Dewasa',
                'posko' => 'Posko B',
                'srqScore' => 4,
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');

        $this->assertEquals('RM-2026-000999', $data['rmCode']);
        $this->assertEquals('RM-2026-000999', $data['recordId']);
        $this->assertStringNotContainsString('PB-', $data['rmCode']);
    }
}
