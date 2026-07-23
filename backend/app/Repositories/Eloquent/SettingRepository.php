<?php

namespace App\Repositories\Eloquent;

use App\Models\Setting;
use App\Repositories\Contracts\SettingRepositoryInterface;

class SettingRepository implements SettingRepositoryInterface
{
    public function allAsArray(): array
    {
        return Setting::query()->pluck('value', 'key')->all();
    }

    public function put(string $key, ?string $value): void
    {
        Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);
    }

    public function get(string $key, ?string $default = null): ?string
    {
        return Setting::query()->where('key', $key)->value('value') ?? $default;
    }
}
