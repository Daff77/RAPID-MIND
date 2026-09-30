<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmergencyAlert extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'client_event_id',
        'record_id',
        'survivor_id',
        'survivor_name',
        'posko',
        'status',
        'emergency_reasons',
        'gps_lat',
        'gps_lng',
        'reporter_volunteer_id',
        'volunteer_notes',
        'verified_by_user_id',
        'verified_by_doctor_name',
        'verified_at',
        'tele_notes',
        'downgraded_tier',
        'transport_stage',
        'assigned_bed',
    ];

    protected function casts(): array
    {
        return [
            'emergency_reasons' => 'array',
            'gps_lat' => 'float',
            'gps_lng' => 'float',
            'verified_at' => 'datetime',
        ];
    }

    public function survivor(): BelongsTo
    {
        return $this->belongsTo(Survivor::class, 'survivor_id', 'id');
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(Assessment::class, 'record_id', 'record_id');
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'clientEventId' => $this->client_event_id,
            'recordId' => $this->record_id,
            'survivorId' => $this->survivor_id,
            'survivorName' => $this->survivor_name,
            'posko' => $this->posko,
            'status' => $this->status,
            't0Status' => $this->status,
            'emergencyReasons' => $this->emergency_reasons ?: [],
            'gpsLat' => $this->gps_lat,
            'gpsLng' => $this->gps_lng,
            'reporterVolunteerId' => $this->reporter_volunteer_id,
            'volunteerNotes' => $this->volunteer_notes,
            'verifiedByDoctorName' => $this->verified_by_doctor_name,
            'verifiedAt' => $this->verified_at ? $this->verified_at->toISOString() : null,
            'teleNotes' => $this->tele_notes,
            'downgradedTier' => $this->downgraded_tier,
            'transportStage' => $this->transport_stage,
            'assignedBed' => $this->assigned_bed,
            'createdAt' => $this->created_at->toISOString(),
        ];
    }
}
