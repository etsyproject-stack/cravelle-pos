<?php

namespace App\Repositories\Eloquent;

use App\Models\Coupon;
use App\Repositories\Contracts\CouponRepositoryInterface;

class CouponRepository extends BaseRepository implements CouponRepositoryInterface
{
    public function __construct(Coupon $model)
    {
        parent::__construct($model);
    }

    public function findByCode(string $code): ?Coupon
    {
        return Coupon::query()->whereRaw('UPPER(code) = ?', [strtoupper($code)])->first();
    }
}
