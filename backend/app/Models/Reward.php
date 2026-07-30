<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    protected $fillable = [
        'name', 'slug', 'description', 'type', 'category',
        'icon', 'image_url', 'content', 'grain_cost',
        'rarity', 'is_active', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'json',
            'grain_cost' => 'integer',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_reward')
            ->withPivot(['is_active', 'unlocked_at', 'activated_at']);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByRarity($query, string $rarity)
    {
        return $query->where('rarity', $rarity);
    }
}
