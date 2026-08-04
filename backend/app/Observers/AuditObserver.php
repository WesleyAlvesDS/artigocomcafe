<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditObserver
{
    public function created(Model $model): void
    {
        $this->log('created', $model);
    }

    public function updated(Model $model): void
    {
        $changes = $model->getChanges();

        unset($changes['updated_at']);

        if (empty($changes)) {
            return;
        }

        $this->log('updated', $model, [
            'old' => $this->filtered($model, $model->getOriginal()),
            'new' => $this->filtered($model, $model->getAttributes()),
        ]);
    }

    public function deleted(Model $model): void
    {
        $this->log('deleted', $model, [
            'row' => $this->filtered($model, $model->getAttributes()),
        ]);
    }

    public function restored(Model $model): void
    {
        $this->log('restored', $model);
    }

    protected function log(string $action, Model $model, ?array $extra = null): void
    {
        ActivityLog::query()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->getKey(),
            'payload' => $extra ?: ['attributes' => $this->filtered($model, $model->getAttributes())],
            'ip' => request()?->ip(),
            'user_agent' => substr((string) request()?->userAgent(), 0, 500),
            'url' => request()?->fullUrl(),
        ]);
    }

    protected function filtered(Model $model, array $attributes): array
    {
        foreach (['password', 'remember_token'] as $key) {
            unset($attributes[$key]);
        }

        return $attributes;
    }
}