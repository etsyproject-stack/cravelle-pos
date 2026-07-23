<?php

namespace App\Repositories\Eloquent;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductRepository extends BaseRepository implements ProductRepositoryInterface
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function search(array $filters): Collection
    {
        return Product::query()
            ->with(['category', 'variants', 'addons' => fn ($q) => $q->where('is_active', true)])
            ->when($filters['category_id'] ?? null, fn ($q, $id) => $q->where('category_id', $id))
            ->when($filters['search'] ?? null, function ($q, $term) {
                $q->where(fn ($sub) => $sub
                    ->where('name', 'like', "%{$term}%")
                    ->orWhere('sku', 'like', "%{$term}%"));
            })
            ->when(isset($filters['active']), fn ($q) => $q->where('is_active', (bool) $filters['active']))
            ->orderBy('name')
            ->get();
    }

    public function createWithRelations(array $attributes, array $variants, array $addonIds): Product
    {
        return DB::transaction(function () use ($attributes, $variants, $addonIds) {
            $attributes['sku'] = $attributes['sku'] ?: $this->generateSku($attributes['name']);
            $product = Product::query()->create($attributes);
            $this->syncVariants($product, $variants);
            $product->addons()->sync($addonIds);

            return $product->load(['category', 'variants', 'addons']);
        });
    }

    public function updateWithRelations(Product $product, array $attributes, array $variants, array $addonIds): Product
    {
        return DB::transaction(function () use ($product, $attributes, $variants, $addonIds) {
            $attributes['sku'] = $attributes['sku'] ?: $product->sku;
            $product->update($attributes);
            $this->syncVariants($product, $variants);
            $product->addons()->sync($addonIds);

            return $product->refresh()->load(['category', 'variants', 'addons']);
        });
    }

    public function adjustStock(Product $product, string $type, int $qty): Product
    {
        $newQty = match ($type) {
            'add' => $product->stock_qty + $qty,
            'remove' => max(0, $product->stock_qty - $qty),
            'set' => $qty,
        };

        $product->update(['stock_qty' => $newQty]);

        return $product->refresh();
    }

    private function syncVariants(Product $product, array $variants): void
    {
        $keepIds = [];
        foreach (array_values($variants) as $index => $variant) {
            $data = [
                'name' => $variant['name'],
                'price' => $variant['price'],
                'sort_order' => $index,
            ];
            if (! empty($variant['id'])) {
                $existing = $product->variants()->find($variant['id']);
                if ($existing) {
                    $existing->update($data);
                    $keepIds[] = $existing->id;

                    continue;
                }
            }
            $keepIds[] = $product->variants()->create($data)->id;
        }
        $product->variants()->whereNotIn('id', $keepIds)->delete();
    }

    private function generateSku(string $name): string
    {
        $base = Str::upper(Str::slug(Str::limit($name, 12, ''), '-'));

        do {
            $sku = $base.'-'.Str::upper(Str::random(4));
        } while (Product::query()->where('sku', $sku)->exists());

        return $sku;
    }
}
