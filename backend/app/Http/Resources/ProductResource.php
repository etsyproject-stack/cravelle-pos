<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'sku' => $this->sku,
            'description' => $this->description,
            'image' => $this->image,
            'price' => $this->price,
            'cost' => $this->cost,
            'track_stock' => $this->track_stock,
            'stock_qty' => $this->stock_qty,
            'low_stock_threshold' => $this->low_stock_threshold,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'icon' => $this->category->icon,
            ]),
            'variants' => $this->whenLoaded('variants', fn () => $this->variants->map(fn ($variant) => [
                'id' => $variant->id,
                'name' => $variant->name,
                'price' => $variant->price,
            ])),
            'addons' => $this->whenLoaded('addons', fn () => $this->addons->map(fn ($addon) => [
                'id' => $addon->id,
                'name' => $addon->name,
                'price' => $addon->price,
            ])),
        ];
    }
}
