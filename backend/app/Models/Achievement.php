<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Achievement extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'icon', 'category',
        'rarity', 'grain_reward', 'conditions', 'is_hidden',
    ];

    protected function casts(): array
    {
        return [
            'conditions' => 'json',
            'grain_reward' => 'integer',
            'is_hidden' => 'boolean',
        ];
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_achievement')
            ->withPivot('earned_at');
    }

    public function scopeVisible($query)
    {
        return $query->where('is_hidden', false);
    }
}
