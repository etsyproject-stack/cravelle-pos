<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Http\Resources\ProductResource;
use App\Models\Addon;
use App\Models\Coupon;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Http\JsonResponse;

/**
 * One call that returns everything the till needs to sell: menu, add-ons,
 * customers, coupons and settings. The POS caches this payload so it keeps
 * working when the internet or the server is unreachable.
 */
class BootstrapController extends Controller
{
    public function __construct(
        private readonly CategoryRepositoryInterface $categories,
        private readonly ProductRepositoryInterface $products,
        private readonly CustomerRepositoryInterface $customers,
        private readonly SettingRepositoryInterface $settings,
    ) {
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'synced_at' => now()->toIso8601String(),
                'categories' => $this->categories->allWithCounts(),
                'products' => ProductResource::collection($this->products->search(['active' => 1]))->resolve(),
                'addons' => Addon::query()->where('is_active', true)->orderBy('name')->get(),
                'customers' => CustomerResource::collection($this->customers->search(null))->resolve(),
                'coupons' => Coupon::query()->where('is_active', true)->get(),
                'settings' => $this->settings->allAsArray(),
            ],
        ]);
    }
}
