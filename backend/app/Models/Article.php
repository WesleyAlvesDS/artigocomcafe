<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title', 'slug', 'excerpt', 'content', 'cover_image', 'featured_image',
        'category_id', 'user_id', 'status', 'reading_time',
        'is_featured', 'is_cafe_do_dia', 'cafe_do_dia_date',
        'views_count', 'reading_count', 'meta', 'published_at',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'is_cafe_do_dia' => 'boolean',
            'views_count' => 'integer',
            'reading_count' => 'integer',
            'meta' => 'json',
            'published_at' => 'datetime',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function author()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class);
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class, 'article_collection')
            ->withPivot('note')
            ->withTimestamps();
    }

    public function trails()
    {
        return $this->belongsToMany(Trail::class, 'article_trail')
            ->withPivot('order', 'is_required');
    }

    public function readingProgress()
    {
        return $this->hasMany(ReadingProgress::class);
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
        return $query->where('is_cafe_do_dia', true)
            ->whereDate('cafe_do_dia_date', now()->toDateString());
    }
}
