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
        Schema::create('survivors', function (Blueprint $table) {
            $table->string('id')->primary(); // Unique Survivor/Person ID (Format: SURV-2026-XXXXXX or existing survivor identity)
            $table->string('nik')->nullable()->unique();
            $table->string('posko_id')->nullable(); // ID Gelang posko / kode tenda
            $table->string('name');
            $table->string('age');
            $table->char('gender', 1); // 'L', 'P'
            $table->string('category'); // 'Anak', 'Remaja', 'Dewasa', 'Lansia'
            $table->string('posko'); // Posko A, B, C, D
            $table->string('phone')->nullable();
            $table->timestamp('registered_at')->nullable();
            $table->string('current_phase')->default('acute_pfa'); // 'acute_pfa', 'followup_srq20'
            $table->json('pfa_record')->nullable(); // Look, Listen, Link details
            $table->integer('srq20_score')->nullable();
            $table->string('triage_tier')->default('T3'); // 'T0', 'T1', 'T2', 'T3'
            $table->string('t0_status')->nullable(); // 'T0-Suspect', 'T0-Confirmed', 'Downgraded'
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('posko');
            $table->index('posko_id');
            $table->index('name');
            $table->index('triage_tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survivors');
    }
};
