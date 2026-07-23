<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HeldOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class HoldOrderController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => HeldOrder::query()->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cart' => ['required', 'array'],
            'cart.items' => ['required', 'array', 'min:1'],
        ]);

        $held = HeldOrder::query()->create([
            'reference' => 'HOLD-'.Str::upper(Str::random(6)),
            'user_id' => $request->user()->id,
            'cart' => $validated['cart'],
        ]);

        return response()->json(['data' => $held], Response::HTTP_CREATED);
    }

    public function destroy(HeldOrder $holdOrder): Response
    {
        $holdOrder->delete();

        return response()->noContent();
    }
}
