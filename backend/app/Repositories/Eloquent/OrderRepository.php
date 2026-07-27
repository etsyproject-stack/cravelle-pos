<?php

namespace App\Repositories\Eloquent;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class OrderRepository extends BaseRepository implements OrderRepositoryInterface
{
    public function __construct(Order $model)
    {
        parent::__construct($model);
    }

    public function paginateWithFilters(array $filters, int $perPage = 25): LengthAwarePaginator
    {
        return Order::query()
            ->with(['customer', 'cashier', 'items.addons', 'payments'])
            ->withCount('items')
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['date'] ?? null, fn ($q, $date) => $q->whereDate('created_at', $date))
            ->when($filters['customer_id'] ?? null, fn ($q, $id) => $q->where('customer_id', $id))
            ->latest()
            ->paginate($perPage);
    }

    public function kitchenQueue(): Collection
    {
        return Order::query()
            ->with(['items.addons'])
            ->whereIn('status', OrderStatus::kitchenStatuses())
            ->oldest()
            ->get();
    }

    public function recent(int $limit = 10): Collection
    {
        return Order::query()
            ->with(['customer'])
            ->withCount('items')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function nextOrderNumber(?Carbon $date = null): string
    {
        $date ??= now();
        $prefix = 'ORD-'.$date->format('Ymd').'-';

        // Take the highest sequence already issued for that day rather than a
        // row count, so cancelled or deleted orders never reissue a number.
        $lastNumber = Order::query()
            ->where('order_number', 'like', $prefix.'%')
            ->orderByDesc('order_number')
            ->value('order_number');

        $next = $lastNumber ? ((int) substr($lastNumber, -4)) + 1 : 1;

        return $prefix.sprintf('%04d', $next);
    }

    public function loadFull(Order $order): Order
    {
        return $order->load(['customer', 'cashier', 'items.addons', 'payments'])
            ->loadCount('items');
    }
}
