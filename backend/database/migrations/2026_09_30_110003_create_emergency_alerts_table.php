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
        Schema::create('emergency_alerts', function (Blueprint $table) {
            $table->string('id')->primary(); // EMG-2026-XXXXXX or UUID
            $table->string('client_event_id')->nullable()->index(); // Idempotent sync key
            $table->string('record_id')->nullable();
            $table->string('survivor_id');
            $table->foreign('survivor_id')->references('id')->on('survivors')->onDelete('cascade');
            $table->string('survivor_name');
            $table->string('posko'); // Posko A, B, C, D
            $table->string('status')->default('T0-Suspect'); // 'T0-Suspect', 'T0-Confirmed', 'Downgraded', 'Resolved'
            $table->json('emergency_reasons'); // Array of strings (suicidal, psychosis, agitation, medical)
            $table->decimal('gps_lat', 10, 7)->nullable();
            $table->decimal('gps_lng', 10, 7)->nullable();
            $table->string('reporter_volunteer_id')->nullable();
            $table->text('volunteer_notes')->nullable();
            $table->unsignedBigInteger('verified_by_user_id')->nullable();
            $table->string('verified_by_doctor_name')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->text('tele_notes')->nullable();
            $table->string('downgraded_tier')->nullable(); // 'T1', 'T2'
            $table->string('transport_stage')->nullable(); // 'dispatch', 'on_site', 'en_route_hospital', 'admitted'
            $table->string('assigned_bed')->nullable();
            $table->timestamps();

            $table->index('posko');
            $table->index('status');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emergency_alerts');
    }
};
