<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trail extends Model
{
    protected $fillable = [
        'title', 'slug', 'description', 'icon', 'color',
        'difficulty', 'estimated_hours', 'grain_reward', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'estimated_hours' => 'integer',
            'grain_reward' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_trail')
            ->withPivot('order', 'is_required')
            ->orderBy('article_trail.order');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_trail')
            ->withPivot(['progress', 'is_completed', 'started_at', 'completed_at']);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function getRequiredArticlesCountAttribute()
    {
        return $this->articles()->wherePivot('is_required', true)->count();
    }
}
