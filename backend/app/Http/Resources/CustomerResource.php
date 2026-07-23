<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'loyalty_points' => $this->loyalty_points,
            'is_walk_in' => $this->is_walk_in,
            'orders_count' => $this->whenCounted('orders'),
            'created_at' => $this->created_at,
        ];
    }
}
