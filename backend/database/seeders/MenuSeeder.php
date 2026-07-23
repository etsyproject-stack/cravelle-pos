<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $addons = collect([
            ['name' => 'Extra Cheese', 'price' => 0.99],
            ['name' => 'Extra Sauce', 'price' => 0.49],
            ['name' => 'Bacon', 'price' => 1.49],
            ['name' => 'Jalapeños', 'price' => 0.79],
            ['name' => 'Extra Patty', 'price' => 2.49],
            ['name' => 'Garlic Dip', 'price' => 0.59],
        ])->map(fn (array $addon) => Addon::query()->updateOrCreate(
            ['name' => $addon['name']],
            $addon
        ));

        $foodAddons = fn (array $names) => $addons->whereIn('name', $names)->pluck('id')->all();

        $menu = [
            [
                'category' => ['name' => 'Burgers', 'icon' => '🍔', 'sort_order' => 1],
                'products' => [
                    ['name' => 'Classic Beef Burger', 'price' => 5.99, 'cost' => 2.20, 'image' => '🍔',
                        'variants' => [['Single', 5.99], ['Double', 7.99], ['Triple', 9.99]],
                        'addons' => ['Extra Cheese', 'Bacon', 'Jalapeños', 'Extra Patty']],
                    ['name' => 'Crispy Chicken Burger', 'price' => 5.49, 'cost' => 2.00, 'image' => '🍔',
                        'variants' => [['Regular', 5.49], ['Spicy', 5.99]],
                        'addons' => ['Extra Cheese', 'Jalapeños', 'Extra Sauce']],
                    ['name' => 'Veggie Burger', 'price' => 4.99, 'cost' => 1.60, 'image' => '🍔',
                        'addons' => ['Extra Cheese', 'Extra Sauce']],
                ],
            ],
            [
                'category' => ['name' => 'Wraps', 'icon' => '🌯', 'sort_order' => 2],
                'products' => [
                    ['name' => 'Grilled Chicken Wrap', 'price' => 5.49, 'cost' => 2.10, 'image' => '🌯',
                        'addons' => ['Extra Sauce', 'Jalapeños', 'Extra Cheese']],
                    ['name' => 'Zinger Wrap', 'price' => 5.99, 'cost' => 2.30, 'image' => '🌯',
                        'addons' => ['Extra Sauce', 'Jalapeños']],
                    ['name' => 'Falafel Wrap', 'price' => 4.79, 'cost' => 1.50, 'image' => '🌯',
                        'addons' => ['Garlic Dip', 'Extra Sauce']],
                ],
            ],
            [
                'category' => ['name' => 'Pizza', 'icon' => '🍕', 'sort_order' => 3],
                'products' => [
                    ['name' => 'Margherita Pizza', 'price' => 7.99, 'cost' => 3.00, 'image' => '🍕',
                        'variants' => [['Small', 7.99], ['Medium', 10.99], ['Large', 13.99]],
                        'addons' => ['Extra Cheese', 'Jalapeños']],
                    ['name' => 'Pepperoni Pizza', 'price' => 8.99, 'cost' => 3.50, 'image' => '🍕',
                        'variants' => [['Small', 8.99], ['Medium', 11.99], ['Large', 14.99]],
                        'addons' => ['Extra Cheese', 'Jalapeños']],
                    ['name' => 'BBQ Chicken Pizza', 'price' => 9.49, 'cost' => 3.80, 'image' => '🍕',
                        'variants' => [['Small', 9.49], ['Medium', 12.49], ['Large', 15.49]],
                        'addons' => ['Extra Cheese', 'Extra Sauce']],
                ],
            ],
            [
                'category' => ['name' => 'Fries', 'icon' => '🍟', 'sort_order' => 4],
                'products' => [
                    ['name' => 'French Fries', 'price' => 2.49, 'cost' => 0.70, 'image' => '🍟',
                        'variants' => [['Small', 2.49], ['Medium', 2.99], ['Large', 3.49]],
                        'addons' => ['Extra Cheese', 'Garlic Dip']],
                    ['name' => 'Curly Fries', 'price' => 2.99, 'cost' => 0.90, 'image' => '🍟',
                        'addons' => ['Extra Cheese', 'Garlic Dip']],
                    ['name' => 'Loaded Cheese Fries', 'price' => 4.49, 'cost' => 1.50, 'image' => '🍟',
                        'addons' => ['Bacon', 'Jalapeños']],
                ],
            ],
            [
                'category' => ['name' => 'Nuggets', 'icon' => '🍗', 'sort_order' => 5],
                'products' => [
                    ['name' => 'Chicken Nuggets', 'price' => 3.99, 'cost' => 1.40, 'image' => '🍗',
                        'variants' => [['6 pcs', 3.99], ['9 pcs', 5.49], ['12 pcs', 6.99]],
                        'addons' => ['Garlic Dip', 'Extra Sauce']],
                    ['name' => 'Spicy Nuggets', 'price' => 4.29, 'cost' => 1.50, 'image' => '🍗',
                        'variants' => [['6 pcs', 4.29], ['9 pcs', 5.79]],
                        'addons' => ['Garlic Dip', 'Extra Sauce']],
                ],
            ],
            [
                'category' => ['name' => 'Shawarma', 'icon' => '🥙', 'sort_order' => 6],
                'products' => [
                    ['name' => 'Chicken Shawarma', 'price' => 4.99, 'cost' => 1.80, 'image' => '🥙',
                        'variants' => [['Regular', 4.99], ['Large', 6.49]],
                        'addons' => ['Garlic Dip', 'Extra Sauce', 'Jalapeños']],
                    ['name' => 'Beef Shawarma', 'price' => 5.49, 'cost' => 2.10, 'image' => '🥙',
                        'variants' => [['Regular', 5.49], ['Large', 6.99]],
                        'addons' => ['Garlic Dip', 'Extra Sauce']],
                    ['name' => 'Shawarma Platter', 'price' => 8.99, 'cost' => 3.40, 'image' => '🥙',
                        'addons' => ['Garlic Dip', 'Extra Sauce']],
                ],
            ],
            [
                'category' => ['name' => 'Drinks', 'icon' => '🥤', 'sort_order' => 7],
                'products' => [
                    ['name' => 'Cola', 'price' => 1.49, 'cost' => 0.40, 'image' => '🥤',
                        'variants' => [['Small', 1.49], ['Medium', 1.99], ['Large', 2.49]],
                        'stock' => 200],
                    ['name' => 'Lemon-Lime Soda', 'price' => 1.49, 'cost' => 0.40, 'image' => '🥤',
                        'variants' => [['Small', 1.49], ['Medium', 1.99], ['Large', 2.49]],
                        'stock' => 150],
                    ['name' => 'Mineral Water', 'price' => 0.99, 'cost' => 0.25, 'image' => '💧', 'stock' => 300],
                    ['name' => 'Iced Tea', 'price' => 1.79, 'cost' => 0.50, 'image' => '🧋', 'stock' => 80],
                ],
            ],
            [
                'category' => ['name' => 'Slush', 'icon' => '🧊', 'sort_order' => 8],
                'products' => [
                    ['name' => 'Blue Raspberry Slush', 'price' => 2.49, 'cost' => 0.60, 'image' => '🧊',
                        'variants' => [['Regular', 2.49], ['Large', 3.29]]],
                    ['name' => 'Strawberry Slush', 'price' => 2.49, 'cost' => 0.60, 'image' => '🍓',
                        'variants' => [['Regular', 2.49], ['Large', 3.29]]],
                    ['name' => 'Mango Slush', 'price' => 2.69, 'cost' => 0.70, 'image' => '🥭',
                        'variants' => [['Regular', 2.69], ['Large', 3.49]]],
                ],
            ],
            [
                'category' => ['name' => 'Juices', 'icon' => '🧃', 'sort_order' => 9],
                'products' => [
                    ['name' => 'Fresh Orange Juice', 'price' => 2.99, 'cost' => 1.00, 'image' => '🍊', 'stock' => 60],
                    ['name' => 'Apple Juice', 'price' => 2.79, 'cost' => 0.90, 'image' => '🍎', 'stock' => 60],
                    ['name' => 'Mango Juice', 'price' => 3.19, 'cost' => 1.10, 'image' => '🥭', 'stock' => 40],
                ],
            ],
        ];

        foreach ($menu as $entry) {
            $category = Category::query()->updateOrCreate(
                ['name' => $entry['category']['name']],
                $entry['category']
            );

            foreach ($entry['products'] as $item) {
                $product = Product::query()->updateOrCreate(
                    ['name' => $item['name']],
                    [
                        'category_id' => $category->id,
                        'sku' => Str::upper(Str::slug($item['name'], '-')),
                        'image' => $item['image'],
                        'price' => $item['price'],
                        'cost' => $item['cost'],
                        'track_stock' => isset($item['stock']),
                        'stock_qty' => $item['stock'] ?? 0,
                        'low_stock_threshold' => 20,
                        'is_active' => true,
                    ]
                );

                foreach ($item['variants'] ?? [] as $index => [$name, $price]) {
                    $product->variants()->updateOrCreate(
                        ['name' => $name],
                        ['price' => $price, 'sort_order' => $index]
                    );
                }

                if (! empty($item['addons'])) {
                    $product->addons()->sync($foodAddons($item['addons']));
                }
            }
        }
    }
}
