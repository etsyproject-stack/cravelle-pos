<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Expense;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Illuminate\Support\Carbon;

class ReportService
{
    public function daily(Carbon $date): array
    {
        $orders = Order::query()
            ->whereDate('created_at', $date)
            ->where('status', '!=', OrderStatus::Cancelled);

        $gross = (float) (clone $orders)->sum('total');
        $count = (clone $orders)->count();

        $byHour = (clone $orders)
            ->get(['created_at', 'total'])
            ->groupBy(fn (Order $order) => (int) $order->created_at->format('G'))
            ->map(fn ($group, $hour) => [
                'hour' => (int) $hour,
                'count' => $group->count(),
                'total' => round((float) $group->sum('total'), 2),
            ])
            ->sortBy('hour')
            ->values()
            ->all();

        $byMethod = Payment::query()
            ->whereDate('payments.created_at', $date)
            ->whereHas('order', fn ($q) => $q->where('status', '!=', OrderStatus::Cancelled))
            ->get(['method', 'amount'])
            ->groupBy(fn (Payment $payment) => $payment->method->value)
            ->map(fn ($group, $method) => [
                'method' => $method,
                'count' => $group->count(),
                'total' => round((float) $group->sum('amount'), 2),
            ])
            ->values()
            ->all();

        return [
            'date' => $date->toDateString(),
            'gross_sales' => $gross,
            'orders_count' => $count,
            'average_order' => $count > 0 ? round($gross / $count, 2) : 0,
            'by_hour' => $byHour,
            'by_payment_method' => $byMethod,
        ];
    }

    public function monthly(Carbon $month): array
    {
        [$start, $end] = [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()];

        $orders = Order::query()
            ->whereBetween('created_at', [$start, $end])
            ->where('status', '!=', OrderStatus::Cancelled);

        $gross = (float) (clone $orders)->sum('total');
        $count = (clone $orders)->count();

        $byDay = (clone $orders)
            ->get(['created_at', 'total'])
            ->groupBy(fn (Order $order) => $order->created_at->toDateString())
            ->map(fn ($group, $date) => [
                'date' => $date,
                'count' => $group->count(),
                'total' => round((float) $group->sum('total'), 2),
            ])
            ->sortBy('date')
            ->values()
            ->all();

        return [
            'month' => $month->format('Y-m'),
            'gross_sales' => $gross,
            'orders_count' => $count,
            'average_order' => $count > 0 ? round($gross / $count, 2) : 0,
            'by_day' => $byDay,
        ];
    }

    public function products(Carbon $month): array
    {
        [$start, $end] = [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()];

        $products = OrderItem::query()
            ->with('product.category')
            ->whereHas('order', fn ($q) => $q
                ->whereBetween('created_at', [$start, $end])
                ->where('status', '!=', OrderStatus::Cancelled))
            ->get()
            ->groupBy(fn (OrderItem $item) => $item->product_id ?? 'deleted:'.$item->product_name)
            ->map(fn ($group) => [
                'product_id' => $group->first()->product_id ?? $group->first()->product_name,
                'product_name' => $group->first()->product_name,
                'category_name' => $group->first()->product?->category?->name ?? '—',
                'qty_sold' => (int) $group->sum('qty'),
                'gross' => round((float) $group->sum('line_total'), 2),
            ])
            ->sortByDesc('gross')
            ->values()
            ->all();

        return [
            'month' => $month->format('Y-m'),
            'products' => $products,
        ];
    }

    public function profit(Carbon $month): array
    {
        [$start, $end] = [$month->copy()->startOfMonth(), $month->copy()->endOfMonth()];

        $revenue = (float) Order::query()
            ->whereBetween('created_at', [$start, $end])
            ->where('status', OrderStatus::Completed)
            ->sum('total');

        $cogs = (float) OrderItem::query()
            ->whereHas('order', fn ($q) => $q
                ->whereBetween('created_at', [$start, $end])
                ->where('status', OrderStatus::Completed))
            ->selectRaw('COALESCE(SUM(unit_cost * qty), 0) as total_cost')
            ->value('total_cost');

        $expenses = (float) Expense::query()
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount');

        return [
            'month' => $month->format('Y-m'),
            'revenue' => $revenue,
            'cogs' => round($cogs, 2),
            'gross_profit' => round($revenue - $cogs, 2),
            'expenses' => $expenses,
            'net_profit' => round($revenue - $cogs - $expenses, 2),
        ];
    }
}
