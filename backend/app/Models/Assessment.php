<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Assessment extends Model
{
    use HasFactory;

    protected $primaryKey = 'record_id';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'record_id',
        'client_event_id',
        'victim_id',
        'nik',
        'timestamp',
        'location',
        'method',
        'phase',
        'zone',
        'triage_tier',
        't0_status',
        'score',
        'indicators',
        'critical_triggered',
        'transcript',
        'checklist_selections',
        'srq20_yes_list',
        'functional_selections',
        'risk_factor_selections',
        'risk_factor_score',
        'functional_scores',
        'functional_score_total',
        'total_integrated_score',
        'status_title',
        'recommended_action',
        'sync_status',
        'volunteer_notes',
        'volunteer_id',
        'victim_name',
        'victim_age',
        'victim_gender',
        'victim_category',
        'hospital_referral_status',
        'hospital_notes',
        'hospital_bed',
        'tele_emergency_notes',
    ];

    protected function casts(): array
    {
        return [
            'indicators' => 'array',
            'checklist_selections' => 'array',
            'srq20_yes_list' => 'array',
            'functional_selections' => 'array',
            'risk_factor_selections' => 'array',
            'functional_scores' => 'array',
            'critical_triggered' => 'boolean',
            'score' => 'integer',
            'risk_factor_score' => 'integer',
            'functional_score_total' => 'integer',
            'total_integrated_score' => 'integer',
        ];
    }

    public function survivor(): BelongsTo
    {
        return $this->belongsTo(Survivor::class, 'victim_id', 'id');
    }

    /**
     * Map model to frontend camelCase structure.
     */
    public function toFrontendArray(): array
    {
        return [
            'recordId' => $this->record_id,
            'id' => $this->victim_id,
            'victimId' => $this->victim_id,
            'nik' => $this->nik ?: null,
            'timestamp' => $this->timestamp,
            'location' => $this->location,
            'method' => $this->method,
            'phase' => $this->phase,
            'zone' => $this->zone,
            'triageTier' => $this->triage_tier,
            't0Status' => $this->t0_status ?: null,
            'score' => $this->score,
            'indicators' => $this->indicators ?: [],
            'criticalTriggered' => (bool) $this->critical_triggered,
            'transcript' => $this->transcript ?: null,
            'checklistSelections' => $this->checklist_selections ?: [],
            'srq20YesList' => $this->srq20_yes_list ?: [],
            'functionalSelections' => $this->functional_selections ?: [],
            'riskFactorSelections' => $this->risk_factor_selections ?: [],
            'riskFactorScore' => $this->risk_factor_score,
            'functionalScores' => $this->functional_scores ?: null,
            'functionalScoreTotal' => $this->functional_score_total,
            'totalIntegratedScore' => $this->total_integrated_score,
            'totalScore' => $this->total_integrated_score,
            'statusTitle' => $this->status_title ?: null,
            'recommendedAction' => $this->recommended_action ?: '',
            'syncStatus' => 'synced',
            'volunteerNotes' => $this->volunteer_notes ?: null,
            'volunteerId' => $this->volunteer_id ?: null,
            'victimName' => $this->victim_name ?: null,
            'victimAge' => $this->victim_age ?: null,
            'victimGender' => $this->victim_gender ?: null,
            'victimCategory' => $this->victim_category ?: null,
            'hospitalReferralStatus' => $this->hospital_referral_status ?: null,
            'hospitalNotes' => $this->hospital_notes ?: null,
            'hospitalBed' => $this->hospital_bed ?: null,
            'teleEmergencyNotes' => $this->tele_emergency_notes ?: null,
        ];
    }
}
