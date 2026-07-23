<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCouponRequest;
use App\Models\Coupon;
use App\Services\CouponService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CouponController extends Controller
{
    public function __construct(private readonly CouponService $couponService)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => Coupon::query()->latest()->get()]);
    }

    public function store(StoreCouponRequest $request): JsonResponse
    {
        return response()->json(
            ['data' => Coupon::query()->create($request->validated())],
            Response::HTTP_CREATED
        );
    }

    public function update(StoreCouponRequest $request, Coupon $coupon): JsonResponse
    {
        $coupon->update($request->validated());

        return response()->json(['data' => $coupon->refresh()]);
    }

    public function destroy(Coupon $coupon): Response
    {
        $coupon->delete();

        return response()->noContent();
    }

    public function validateCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        return response()->json([
            'data' => $this->couponService->validateForSubtotal(
                $validated['code'],
                (float) $validated['subtotal']
            ),
        ]);
    }
}
