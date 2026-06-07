<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Key-value app setting (admin-editable). Reads are cached forever and busted
 * on write, so the per-request lookups (e.g. the tracker snippet injected into
 * every page) stay cheap.
 *
 * @property string $key
 * @property string|null $value
 */
class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function get(string $key, ?string $default = null): ?string
    {
        $value = Cache::rememberForever(
            "setting:{$key}",
            fn () => static::query()->where('key', $key)->value('value'),
        );

        return $value ?? $default;
    }

    public static function put(string $key, ?string $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("setting:{$key}");
    }
}
