<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /** Keys the API will accept — everything else is ignored. */
    private const ALLOWED_KEYS = [
        'restaurant_name',
        'restaurant_address',
        'restaurant_phone',
        'currency_symbol',
        'currency_code',
        'currency_decimals',
        'tax_rate',
        'tax_name',
        'timezone',
        'receipt_footer',
        'receipt_printer',
        'receipt_width',
        'loyalty_earn_rate',
    ];

    public function __construct(private readonly SettingRepositoryInterface $settings)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->settings->allAsArray()]);
    }

    public function update(Request $request): JsonResponse
    {
        foreach (self::ALLOWED_KEYS as $key) {
            if ($request->has($key)) {
                $this->settings->put($key, (string) $request->input($key));
            }
        }

        return response()->json(['data' => $this->settings->allAsArray()]);
    }
}
