<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Mobile = 'mobile';
    case GiftCard = 'gift_card';

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
