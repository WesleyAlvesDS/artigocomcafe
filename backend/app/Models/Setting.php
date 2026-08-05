<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'key', 'value', 'group',
    ];

    protected $hidden = [
        'value',
    ];

    /**
     * Lê o valor de uma setting, com fallback.
     *
     * Degrada silenciosamente para o fallback caso o banco de dados
     * esteja indisponível (ex.: durante deploy ou manutenção).
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        try {
            $cached = Cache::remember("setting.{$key}", 3600, function () use ($key) {
                return static::where('key', $key)->value('value');
            });

            return $cached ?? $default;
        } catch (\Throwable) {
            return $default;
        }
    }

    /**
     * Define (ou atualiza) o valor de uma setting e limpa o cache.
     */
    public static function set(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => (string) $value, 'group' => $group],
        );

        Cache::forget("setting.{$key}");
    }

    /**
     * Lê a chave de uma integração, com fallback para o config.
     */
    public static function apiKey(string $key, string $configPath): ?string
    {
        $saved = static::get($key);

        return filled($saved) ? (string) $saved : config($configPath);
    }
}
