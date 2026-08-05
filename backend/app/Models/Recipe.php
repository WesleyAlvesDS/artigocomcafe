<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recipe extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'excerpt', 'description', 'ingredients', 'steps',
        'prep_time_minutes', 'cook_time_minutes', 'servings', 'difficulty',
        'cover_image', 'category_id', 'user_id', 'is_featured', 'is_cafe_do_dia',
        'status', 'meta', 'views_count', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'ingredients' => 'array',
            'steps' => 'array',
            'is_featured' => 'boolean',
            'is_cafe_do_dia' => 'boolean',
            'views_count' => 'integer',
            'servings' => 'integer',
            'prep_time_minutes' => 'integer',
            'cook_time_minutes' => 'integer',
            'meta' => 'json',
            'published_at' => 'datetime',
        ];
    }

    public function category()
    {
        return $this->belongsTo(RecipeCategory::class, 'category_id');
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'recipe_tag');
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class, 'collection_recipe')
            ->withPivot('note')
            ->withTimestamps();
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeCafeDoDia($query)
    {
        return $query->where('is_cafe_do_dia', true);
    }

    public function getDifficultyLabelAttribute(): string
    {
        return match ($this->difficulty) {
            'facil' => 'Fácil',
            'media' => 'Média',
            'dificil' => 'Difícil',
            default => ucfirst((string) $this->difficulty),
        };
    }
}
