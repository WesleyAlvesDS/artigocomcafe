<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    protected $fillable = ['user_id', 'name', 'description', 'icon', 'color', 'order', 'is_public'];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'order' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function articles()
    {
        return $this->belongsToMany(Article::class, 'article_collection')
            ->withPivot('note')
            ->withTimestamps();
    }

    public function getArticlesCountAttribute()
    {
        return $this->articles()->count();
    }
}
