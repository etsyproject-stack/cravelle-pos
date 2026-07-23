<?php

namespace App\Enums;

enum DiscountType: string
{
    case None = 'none';
    case Percent = 'percent';
    case Fixed = 'fixed';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
