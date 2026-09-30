<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DisasterPost extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'lat',
        'lng',
        'sector',
        'coordinator',
        'active_volunteers',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'active_volunteers' => 'integer',
        ];
    }

    public function toFrontendArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'sector' => $this->sector,
            'coordinator' => $this->coordinator,
            'activeVolunteers' => $this->active_volunteers,
            'description' => $this->description,
        ];
    }
}
