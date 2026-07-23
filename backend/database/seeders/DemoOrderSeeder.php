<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Generates ~30 days of realistic completed orders (plus a few live ones)
 * so the dashboard, KDS and reports have data straight after seeding.
 */
class DemoOrderSeeder extends Seeder
{
    public function run(): void
    {
        if (Order::query()->exists()) {
            return; // never duplicate demo history
        }

        $cashier = User::query()->where('email', 'cashier@cravelle.test')->first();
        $customers = Customer::query()->where('is_walk_in', false)->get();
        $products = Product::query()->with('variants')->get();
        $taxRate = 10.0;

        mt_srand(42); // deterministic demo data

        $counters = [];

        for ($daysAgo = 30; $daysAgo >= 0; $daysAgo--) {
            $ordersToday = mt_rand(4, 10);

            for ($i = 0; $i < $ordersToday; $i++) {
                $createdAt = now()->subDays($daysAgo)->setTime(mt_rand(11, 22), mt_rand(0, 59));
                if ($createdAt->isFuture()) {
                    // Early in the day: pull today's orders into the recent past
                    // so the dashboard and KDS still have live demo data.
                    $createdAt = now()->subMinutes(mt_rand(5, 120));
                }

                $dateKey = $createdAt->format('Ymd');
                $counters[$dateKey] = ($counters[$dateKey] ?? 0) + 1;
                $orderNumber = sprintf('ORD-%s-%04d', $dateKey, $counters[$dateKey]);

                // Recent orders stay live for the KDS demo; the rest complete.
                $status = $daysAgo === 0 && $i >= $ordersToday - 3
                    ? [OrderStatus::Pending, OrderStatus::Preparing, OrderStatus::Ready][$i % 3]
                    : OrderStatus::Completed;

                $customer = mt_rand(0, 3) === 0 ? $customers->random() : null;

                $order = Order::query()->create([
                    'order_number' => $orderNumber,
                    'kot_number' => 'KOT-'.substr($orderNumber, 4),
                    'user_id' => $cashier->id,
                    'customer_id' => $customer?->id,
                    'order_type' => collect(OrderType::cases())->random(),
                    'status' => $status,
                    'payment_status' => PaymentStatus::Paid,
                    'tax_rate' => $taxRate,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                    'completed_at' => $status === OrderStatus::Completed ? $createdAt->copy()->addMinutes(mt_rand(8, 25)) : null,
                ]);

                $subtotal = 0;
                foreach ($products->random(mt_rand(1, 4)) as $product) {
                    $variant = $product->variants->isNotEmpty() ? $product->variants->random() : null;
                    $qty = mt_rand(1, 3);
                    $unitPrice = (float) ($variant?->price ?? $product->price);
                    $lineTotal = round($unitPrice * $qty, 2);
                    $subtotal += $lineTotal;

                    $order->items()->create([
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'variant_id' => $variant?->id,
                        'variant_name' => $variant?->name,
                        'qty' => $qty,
                        'unit_price' => $unitPrice,
                        'unit_cost' => (float) $product->cost,
                        'line_total' => $lineTotal,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }

                $tax = round($subtotal * $taxRate / 100, 2);
                $total = round($subtotal + $tax, 2);
                $order->update(['subtotal' => $subtotal, 'tax' => $tax, 'total' => $total]);

                $order->payments()->create([
                    'user_id' => $cashier->id,
                    'method' => collect(PaymentMethod::cases())->random(),
                    'amount' => $total,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }

        mt_srand();
    }
}
