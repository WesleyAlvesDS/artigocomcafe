<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug', 'description', 'icon', 'color', 'order', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function getPublishedArticlesCountAttribute()
    {
        return $this->articles()->where('status', 'published')->count();
    }
}
