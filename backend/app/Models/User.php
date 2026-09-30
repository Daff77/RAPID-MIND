<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id_string',
        'username',
        'name',
        'email',
        'password',
        'role',
        'badge_number',
        'assigned_post',
        'assigned_hospital',
        'title',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isVolunteer(): bool
    {
        return $this->role === 'volunteer';
    }

    public function isHealthcare(): bool
    {
        return $this->role === 'hospital' || $this->role === 'healthcare';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Format user array to match frontend schema exactly.
     */
    public function toFrontendUser(): array
    {
        return [
            'id' => $this->user_id_string ?: (string) $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'badgeNumber' => $this->badge_number ?: '',
            'assignedPost' => $this->assigned_post,
            'assignedHospital' => $this->assigned_hospital,
            'title' => $this->title ?: '',
            'phone' => $this->phone,
        ];
    }
}
