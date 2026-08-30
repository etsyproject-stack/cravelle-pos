<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'client_uuid' => $this->client_uuid,
            'placed_offline' => $this->placed_offline,
            'kot_number' => $this->kot_number,
            'order_type' => $this->order_type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => $this->subtotal,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount' => $this->discount,
            'coupon_code' => $this->coupon_code,
            'service_charge_rate' => $this->service_charge_rate,
            'service_charge' => $this->service_charge,
            'tax_rate' => $this->tax_rate,
            'tax' => $this->tax,
            'total' => $this->total,
            'notes' => $this->notes,
            'loyalty_points_earned' => $this->loyalty_points_earned,
            'items_count' => $this->whenCounted('items'),
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
            ]),
            'cashier' => $this->whenLoaded('cashier', fn () => [
                'id' => $this->cashier->id,
                'name' => $this->cashier->name,
            ]),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
        ];
    }
}
