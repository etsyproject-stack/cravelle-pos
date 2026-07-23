<?php

namespace App\Repositories\Contracts;

use App\Models\Coupon;

interface CouponRepositoryInterface extends BaseRepositoryInterface
{
    public function findByCode(string $code): ?Coupon;
}
