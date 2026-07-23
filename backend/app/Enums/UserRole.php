<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Manager = 'manager';
    case Cashier = 'cashier';
    case Kitchen = 'kitchen';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
