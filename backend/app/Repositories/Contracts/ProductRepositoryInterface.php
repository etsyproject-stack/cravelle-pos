<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

interface ProductRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Search products with optional filters:
     * category_id, search (name/sku), active.
     */
    public function search(array $filters): Collection;

    public function createWithRelations(array $attributes, array $variants, array $addonIds): Product;

    public function updateWithRelations(Product $product, array $attributes, array $variants, array $addonIds): Product;

    public function adjustStock(Product $product, string $type, int $qty): Product;
}
