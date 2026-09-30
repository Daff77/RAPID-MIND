<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('assessments', function (Blueprint $table) {
            $table->string('record_id')->primary(); // Format: ASM-2026-000001
            $table->string('client_event_id')->nullable()->index(); // Idempotency check for offline sync
            $table->string('victim_id');
            $table->foreign('victim_id')->references('id')->on('survivors')->onDelete('cascade');
            $table->string('nik')->nullable();
            $table->string('timestamp'); // HH:mm or ISO format
            $table->string('location'); // Posko A, B, C, D
            $table->string('method'); // 'VERBAL', 'CHECKLIST'
            $table->string('phase')->default('acute_pfa'); // 'acute_pfa', 'followup_srq20'
            $table->string('zone'); // 'GREEN', 'YELLOW', 'RED'
            $table->string('triage_tier')->default('T3'); // 'T0', 'T1', 'T2', 'T3'
            $table->string('t0_status')->nullable(); // 'T0-Suspect', 'T0-Confirmed', 'Downgraded'
            $table->integer('score')->default(0);
            $table->json('indicators')->nullable();
            $table->boolean('critical_triggered')->default(false);
            $table->text('transcript')->nullable();
            $table->json('checklist_selections')->nullable();
            $table->json('srq20_yes_list')->nullable();
            $table->json('functional_selections')->nullable();
            $table->json('risk_factor_selections')->nullable();
            $table->integer('risk_factor_score')->default(0);
            $table->json('functional_scores')->nullable();
            $table->integer('functional_score_total')->default(0);
            $table->integer('total_integrated_score')->default(0);
            $table->string('status_title')->nullable();
            $table->text('recommended_action')->nullable();
            $table->string('sync_status')->default('synced');
            $table->text('volunteer_notes')->nullable();
            $table->string('volunteer_id')->nullable();
            $table->string('victim_name')->nullable();
            $table->string('victim_age')->nullable();
            $table->char('victim_gender', 1)->nullable();
            $table->string('victim_category')->nullable();
            $table->string('hospital_referral_status')->nullable(); // 'pending', 'in_transit', 'admitted', 'discharged'
            $table->text('hospital_notes')->nullable();
            $table->string('hospital_bed')->nullable();
            $table->text('tele_emergency_notes')->nullable();
            $table->timestamps();

            $table->index('location');
            $table->index('zone');
            $table->index('triage_tier');
            $table->index('t0_status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assessments');
    }
};
