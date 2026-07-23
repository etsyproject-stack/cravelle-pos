<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Expense;
use App\Models\Order;
use App\Http\Resources\OrderResource;
use App\Repositories\Contracts\OrderRepositoryInterface;

class DashboardService
{
    public function __construct(private readonly OrderRepositoryInterface $orders)
    {
    }

    public function stats(): array
    {
        $sales = fn ($query) => (float) $query
            ->where('status', '!=', OrderStatus::Cancelled)
            ->sum('total');

        $todaySales = $sales(Order::query()->whereDate('created_at', today()));
        $monthSales = $sales(Order::query()
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()]));

        $monthExpenses = (float) Expense::query()
            ->whereBetween('expense_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->sum('amount');

        return [
            'today_sales' => $todaySales,
            'today_orders' => Order::query()->whereDate('created_at', today())->count(),
            'month_sales' => $monthSales,
            'month_orders' => Order::query()
                ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
                ->count(),
            'active_orders' => Order::query()
                ->whereIn('status', OrderStatus::kitchenStatuses())
                ->count(),
            'month_expenses' => $monthExpenses,
            'month_revenue' => $monthSales - $monthExpenses,
            'recent_orders' => OrderResource::collection($this->orders->recent())->resolve(),
        ];
    }
}
