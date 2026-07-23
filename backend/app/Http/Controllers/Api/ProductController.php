<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProductController extends Controller
{
    public function __construct(private readonly ProductRepositoryInterface $products)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return ProductResource::collection(
            $this->products->search($request->only(['category_id', 'search', 'active']))
        );
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product->load(['category', 'variants', 'addons']));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->products->createWithRelations(
            $request->productAttributes(),
            $request->validated('variants', []),
            $request->validated('addon_ids', []),
        );

        return (new ProductResource($product))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(StoreProductRequest $request, Product $product): ProductResource
    {
        return new ProductResource($this->products->updateWithRelations(
            $product,
            $request->productAttributes(),
            $request->validated('variants', []),
            $request->validated('addon_ids', []),
        ));
    }

    public function destroy(Product $product): Response
    {
        $this->products->delete($product);

        return response()->noContent();
    }

    public function adjustStock(Request $request, Product $product): ProductResource
    {
        $validated = $request->validate([
            'type' => ['required', 'in:add,remove,set'],
            'qty' => ['required', 'integer', 'min:0'],
        ]);

        return new ProductResource(
            $this->products->adjustStock($product, $validated['type'], (int) $validated['qty'])
                ->load(['category', 'variants', 'addons'])
        );
    }
}
