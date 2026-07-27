<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * The live Cravelle 2.0 menu (prices in PKR).
 *
 * Cost prices are intentionally left at 0 — fill them in per product on the
 * Products screen so the Profit report reflects your real margins.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $addons = collect([
            ['name' => 'Cheese Slice', 'price' => 120],
            ['name' => 'Pickle Vegies', 'price' => 120],
            ['name' => 'Garlic Mayo Sauce', 'price' => 100],
            ['name' => 'Dynamite Sauce', 'price' => 100],
            ['name' => 'Chipotle Sauce', 'price' => 100],
            ['name' => 'Extra Cheese (Small)', 'price' => 100],
            ['name' => 'Extra Cheese (Medium)', 'price' => 150],
            ['name' => 'Extra Cheese (Large)', 'price' => 250],
            ['name' => 'Extra Chicken (Small)', 'price' => 100],
            ['name' => 'Extra Chicken (Medium)', 'price' => 150],
            ['name' => 'Extra Chicken (Large)', 'price' => 250],
        ])->map(fn (array $addon) => Addon::query()->updateOrCreate(
            ['name' => $addon['name']],
            [...$addon, 'is_active' => true]
        ));

        $ids = fn (array $names) => $addons->whereIn('name', $names)->pluck('id')->all();

        $handheldAddons = ['Cheese Slice', 'Pickle Vegies', 'Garlic Mayo Sauce', 'Dynamite Sauce', 'Chipotle Sauce'];
        $pizzaAddons = [
            'Extra Cheese (Small)', 'Extra Cheese (Medium)', 'Extra Cheese (Large)',
            'Extra Chicken (Small)', 'Extra Chicken (Medium)', 'Extra Chicken (Large)',
        ];
        $dipAddons = ['Garlic Mayo Sauce', 'Dynamite Sauce', 'Chipotle Sauce'];

        $menu = [
            [
                'category' => ['name' => 'Starters', 'icon' => '🍗', 'sort_order' => 1],
                'products' => [
                    ['name' => 'Chicken Tenders', 'price' => 450, 'image' => '🍗', 'addons' => $dipAddons,
                        'variants' => [['Small 6 Pcs', 450], ['Large 12 Pcs', 950]]],
                    ['name' => 'Red Dragon Wings', 'price' => 750, 'image' => '🔥', 'addons' => $dipAddons,
                        'variants' => [['6 Pcs', 750], ['12 Pcs', 1400]]],
                    ['name' => 'Plain Wings', 'price' => 650, 'image' => '🍗', 'addons' => $dipAddons,
                        'variants' => [['6 Pcs', 650], ['12 Pcs', 1250]]],
                    ['name' => 'Nuggets', 'price' => 300, 'image' => '🍗', 'addons' => $dipAddons,
                        'variants' => [['Small 6 Pcs', 300], ['Large 12 Pcs', 650]]],
                ],
            ],
            [
                'category' => ['name' => 'Burgers', 'icon' => '🍔', 'sort_order' => 2],
                'products' => [
                    ['name' => 'Crispo Burger', 'price' => 650, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Crispy thigh fillet with garlic mayo and chipotle sauce'],
                    ['name' => 'Grill Burger', 'price' => 650, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Juicy grilled breast with garlic mayo and dynamite sauce'],
                    ['name' => 'Red Dragon Burger', 'price' => 750, 'image' => '🔥', 'addons' => $handheldAddons,
                        'description' => 'Crispy fillet coated with red dragon korean sauce and spicy mayo'],
                    ['name' => 'Burger of Your Choice', 'price' => 800, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Crispy thigh fillet, sauce of your choice'],
                ],
            ],
            [
                'category' => ['name' => 'Wraps', 'icon' => '🌯', 'sort_order' => 3],
                'products' => [
                    ['name' => 'Cravellé Special Wrap', 'price' => 750, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and three different sauces'],
                    ['name' => 'Crispo Wrap', 'price' => 700, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Crispy chicken with salad, garlic mayo and chipotle sauce'],
                    ['name' => 'Red Dragon Wrap', 'price' => 750, 'image' => '🔥', 'addons' => $handheldAddons,
                        'description' => 'Crispy chicken coated with red dragon korean sauce, fries, salad and spicy mayo'],
                    ['name' => 'Tex-Mex Wrap', 'price' => 700, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and garlic mayo sauce'],
                    ['name' => 'Wrap of Your Choice', 'price' => 800, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with sauces of your choice'],
                ],
            ],
            [
                'category' => ['name' => 'Sandwiches', 'icon' => '🥪', 'sort_order' => 4],
                'products' => [
                    ['name' => 'Crispo Sandwich', 'price' => 850, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Fried chicken, ice berg, cucumber, tomato, jalapeños, cheese slice, chipotle sauce and garlic mayo sauce'],
                    ['name' => 'Club Sandwich', 'price' => 800, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fried egg, tomato, cucumber, cheese slice, dynamite sauce, garlic mayo sauce'],
                    ['name' => 'Royal Club Sandwich', 'price' => 850, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken cooked in capsicum, onion, jalapeños and ketchup, fried egg, cucumber, tomato with garlic mayo and chipotle sauce'],
                    ['name' => 'Sandwich of Your Choice', 'price' => 700, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and garlic mayo sauce'],
                ],
            ],
            [
                'category' => ['name' => 'Pizza', 'icon' => '🍕', 'sort_order' => 5],
                'products' => [
                    ['name' => 'Cravellé Special Pizza', 'price' => 750, 'image' => '🍕', 'addons' => $pizzaAddons,
                        'description' => 'Two chicken toppings, capsicum, onions, jalapeños, olives and mushrooms',
                        'variants' => [['Small', 750], ['Medium', 1100], ['Large', 1600]]],
                    ['name' => 'Cravo Supreme Pizza', 'price' => 700, 'image' => '🍕', 'addons' => $pizzaAddons,
                        'description' => 'Tikka topping, onion and mushrooms',
                        'variants' => [['Small', 700], ['Medium', 1050], ['Large', 1500]]],
                    ['name' => 'Flame House Fajita Pizza', 'price' => 750, 'image' => '🍕', 'addons' => $pizzaAddons,
                        'description' => 'Tandoori topping, mushrooms, capsicum, olives, onions, jalapeños and sweet corn',
                        'variants' => [['Small', 750], ['Medium', 1100], ['Large', 1600]]],
                    ['name' => 'Cravo Creamy Pizza', 'price' => 700, 'image' => '🍕', 'addons' => $pizzaAddons,
                        'description' => 'Malai boti topping, onion and capsicum',
                        'variants' => [['Small', 700], ['Medium', 1050], ['Large', 1500]]],
                    ['name' => 'Extreme Peri Peri Pizza', 'price' => 800, 'image' => '🌶️', 'addons' => $pizzaAddons,
                        'description' => 'Jalapeños, spicy chicken topping, capsicum, onion, tomatoes, cheese',
                        'variants' => [['Small', 800], ['Medium', 1400], ['Large', 2000]]],
                    ['name' => 'Extreme Crispo Pizza', 'price' => 800, 'image' => '🍕', 'addons' => $pizzaAddons,
                        'description' => 'Jalapeños, crispy chicken topping, capsicum, onion, tomatoes, cheese',
                        'variants' => [['Small', 800], ['Medium', 1400], ['Large', 2000]]],
                ],
            ],
            [
                'category' => ['name' => 'Fries', 'icon' => '🍟', 'sort_order' => 6],
                'products' => [
                    ['name' => 'Plain Fries', 'price' => 150, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 150], ['Large', 300]]],
                    ['name' => 'Masala Fries', 'price' => 200, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 200], ['Large', 400]]],
                    ['name' => 'Overloaded Fries', 'price' => 350, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 350], ['Large', 650]]],
                ],
            ],
            [
                'category' => ['name' => 'Sauces', 'icon' => '🥫', 'sort_order' => 7],
                'products' => [
                    ['name' => 'Garlic Mayo Sauce', 'price' => 100, 'image' => '🥫'],
                    ['name' => 'Dynamite Sauce', 'price' => 100, 'image' => '🌶️'],
                    ['name' => 'Chipotle Sauce', 'price' => 100, 'image' => '🥫'],
                ],
            ],
            [
                'category' => ['name' => 'Special Drinks', 'icon' => '🍹', 'sort_order' => 8],
                'products' => [
                    ['name' => 'Mint Margarita', 'price' => 300, 'image' => '🍹',
                        'variants' => [['Small', 300], ['Large', 500]]],
                    ['name' => 'Peach Iced Tea', 'price' => 300, 'image' => '🧋',
                        'variants' => [['Small', 300], ['Large', 500]]],
                    ['name' => 'Blue Lagoon', 'price' => 300, 'image' => '🥤',
                        'variants' => [['Small', 300], ['Large', 500]]],
                ],
            ],
            [
                'category' => ['name' => 'Drinks', 'icon' => '🥤', 'sort_order' => 9],
                'products' => [
                    ['name' => 'Regular Drink', 'price' => 100, 'image' => '🥤', 'stock' => 120],
                    ['name' => 'Half Litre Drink', 'price' => 150, 'image' => '🥤', 'stock' => 80],
                    ['name' => '1.5 Litre Drink', 'price' => 240, 'image' => '🧃', 'stock' => 40],
                    ['name' => 'Small Water', 'price' => 70, 'image' => '💧', 'stock' => 100],
                ],
            ],
            [
                'category' => ['name' => 'Desserts', 'icon' => '🍰', 'sort_order' => 10],
                'products' => [
                    ['name' => 'Molten Lava', 'price' => 850, 'image' => '🍫',
                        'description' => 'Served with a scoop of vanilla ice cream'],
                ],
            ],
        ];

        foreach ($menu as $entry) {
            $category = Category::query()->updateOrCreate(
                ['name' => $entry['category']['name']],
                [...$entry['category'], 'is_active' => true]
            );

            foreach ($entry['products'] as $item) {
                $product = Product::query()->updateOrCreate(
                    ['name' => $item['name']],
                    [
                        'category_id' => $category->id,
                        'sku' => Str::upper(Str::slug($item['name'], '-')),
                        'description' => $item['description'] ?? null,
                        'image' => $item['image'],
                        'price' => $item['price'],
                        'cost' => 0,
                        'track_stock' => isset($item['stock']),
                        'stock_qty' => $item['stock'] ?? 0,
                        'low_stock_threshold' => 20,
                        'is_active' => true,
                    ]
                );

                $keepVariantIds = [];
                foreach ($item['variants'] ?? [] as $index => [$name, $price]) {
                    $keepVariantIds[] = $product->variants()->updateOrCreate(
                        ['name' => $name],
                        ['price' => $price, 'sort_order' => $index]
                    )->id;
                }
                $product->variants()->whereNotIn('id', $keepVariantIds)->delete();

                $product->addons()->sync($ids($item['addons'] ?? []));
            }
        }
    }
}
