<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    /**
     * The model does not track update timestamps via updated_at.
     */
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id', 'action', 'model_type', 'model_id', 'payload',
        'ip', 'user_agent', 'url', 'finished_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'finished_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            'created' => 'Criado',
            'updated' => 'Atualizado',
            'deleted' => 'Excluído',
            'login' => 'Login',
            'logout' => 'Logout',
            default => $this->action,
        };
    }

    public function getModelLabelAttribute(): string
    {
        if (! $this->model_type) {
            return '-';
        }

        return class_basename($this->model_type);
    }
}