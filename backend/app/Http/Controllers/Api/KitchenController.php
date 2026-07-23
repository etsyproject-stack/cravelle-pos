<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Services\OrderService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class KitchenController extends Controller
{
    public function __construct(
        private readonly OrderRepositoryInterface $orders,
        private readonly OrderService $orderService,
    ) {
    }

    public function index(): AnonymousResourceCollection
    {
        return OrderResource::collection($this->orders->kitchenQueue());
    }

    public function advance(Order $order): OrderResource
    {
        return new OrderResource($this->orderService->advance($order));
    }
}
