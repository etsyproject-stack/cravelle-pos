<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Restrict a route group to the given roles, e.g. `role:admin,manager`.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $allowed = array_map(fn (string $role) => UserRole::from($role), $roles);

        if (! $user || ! $user->hasRole(...$allowed)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
