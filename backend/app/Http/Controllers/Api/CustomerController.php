<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Repositories\Contracts\CustomerRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerRepositoryInterface $customers)
    {
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        return CustomerResource::collection($this->customers->search($request->query('search')));
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->customers->create($request->validated());

        return (new CustomerResource($customer))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(StoreCustomerRequest $request, Customer $customer): CustomerResource
    {
        abort_if($customer->is_walk_in, Response::HTTP_UNPROCESSABLE_ENTITY, 'The walk-in customer cannot be edited.');

        return new CustomerResource($this->customers->update($customer, $request->validated()));
    }

    public function destroy(Customer $customer): Response
    {
        abort_if($customer->is_walk_in, Response::HTTP_UNPROCESSABLE_ENTITY, 'The walk-in customer cannot be deleted.');

        $this->customers->delete($customer);

        return response()->noContent();
    }

    public function loyalty(Customer $customer): JsonResponse
    {
        return response()->json([
            'data' => $customer->loyaltyTransactions()
                ->with('order:id,order_number,total')
                ->latest()
                ->get(),
        ]);
    }
}
