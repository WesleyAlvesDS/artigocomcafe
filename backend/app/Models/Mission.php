<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    protected $fillable = [
        'title', 'description', 'icon', 'type',
        'conditions', 'grain_reward', 'expires_in_hours', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'conditions' => 'json',
            'grain_reward' => 'integer',
            'expires_in_hours' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_mission')
            ->withPivot(['progress', 'target', 'is_completed', 'completed_at', 'assigned_date']);
    }

    public function scopeDaily($query)
    {
        return $query->where('type', 'daily')->where('is_active', true);
    }

    public function scopeWeekly($query)
    {
        return $query->where('type', 'weekly')->where('is_active', true);
    }
}
