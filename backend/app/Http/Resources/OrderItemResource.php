<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'variant_id' => $this->variant_id,
            'variant_name' => $this->variant_name,
            'qty' => $this->qty,
            'unit_price' => $this->unit_price,
            'line_total' => $this->line_total,
            'notes' => $this->notes,
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn ($addon) => [
                'id' => $addon->id,
                'addon_id' => $addon->addon_id,
                'addon_name' => $addon->addon_name,
                'price' => $addon->price,
            ])),
        ];
    }
}
