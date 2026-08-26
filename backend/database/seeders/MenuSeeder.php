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
 * Safe to re-run: products and categories are matched by name and updated in
 * place, so order history survives. Anything no longer on the menu is
 * deactivated rather than deleted, for the same reason — a deleted product
 * would orphan the order lines that reference it.
 *
 * Cost prices are intentionally left at 0 on first insert — fill them in per
 * product on the Products screen so the Profit report reflects real margins.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $addons = collect([
            ['name' => 'Cheese Slice', 'price' => 99],
            ['name' => 'Pickle Vegies', 'price' => 99],

            ['name' => 'Garlic Mayo Sauce', 'price' => 99],
            ['name' => 'Dynamite Sauce', 'price' => 99],
            ['name' => 'Chipotle Sauce', 'price' => 99],
            ['name' => 'Ranch Sauce', 'price' => 99],
            ['name' => 'Sour Cream Sauce', 'price' => 99],
            ['name' => 'Creamy Mayo Sauce', 'price' => 99],
            ['name' => 'Southwest Sauce', 'price' => 99],
            ['name' => 'Honey Mustard Sauce', 'price' => 99],
            ['name' => 'Red Dragon Sauce', 'price' => 99],

            // Toppings are priced per size on the printed menu.
            ['name' => 'Extra Cheese (Small)', 'price' => 149],
            ['name' => 'Extra Cheese (Medium)', 'price' => 249],
            ['name' => 'Extra Cheese (Large)', 'price' => 349],
            ['name' => 'Extra Chicken (Small)', 'price' => 149],
            ['name' => 'Extra Chicken (Medium)', 'price' => 249],
            ['name' => 'Extra Chicken (Large)', 'price' => 349],
        ])->map(fn (array $addon) => Addon::query()->updateOrCreate(
            ['name' => $addon['name']],
            [...$addon, 'is_active' => true]
        ));

        $ids = fn (array $names) => $addons->whereIn('name', $names)->pluck('id')->all();

        $sauces = [
            'Garlic Mayo Sauce', 'Dynamite Sauce', 'Chipotle Sauce', 'Ranch Sauce',
            'Sour Cream Sauce', 'Creamy Mayo Sauce', 'Southwest Sauce',
            'Honey Mustard Sauce', 'Red Dragon Sauce',
        ];

        // Burgers, wraps and sandwiches list only these two under ADD ON.
        $handheldAddons = ['Cheese Slice', 'Pickle Vegies'];

        // Starters and fries are the things people order a dip with.
        $dipAddons = $sauces;

        $toppings = [
            'Extra Cheese (Small)', 'Extra Cheese (Medium)', 'Extra Cheese (Large)',
            'Extra Chicken (Small)', 'Extra Chicken (Medium)', 'Extra Chicken (Large)',
        ];

        $pizzaSizes = fn (int $s, int $m, int $l) => [['Small', $s], ['Medium', $m], ['Large', $l]];

        $menu = [
            [
                'category' => ['name' => 'Starters', 'icon' => '🍗', 'sort_order' => 1],
                'products' => [
                    ['name' => 'Red Dragon Wings', 'price' => 799, 'image' => '🔥', 'addons' => $dipAddons,
                        'description' => '10 pieces'],
                    ['name' => 'Crispo Wings', 'price' => 749, 'image' => '🍗', 'addons' => $dipAddons,
                        'description' => '10 pieces'],
                    ['name' => 'Baked Wings', 'price' => 749, 'image' => '🍗', 'addons' => $dipAddons,
                        'description' => '10 pieces'],
                    ['name' => 'Chicken Strips', 'price' => 749, 'image' => '🍗', 'addons' => $dipAddons,
                        'description' => 'Crispy chicken strips with fries — 4 pieces'],
                    ['name' => 'Nuggets', 'price' => 699, 'image' => '🍗', 'addons' => $dipAddons,
                        'description' => '10 pieces'],
                ],
            ],
            [
                'category' => ['name' => 'Fries', 'icon' => '🍟', 'sort_order' => 2],
                'products' => [
                    ['name' => 'Plain Fries', 'price' => 149, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 149], ['Large', 299]]],
                    ['name' => 'Masala Fries', 'price' => 199, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 199], ['Large', 399]]],
                    ['name' => 'Overloaded Fries', 'price' => 349, 'image' => '🍟', 'addons' => $dipAddons,
                        'variants' => [['Small', 349], ['Large', 649]]],
                ],
            ],
            [
                'category' => ['name' => 'Burgers', 'icon' => '🍔', 'sort_order' => 3],
                'products' => [
                    ['name' => 'Crispo Burger', 'price' => 649, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Crispy thigh fillet with garlic mayo and chipotle sauce'],
                    ['name' => 'Grill Burger', 'price' => 649, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Juicy grilled breast with garlic mayo, chipotle sauce and dynamite sauce'],
                    ['name' => 'Red Dragon Burger', 'price' => 699, 'image' => '🔥', 'addons' => $handheldAddons,
                        'description' => 'Crispy fillet coated with red dragon korean sauce and chipotle sauce'],
                    ['name' => 'Burger of Your Choice', 'price' => 799, 'image' => '🍔', 'addons' => $handheldAddons,
                        'description' => 'Crispy thigh fillet, sauce of your choice'],
                ],
            ],
            [
                'category' => ['name' => 'Wraps', 'icon' => '🌯', 'sort_order' => 4],
                'products' => [
                    ['name' => 'Cravellé Special Wrap', 'price' => 749, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and three different sauces'],
                    ['name' => 'Crispo Wrap', 'price' => 699, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Crispy chicken with salad, garlic mayo and chipotle sauce'],
                    ['name' => 'Red Dragon Wrap', 'price' => 749, 'image' => '🔥', 'addons' => $handheldAddons,
                        'description' => 'Crispy chicken coated with red dragon korean sauce, fries, salad and chipotle sauce'],
                    ['name' => 'Tex-Mex Wrap', 'price' => 699, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and garlic mayo sauce'],
                    ['name' => 'Wrap of Your Choice', 'price' => 799, 'image' => '🌯', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with sauces of your choice'],
                ],
            ],
            [
                'category' => ['name' => 'Sandwiches', 'icon' => '🥪', 'sort_order' => 5],
                'products' => [
                    ['name' => 'Crispo Sandwich', 'price' => 849, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Fried chicken, ice berg, cucumber, tomato, jalapeños, cheese slice, chipotle sauce and garlic mayo sauce'],
                    ['name' => 'Club Sandwich', 'price' => 799, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fried egg, tomato, cucumber, cheese slice, dynamite sauce, garlic mayo sauce'],
                    ['name' => 'Royal Club Sandwich', 'price' => 849, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken cooked in capsicum, onion, jalapeños and ketchup, fried egg, cucumber, tomato with garlic mayo and chipotle sauce'],
                    ['name' => 'Sandwich of Your Choice', 'price' => 699, 'image' => '🥪', 'addons' => $handheldAddons,
                        'description' => 'Grilled chicken, fries with salad and garlic mayo sauce'],
                ],
            ],
            [
                'category' => ['name' => 'Baked Pan Dough Sandwiches', 'icon' => '🫓', 'sort_order' => 6],
                'products' => [
                    ['name' => 'Tikka Sandwich', 'price' => 749, 'image' => '🫓', 'addons' => $handheldAddons,
                        'description' => 'Special sauce, tikka chicken, onion, tomato, capsicum, mozzarella cheese'],
                    ['name' => 'Fajita Sandwich', 'price' => 749, 'image' => '🫓', 'addons' => $handheldAddons,
                        'description' => 'Special sauce, fajita chicken, onion, tomato, capsicum, mozzarella cheese'],
                    ['name' => 'Crunch Sandwich', 'price' => 849, 'image' => '🫓', 'addons' => $handheldAddons,
                        'description' => 'Special sauce, crispy chicken, onion, tomato, capsicum, mozzarella cheese'],
                ],
            ],
            [
                'category' => ['name' => 'Pastas', 'icon' => '🍝', 'sort_order' => 7],
                'products' => [
                    ['name' => 'Flaming Pasta', 'price' => 799, 'image' => '🍝', 'addons' => $toppings,
                        'description' => 'Pasta, chicken, spicy sauce, capsicum, jalapeños, mozzarella cheese and italian herbs'],
                    ['name' => 'Special Pasta', 'price' => 849, 'image' => '🍝', 'addons' => $toppings,
                        'description' => 'Pasta, chicken, creamy sauce, mushrooms, sweet corn, black olives, mozzarella cheese and italian herbs'],
                    ['name' => 'Crunch Pasta', 'price' => 849, 'image' => '🍝', 'addons' => $toppings,
                        'description' => 'Pasta, crispy chicken, creamy sauce, mozzarella cheese and italian herbs'],
                    // The printed card shows 945; the shop bills 949.
                    ['name' => 'Fettuccine Alfredo', 'price' => 949, 'image' => '🍝', 'addons' => $toppings,
                        'description' => 'Fettuccine pasta, alfredo sauce with parmesan cheese, garlic, butter and parsley'],
                ],
            ],
            [
                'category' => ['name' => 'Signature Pizzas', 'icon' => '🍕', 'sort_order' => 8],
                'products' => [
                    ['name' => 'Cravellé Special Pizza', 'price' => 749, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Tikka chicken, fajita chicken, special sauce, onion, mushrooms, black olives, capsicum, mozzarella cheese',
                        'variants' => $pizzaSizes(749, 1099, 1899)],
                    ['name' => 'Crown Feast Pizza', 'price' => 749, 'image' => '👑', 'addons' => $toppings,
                        'description' => 'Fajita chicken, fiery sauce, onion, tomato, capsicum, black olives, jalapeños, mozzarella cheese',
                        'variants' => $pizzaSizes(749, 1099, 1899)],
                    ['name' => 'Behari Kebab Pizza', 'price' => 749, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Spicy chicken, behari kebab, peri peri sauce, onion, mozzarella cheese',
                        'variants' => $pizzaSizes(749, 1099, 1899)],
                    ['name' => 'Rancher Pizza', 'price' => 749, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Spicy chicken, special sauce, onion, mushrooms, mozzarella cheese',
                        'variants' => $pizzaSizes(749, 1099, 1899)],
                ],
            ],
            [
                'category' => ['name' => 'Traditional Pizzas', 'icon' => '🍕', 'sort_order' => 9],
                'products' => [
                    ['name' => 'Chicken Tikka Pizza', 'price' => 699, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Tikka chicken, mild pizza sauce, onion, tomato, black olives, mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                    ['name' => 'Fajita Pizza', 'price' => 699, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Fajita chicken, mild pizza sauce, onion, capsicum, jalapeños, mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                    ['name' => 'Bonfire Pizza', 'price' => 699, 'image' => '🔥', 'addons' => $toppings,
                        'description' => 'Spicy chicken, special sauce, onion, capsicum, tomato, jalapeños, black olives, mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                    ['name' => 'Veggie Lover Pizza', 'price' => 699, 'image' => '🥬', 'addons' => $toppings,
                        'description' => 'Mild pizza sauce, sweet corn, black olives, onion, tomato, capsicum, mushrooms, mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                    ['name' => 'Cheese Lover Pizza', 'price' => 699, 'image' => '🧀', 'addons' => $toppings,
                        'description' => 'Special sauce, extra mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                    ['name' => 'Chicken Supreme Pizza', 'price' => 699, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Tikka chicken, fajita chicken, mild pizza sauce, onion, tomato, capsicum, black olives, sweet corn, mozzarella cheese',
                        'variants' => $pizzaSizes(699, 999, 1749)],
                ],
            ],
            [
                // Extreme pizzas are only made in medium and large.
                'category' => ['name' => 'Extreme Pizzas', 'icon' => '🌶️', 'sort_order' => 10],
                'products' => [
                    ['name' => 'Extreme Peri Peri Pizza', 'price' => 1499, 'image' => '🌶️', 'addons' => $toppings,
                        'description' => 'Spicy chicken, fiery peri peri sauce, onion, capsicum, mozzarella cheese',
                        'variants' => [['Medium', 1499], ['Large', 2149]]],
                    ['name' => 'Extreme Crispo Pizza', 'price' => 1499, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Crispy chicken, special mayo sauce, onion, tomato, capsicum, mozzarella cheese',
                        'variants' => [['Medium', 1499], ['Large', 2149]]],
                    ['name' => 'Extreme Mughlai Pizza', 'price' => 1499, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Special chicken, fiery sauce, onion, capsicum, mozzarella cheese',
                        'variants' => [['Medium', 1499], ['Large', 2149]]],
                    ['name' => 'Deep Dish Special Pizza', 'price' => 1499, 'image' => '🍕', 'addons' => $toppings,
                        'description' => 'Chicken, fiery sauce, special sauce, onion, capsicum, jalapeños, mozzarella cheese',
                        'variants' => [['Medium', 1499], ['Large', 2149]]],
                ],
            ],
            [
                'category' => ['name' => 'Sauces', 'icon' => '🥫', 'sort_order' => 11],
                'products' => [
                    ['name' => 'Garlic Mayo Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Dynamite Sauce', 'price' => 99, 'image' => '🌶️'],
                    ['name' => 'Chipotle Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Ranch Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Sour Cream Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Creamy Mayo Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Southwest Sauce', 'price' => 99, 'image' => '🥫'],
                    ['name' => 'Honey Mustard Sauce', 'price' => 99, 'image' => '🍯'],
                    ['name' => 'Red Dragon Sauce', 'price' => 99, 'image' => '🐉'],
                ],
            ],
            [
                'category' => ['name' => 'Special Drinks', 'icon' => '🍹', 'sort_order' => 12],
                'products' => [
                    ['name' => 'Mint Margarita', 'price' => 349, 'image' => '🍹',
                        'variants' => [['Small', 349], ['Large', 549]]],
                    ['name' => 'Peach Ice Tea', 'price' => 349, 'image' => '🧋',
                        'variants' => [['Small', 349], ['Large', 549]]],
                    ['name' => 'Blue Lagon', 'price' => 349, 'image' => '🥤',
                        'variants' => [['Small', 349], ['Large', 549]]],
                ],
            ],
            [
                'category' => ['name' => 'Drinks', 'icon' => '🥤', 'sort_order' => 13],
                'products' => [
                    ['name' => 'Regular Drink', 'price' => 99, 'image' => '🥤', 'stock' => 120],
                    ['name' => 'Half Litre Drink', 'price' => 149, 'image' => '🥤', 'stock' => 80],
                    ['name' => '1.5 Litre Drink', 'price' => 239, 'image' => '🧃', 'stock' => 40],
                    ['name' => 'Small Water', 'price' => 69, 'image' => '💧', 'stock' => 100],
                ],
            ],
            [
                'category' => ['name' => 'Desserts', 'icon' => '🍰', 'sort_order' => 14],
                'products' => [
                    ['name' => 'Molten Lava', 'price' => 849, 'image' => '🍫',
                        'description' => 'Served with a scoop of vanilla ice cream'],
                ],
            ],
        ];

        $keepProductIds = [];
        $keepCategoryIds = [];

        foreach ($menu as $entry) {
            $category = Category::query()->updateOrCreate(
                ['name' => $entry['category']['name']],
                [...$entry['category'], 'is_active' => true]
            );
            $keepCategoryIds[] = $category->id;

            foreach ($entry['products'] as $item) {
                $existing = Product::query()->where('name', $item['name'])->first();

                $product = Product::query()->updateOrCreate(
                    ['name' => $item['name']],
                    [
                        'category_id' => $category->id,
                        'sku' => Str::upper(Str::slug($item['name'], '-')),
                        'description' => $item['description'] ?? null,
                        'image' => $item['image'],
                        'price' => $item['price'],
                        // Never wipe a cost or a stock count the shop has entered.
                        'cost' => $existing?->cost ?? 0,
                        'track_stock' => isset($item['stock']),
                        'stock_qty' => $existing?->stock_qty ?? $item['stock'] ?? 0,
                        'low_stock_threshold' => 20,
                        'is_active' => true,
                    ]
                );
                $keepProductIds[] = $product->id;

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

        // Anything dropped from the menu is hidden, not deleted — past orders
        // still point at these rows.
        Product::query()->whereNotIn('id', $keepProductIds)->update(['is_active' => false]);
        Category::query()->whereNotIn('id', $keepCategoryIds)->update(['is_active' => false]);
    }
}
