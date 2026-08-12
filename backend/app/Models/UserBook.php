<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBook extends Model
{
    public const SHELF_QUERO_LER = 'quero_ler';
    public const SHELF_LIDOS = 'lidos';
    public const SHELF_FAVORITOS = 'favoritos';

    public const SHELVES = [
        self::SHELF_QUERO_LER,
        self::SHELF_LIDOS,
        self::SHELF_FAVORITOS,
    ];

    protected $fillable = [
        'user_id', 'ol_key', 'title', 'subtitle', 'authors', 'first_publish_year',
        'cover_id', 'covers', 'isbn', 'rating_avg', 'rating_count',
        'shelf', 'user_rating', 'user_review', 'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'authors' => 'array',
            'covers' => 'array',
            'isbn' => 'array',
            'first_publish_year' => 'integer',
            'cover_id' => 'integer',
            'rating_avg' => 'float',
            'rating_count' => 'integer',
            'user_rating' => 'integer',
            'finished_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
