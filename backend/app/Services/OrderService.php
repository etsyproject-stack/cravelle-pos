<?php

namespace App\Services;

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Repositories\Contracts\CouponRepositoryInterface;
use App\Repositories\Contracts\OrderRepositoryInterface;
use App\Repositories\Contracts\SettingRepositoryInterface;
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
     */
    public function placeOrder(User $cashier, array $data): Order
    {
        return DB::transaction(function () use ($cashier, $data) {
            $lines = $this->buildLines($data['items']);
            $subtotal = round(array_sum(array_column($lines, 'line_total')), 2);

            [$coupon, $discount] = $this->resolveDiscount($data, $subtotal);

            $taxRate = (float) $this->settings->get('tax_rate', '0');
            $taxable = $subtotal - $discount;
            $tax = round($taxable * $taxRate / 100, 2);
            $total = round($taxable + $tax, 2);

            $orderNumber = $this->orders->nextOrderNumber();

            /** @var Order $order */
            $order = $this->orders->create([
                'order_number' => $orderNumber,
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
                'tax_rate' => $taxRate,
                'tax' => $tax,
                'total' => $total,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($lines as $line) {
                $item = $order->items()->create($line['item']);
                foreach ($line['addons'] as $addon) {
                    $item->addons()->create($addon);
                }
            }

            $coupon?->increment('used_count');

            foreach ($data['payments'] ?? [] as $payment) {
                $this->recordPayment($order, $cashier, $payment);
            }
            $this->refreshPaymentStatus($order);

            if ($order->customer_id) {
                $points = $this->loyalty->earnForOrder($order);
                $order->update(['loyalty_points_earned' => $points]);
            }

            return $this->orders->loadFull($order);
        });
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

    /**
     * Build order-item rows from cart input, validating stock and snapshotting
     * names/prices so history survives later catalog edits.
     */
    private function buildLines(array $items): array
    {
        $lines = [];

        foreach ($items as $input) {
            /** @var Product $product */
            $product = Product::query()
                ->with(['variants', 'addons'])
                ->findOrFail($input['product_id']);

            $qty = (int) $input['qty'];

            if ($product->track_stock) {
                if ($product->stock_qty < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$product->name} ({$product->stock_qty} left).",
                    ]);
                }
                $product->decrement('stock_qty', $qty);
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
    private function resolveDiscount(array $data, float $subtotal): array
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
            if (! $coupon || ! $coupon->isUsable() || $subtotal < (float) $coupon->min_order_amount) {
                throw ValidationException::withMessages(['coupon_code' => 'Coupon is not valid for this order.']);
            }
            $couponDiscount = $coupon->discountFor($subtotal);
        }

        return [$coupon, round(min($subtotal, $manual + $couponDiscount), 2)];
    }

    private function recordPayment(Order $order, User $user, array $payment): void
    {
        $amount = round((float) $payment['amount'], 2);
        $tendered = isset($payment['tendered']) ? round((float) $payment['tendered'], 2) : null;

        $order->payments()->create([
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
