<?php

namespace App\Repositories\Contracts;

interface SettingRepositoryInterface
{
    /** All settings as an associative key => value array. */
    public function allAsArray(): array;

    public function put(string $key, ?string $value): void;

    public function get(string $key, ?string $default = null): ?string;
}
