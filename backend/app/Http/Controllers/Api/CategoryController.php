<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryRepositoryInterface $categories)
    {
    }

    public function index(): JsonResponse
    {
        return response()->json(['data' => $this->categories->allWithCounts()]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = $this->categories->create($request->validated());

        return response()->json(['data' => $category], Response::HTTP_CREATED);
    }

    public function update(StoreCategoryRequest $request, Category $category): JsonResponse
    {
        return response()->json(['data' => $this->categories->update($category, $request->validated())]);
    }

    public function destroy(Category $category): Response
    {
        $this->categories->delete($category);

        return response()->noContent();
    }
}
