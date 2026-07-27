<?php

namespace App\Models;

use App\Enums\DiscountType;
use App\Enums\OrderStatus;
use App\Enums\OrderType;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'client_uuid',
        'placed_offline',
        'kot_number',
        'user_id',
        'customer_id',
        'order_type',
        'status',
        'payment_status',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount',
        'coupon_id',
        'coupon_code',
        'tax_rate',
        'tax',
        'total',
        'notes',
        'loyalty_points_earned',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'order_type' => OrderType::class,
            'status' => OrderStatus::class,
            'payment_status' => PaymentStatus::class,
            'discount_type' => DiscountType::class,
            'subtotal' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'loyalty_points_earned' => 'integer',
            'placed_offline' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function amountPaid(): float
    {
        return (float) $this->payments->sum('amount');
    }
}
