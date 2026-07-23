<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::query()
            ->with('user:id,name')
            ->when($request->query('month'), function ($q, $month) {
                $start = Carbon::parse($month.'-01');
                $q->whereBetween('expense_date', [
                    $start->toDateString(),
                    $start->copy()->endOfMonth()->toDateString(),
                ]);
            })
            ->orderByDesc('expense_date')
            ->get();

        return response()->json(['data' => $expenses]);
    }

    public function store(StoreExpenseRequest $request): JsonResponse
    {
        $expense = Expense::query()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $expense->load('user:id,name')], Response::HTTP_CREATED);
    }

    public function update(StoreExpenseRequest $request, Expense $expense): JsonResponse
    {
        $expense->update($request->validated());

        return response()->json(['data' => $expense->refresh()->load('user:id,name')]);
    }

    public function destroy(Expense $expense): Response
    {
        $expense->delete();

        return response()->noContent();
    }
}
