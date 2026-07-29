<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyVisit extends Model
{
    protected $fillable = ['user_id', 'visit_date', 'articles_read', 'time_spent_minutes', 'grains_earned'];

    protected function casts(): array
    {
        return [
            'visit_date' => 'date',
            'articles_read' => 'integer',
            'time_spent_minutes' => 'integer',
            'grains_earned' => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
