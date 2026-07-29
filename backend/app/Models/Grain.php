<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grain extends Model
{
    protected $fillable = ['user_id', 'amount', 'type', 'source', 'description', 'metadata'];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'metadata' => 'json',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
