<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Survivor extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'nik',
        'posko_id',
        'name',
        'age',
        'gender',
        'category',
        'posko',
        'phone',
        'registered_at',
        'current_phase',
        'pfa_record',
        'srq20_score',
        'triage_tier',
        't0_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'pfa_record' => 'array',
            'srq20_score' => 'integer',
        ];
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class, 'survivor_id', 'id')->orderBy('created_at', 'desc');
    }

    public function emergencyAlerts(): HasMany
    {
        return $this->hasMany(EmergencyAlert::class, 'survivor_id', 'id')->orderBy('created_at', 'desc');
    }

    /**
     * Map model to frontend camelCase structure.
     */
    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'nik' => $this->nik ?: null,
            'poskoId' => $this->posko_id ?: null,
            'name' => $this->name,
            'age' => $this->age,
            'gender' => $this->gender,
            'category' => $this->category,
            'posko' => $this->posko,
            'phone' => $this->phone ?: null,
            'registeredAt' => $this->registered_at ? $this->registered_at->toISOString() : $this->created_at->toISOString(),
            'currentPhase' => $this->current_phase ?: 'acute_pfa',
            'pfaRecord' => $this->pfa_record ?: null,
            'srq20Score' => $this->srq20_score,
            'triageTier' => $this->triage_tier ?: 'T3',
            't0Status' => $this->t0_status ?: null,
            'notes' => $this->notes ?: null,
        ];
    }
}
