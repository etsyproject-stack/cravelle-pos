<?php

namespace App\Services;

use App\Models\Order;
use App\Repositories\Contracts\SettingRepositoryInterface;

class LoyaltyService
{
    public function __construct(private readonly SettingRepositoryInterface $settings)
    {
    }

    /** Accrue points for a customer's order. Returns the points earned. */
    public function earnForOrder(Order $order): int
    {
        $rate = (float) $this->settings->get('loyalty_earn_rate', '1');
        $points = (int) floor((float) $order->total * $rate);

        if ($points <= 0 || ! $order->customer) {
            return 0;
        }

        $order->customer->increment('loyalty_points', $points);
        $order->customer->loyaltyTransactions()->create([
            'order_id' => $order->id,
            'type' => 'earn',
            'points' => $points,
        ]);

        return $points;
    }
}
