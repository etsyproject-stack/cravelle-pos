<?php

namespace App\Repositories\Contracts;

use App\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface OrderRepositoryInterface extends BaseRepositoryInterface
{
    public function paginateWithFilters(array $filters, int $perPage = 25): LengthAwarePaginator;

    /** Active (pending/preparing/ready) orders for the KDS, oldest first. */
    public function kitchenQueue(): Collection;

    public function recent(int $limit = 10): Collection;

    public function nextOrderNumber(): string;

    public function loadFull(Order $order): Order;
}
