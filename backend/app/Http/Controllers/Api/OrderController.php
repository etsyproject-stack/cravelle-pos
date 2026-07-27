<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\SyncOrdersRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderRepositoryInterface $orders,
        private readonly OrderService $orderService,
    ) {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return OrderResource::collection(
            $this->orders->paginateWithFilters($request->only(['status', 'date', 'customer_id']))
        );
    }

    public function show(Order $order): OrderResource
    {
        return new OrderResource($this->orders->loadFull($order));
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orderService->placeOrder($request->user(), $request->validated());

        return (new OrderResource($order))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    /** Upload orders that were taken while the till had no connection. */
    public function sync(SyncOrdersRequest $request): JsonResponse
    {
        $result = $this->orderService->syncOfflineOrders(
            $request->user(),
            $request->validated('orders')
        );

        return response()->json(['data' => $result]);
    }

    public function updateStatus(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(OrderStatus::values())],
        ]);

        return new OrderResource(
            $this->orderService->changeStatus($order, OrderStatus::from($validated['status']))
        );
    }

    public function addPayment(Request $request, Order $order): OrderResource
    {
        $validated = $request->validate([
            'method' => ['required', Rule::in(\App\Enums\PaymentMethod::values())],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'tendered' => ['nullable', 'numeric', 'min:0'],
        ]);

        return new OrderResource($this->orderService->addPayment($order, $request->user(), $validated));
    }

    public function kot(Order $order): OrderResource
    {
        return new OrderResource($this->orders->loadFull($order));
    }
}
