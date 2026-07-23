<?php

namespace App\Enums;

enum OrderType: string
{
    case DineIn = 'dine_in';
    case Takeaway = 'takeaway';
    case Delivery = 'delivery';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
