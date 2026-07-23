<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAddonRequest;
use App\Models\Addon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class AddonController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Addon::query()->orderBy('name')->get()]);
    }

    public function store(StoreAddonRequest $request): JsonResponse
    {
        return response()->json(
            ['data' => Addon::query()->create($request->validated())],
            Response::HTTP_CREATED
        );
    }

    public function update(StoreAddonRequest $request, Addon $addon): JsonResponse
    {
        $addon->update($request->validated());

        return response()->json(['data' => $addon->refresh()]);
    }

    public function destroy(Addon $addon): Response
    {
        $addon->delete();

        return response()->noContent();
    }
}
