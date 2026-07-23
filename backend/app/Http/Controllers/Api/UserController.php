<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => User::query()->orderBy('name')->get(['id', 'name', 'email', 'role', 'created_at']),
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Only admins may assign roles; managers create cashiers by default.
        if (! $request->user()->hasRole(UserRole::Admin)) {
            $data['role'] = UserRole::Cashier->value;
        }

        $user = User::query()->create($data);

        return response()->json(
            ['data' => $user->only(['id', 'name', 'email', 'role', 'created_at'])],
            Response::HTTP_CREATED
        );
    }

    public function update(StoreUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['password'])) {
            unset($data['password']);
        }

        if (! $request->user()->hasRole(UserRole::Admin)) {
            unset($data['role']);
        }

        $user->update($data);

        return response()->json(['data' => $user->refresh()->only(['id', 'name', 'email', 'role', 'created_at'])]);
    }

    public function destroy(Request $request, User $user): Response
    {
        abort_if($request->user()->id === $user->id, Response::HTTP_UNPROCESSABLE_ENTITY, 'You cannot delete your own account.');

        $user->delete();

        return response()->noContent();
    }
}
