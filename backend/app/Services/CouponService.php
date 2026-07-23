<?php

namespace App\Services;

use App\Models\Coupon;
use App\Repositories\Contracts\CouponRepositoryInterface;
use Illuminate\Validation\ValidationException;

class CouponService
{
    public function __construct(private readonly CouponRepositoryInterface $coupons)
    {
    }

    /**
     * Validate a coupon code against an order subtotal.
     * Returns the coupon plus the discount it would grant.
     */
    public function validateForSubtotal(string $code, float $subtotal): array
    {
        $coupon = $this->coupons->findByCode($code);

        if (! $coupon || ! $coupon->isUsable()) {
            throw ValidationException::withMessages(['code' => 'This coupon is invalid or expired.']);
        }

        if ($subtotal < (float) $coupon->min_order_amount) {
            throw ValidationException::withMessages([
                'code' => sprintf('Order must be at least %.2f to use this coupon.', $coupon->min_order_amount),
            ]);
        }

        return [
            'id' => $coupon->id,
            'code' => $coupon->code,
            'type' => $coupon->type,
            'value' => $coupon->value,
            'discount' => $coupon->discountFor($subtotal),
        ];
    }
}
