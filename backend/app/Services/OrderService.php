<?php

namespace App\Services;

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Repositories\Contracts\CouponRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\SettingRepositoryInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orders,
        private readonly CouponRepositoryInterface $coupons,
        private readonly SettingRepositoryInterface $settings,
        private readonly LoyaltyService $loyalty,
    ) {
    }

    /**
     * Create an order from the POS cart. Prices, discounts, tax and totals are
     * recomputed server-side from the catalog — the client is never trusted.
     * Also deducts stock, redeems the coupon, records payments, generates the
     * KOT and accrues loyalty points, all inside one transaction.
     *
     * Orders taken while the till was offline arrive later through the same
     * path with `client_uuid` set. That key makes the call idempotent, so a
     * retried sync returns the original order instead of billing again.
     */
    public function placeOrder(User $cashier, array $data, bool $fromOffline = false): Order
    {
        if ($existing = $this->findByClientUuid($data['client_uuid'] ?? null)) {
            return $this->orders->loadFull($existing);
        }

        $placedAt = isset($data['placed_at']) ? Carbon::parse($data['placed_at']) : now();

        return $this->createWithUniqueNumber(function (string $orderNumber) use ($cashier, $data, $fromOffline, $placedAt) {
            $lines = $this->buildLines($data['items'], $fromOffline);
            $subtotal = round(array_sum(array_column($lines, 'line_total')), 2);

            [$coupon, $discount] = $this->resolveDiscount($data, $subtotal, $fromOffline);

            // Service charge is the shop's own revenue and is itself taxable,
            // so it lands on the discounted subtotal and tax is charged on the
            // sum of the two.
            $serviceRate = (float) $this->settings->get('service_charge_rate', '0');
            $taxRate = (float) $this->settings->get('tax_rate', '0');

            $net = $subtotal - $discount;
            $serviceCharge = round($net * $serviceRate / 100, 2);
            $tax = round(($net + $serviceCharge) * $taxRate / 100, 2);
            $total = round($net + $serviceCharge + $tax, 2);

            /** @var Order $order */
            $order = $this->orders->create([
                'order_number' => $orderNumber,
                'client_uuid' => $data['client_uuid'] ?? null,
                'placed_offline' => $fromOffline,
                'kot_number' => 'KOT-'.substr($orderNumber, 4),
                'user_id' => $cashier->id,
                'customer_id' => $data['customer_id'] ?? null,
                'order_type' => $data['order_type'],
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Unpaid,
                'subtotal' => $subtotal,
                'discount_type' => $data['discount_type'] ?? DiscountType::None->value,
                'discount_value' => $data['discount_value'] ?? 0,
                'discount' => $discount,
                'coupon_id' => $coupon?->id,
                'coupon_code' => $coupon?->code,
                'service_charge_rate' => $serviceRate,
                'service_charge' => $serviceCharge,
                'tax_rate' => $taxRate,
                'tax' => $tax,
                'total' => $total,
                'notes' => $data['notes'] ?? null,
            ]);

            // Sales taken offline belong to the hour they were rung up, not to
            // whenever the till reconnected, or the day's reports would lie.
            $this->stampTime($order, $placedAt);

            foreach ($lines as $line) {
                $item = $order->items()->create($line['item']);
                $this->stampTime($item, $placedAt);
                foreach ($line['addons'] as $addon) {
                    $item->addons()->create($addon);
                }
            }

            $coupon?->increment('used_count');

            foreach ($data['payments'] ?? [] as $payment) {
                $this->stampTime($this->recordPayment($order, $cashier, $payment), $placedAt);
            }
            $this->refreshPaymentStatus($order);

            if ($order->customer_id) {
                $points = $this->loyalty->earnForOrder($order);
                $order->update(['loyalty_points_earned' => $points]);
            }

            return $this->orders->loadFull($order);
        }, $placedAt);
    }

    /**
     * Push a batch of orders queued while the till was offline.
     * Each order is independent: one failure never blocks the rest.
     *
     * @return array{synced: array<int, array{client_uuid: string, order_number: string, id: int}>, failed: array<int, array{client_uuid: ?string, message: string}>}
     */
    public function syncOfflineOrders(User $cashier, array $orders): array
    {
        $synced = [];
        $failed = [];

        foreach ($orders as $payload) {
            try {
                $order = $this->placeOrder($cashier, $payload, fromOffline: true);
                $synced[] = [
                    'client_uuid' => $payload['client_uuid'],
                    'order_number' => $order->order_number,
                    'id' => $order->id,
                ];
            } catch (\Throwable $e) {
                $failed[] = [
                    'client_uuid' => $payload['client_uuid'] ?? null,
                    'message' => $e instanceof ValidationException
                        ? collect($e->errors())->flatten()->first()
                        : 'Could not sync this order.',
                ];
            }
        }

        return ['synced' => $synced, 'failed' => $failed];
    }

    public function addPayment(Order $order, User $user, array $payment): Order
    {
        if ($order->status === OrderStatus::Cancelled) {
            throw ValidationException::withMessages(['order' => 'Cannot pay a cancelled order.']);
        }

        return DB::transaction(function () use ($order, $user, $payment) {
            $this->recordPayment($order, $user, $payment);
            $this->refreshPaymentStatus($order);

            return $this->orders->loadFull($order);
        });
    }

    public function changeStatus(Order $order, OrderStatus $newStatus): Order
    {
        if ($order->status->isFinal()) {
            throw ValidationException::withMessages([
                'status' => "Order is already {$order->status->value} and cannot change.",
            ]);
        }

        return DB::transaction(function () use ($order, $newStatus) {
            if ($newStatus === OrderStatus::Cancelled) {
                $this->restoreStock($order);
            }

            $order->update([
                'status' => $newStatus,
                'completed_at' => $newStatus === OrderStatus::Completed ? now() : null,
            ]);

            return $this->orders->loadFull($order);
        });
    }

    public function advance(Order $order): Order
    {
        $next = $order->status->next();
        if (! $next) {
            throw ValidationException::withMessages(['status' => 'Order cannot be advanced further.']);
        }

        return $this->changeStatus($order, $next);
    }

    private function findByClientUuid(?string $uuid): ?Order
    {
        return $uuid ? Order::query()->where('client_uuid', $uuid)->first() : null;
    }

    /**
     * Order numbers are sequential per day, so two tills (or a burst of synced
     * offline orders) can race for the same number. Retry on the unique-index
     * violation rather than handing out a duplicate.
     */
    private function createWithUniqueNumber(callable $callback, Carbon $placedAt): Order
    {
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            try {
                return DB::transaction(fn () => $callback($this->orders->nextOrderNumber($placedAt)));
            } catch (QueryException $e) {
                $isDuplicate = str_contains($e->getMessage(), 'orders_order_number_unique')
                    || (int) ($e->errorInfo[1] ?? 0) === 1062;

                if (! $isDuplicate || $attempt === 5) {
                    throw $e;
                }
                usleep(random_int(10_000, 60_000));
            }
        }

        throw new \RuntimeException('Could not allocate an order number.');
    }

    /**
     * Build order-item rows from cart input, validating stock and snapshotting
     * names/prices so history survives later catalog edits.
     *
     * Offline orders are food already handed over, so a stock shortfall is
     * recorded (stock floors at zero) instead of rejecting the sale.
     */
    private function buildLines(array $items, bool $fromOffline): array
    {
        $lines = [];

        foreach ($items as $input) {
            /** @var Product $product */
            $product = Product::query()
                ->with(['variants', 'addons'])
                ->findOrFail($input['product_id']);

            $qty = (int) $input['qty'];

            if ($product->track_stock) {
                if ($product->stock_qty < $qty && ! $fromOffline) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$product->name} ({$product->stock_qty} left).",
                    ]);
                }
                $product->update(['stock_qty' => max(0, $product->stock_qty - $qty)]);
            }

            $variant = null;
            if (! empty($input['variant_id'])) {
                $variant = $product->variants->firstWhere('id', $input['variant_id']);
                if (! $variant) {
                    throw ValidationException::withMessages([
                        'items' => "Invalid variant for {$product->name}.",
                    ]);
                }
            }

            $addons = $product->addons->whereIn('id', $input['addon_ids'] ?? [])->values();

            $unitPrice = (float) ($variant?->price ?? $product->price)
                + (float) $addons->sum('price');

            $lines[] = [
                'line_total' => round($unitPrice * $qty, 2),
                'item' => [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'variant_id' => $variant?->id,
                    'variant_name' => $variant?->name,
                    'qty' => $qty,
                    'unit_price' => round($unitPrice, 2),
                    'unit_cost' => (float) $product->cost,
                    'line_total' => round($unitPrice * $qty, 2),
                    'notes' => $input['notes'] ?? null,
                ],
                'addons' => $addons->map(fn ($addon) => [
                    'addon_id' => $addon->id,
                    'addon_name' => $addon->name,
                    'price' => $addon->price,
                ])->all(),
            ];
        }

        return $lines;
    }

    /** @return array{0: ?Coupon, 1: float} */
    private function resolveDiscount(array $data, float $subtotal, bool $fromOffline): array
    {
        $manual = match ($data['discount_type'] ?? DiscountType::None->value) {
            DiscountType::Percent->value => $subtotal * ((float) ($data['discount_value'] ?? 0)) / 100,
            DiscountType::Fixed->value => (float) ($data['discount_value'] ?? 0),
            default => 0.0,
        };

        $coupon = null;
        $couponDiscount = 0.0;
        if (! empty($data['coupon_code'])) {
            $coupon = $this->coupons->findByCode($data['coupon_code']);
            $usable = $coupon && $coupon->isUsable() && $subtotal >= (float) $coupon->min_order_amount;

            if (! $usable && ! $fromOffline) {
                throw ValidationException::withMessages(['coupon_code' => 'Coupon is not valid for this order.']);
            }
            // The customer already got the discount at the counter — honour it.
            $couponDiscount = $coupon ? $coupon->discountFor($subtotal) : 0.0;
        }

        return [$coupon, round(min($subtotal, $manual + $couponDiscount), 2)];
    }

    /** Backdate a freshly created row without opening it to mass assignment. */
    private function stampTime(Model $model, Carbon $at): void
    {
        if ($at->diffInSeconds($model->created_at) < 1) {
            return;
        }

        $model->timestamps = false;
        $model->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
        $model->timestamps = true;
    }

    private function recordPayment(Order $order, User $user, array $payment): Payment
    {
        $amount = round((float) $payment['amount'], 2);
        $tendered = isset($payment['tendered']) ? round((float) $payment['tendered'], 2) : null;

        return $order->payments()->create([
            'user_id' => $user->id,
            'method' => $payment['method'],
            'amount' => $amount,
            'tendered' => $tendered,
            'change_given' => $tendered !== null ? max(0, round($tendered - $amount, 2)) : null,
        ]);
    }

    private function refreshPaymentStatus(Order $order): void
    {
        $paid = round((float) $order->payments()->sum('amount'), 2);

        $order->update([
            'payment_status' => match (true) {
                $paid <= 0 => PaymentStatus::Unpaid,
                $paid < (float) $order->total => PaymentStatus::Partial,
                default => PaymentStatus::Paid,
            },
        ]);
    }

    private function restoreStock(Order $order): void
    {
        foreach ($order->items()->with('product')->get() as $item) {
            if ($item->product?->track_stock) {
                $item->product->increment('stock_qty', $item->qty);
            }
        }
    }
}
