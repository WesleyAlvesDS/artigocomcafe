<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    /**
     * The total number of articles in this trail.
     */
    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_trail')
            ->withPivot('order', 'is_required')
            ->orderBy('article_trail.order');
    }

    /**
     * Receitas desta trilha (Fase 6 - trilha "Barista Iniciante").
     */
    public function recipes(): BelongsToMany
    {
        return $this->belongsToMany(Recipe::class, 'trail_recipe')
            ->withPivot('order', 'is_required')
            ->orderBy('trail_recipe.order');
    }

    /**
     * Users enrolled in this trail.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_trail')
            ->withPivot(['progress', 'is_completed', 'started_at', 'completed_at']);
    }

    /**
     * Scope to only active trails.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the count of required articles for this trail.
     * Uses a subquery to avoid N+1.
     */
    public function getRequiredArticlesCountAttribute(): int
    {
        if (!array_key_exists('required_articles_count', $this->attributes)) {
            $this->attributes['required_articles_count'] = $this->articles()
                ->wherePivot('is_required', true)
                ->count();
        }

        return (int) $this->attributes['required_articles_count'];
    }

    /**
     * Eager load the required articles count.
     */
    public function scopeWithRequiredCount($query)
    {
        return $query->withCount(['articles as required_articles_count' => function ($q) {
            $q->where('article_trail.is_required', true);
        }]);
    }
}
