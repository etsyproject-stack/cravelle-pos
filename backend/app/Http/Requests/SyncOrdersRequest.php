<?php

namespace App\Http\Requests;

use App\Enums\DiscountType;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SyncOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'orders' => ['required', 'array', 'min:1', 'max:200'],
            'orders.*.client_uuid' => ['required', 'uuid'],
            'orders.*.placed_at' => ['required', 'date'],
            'orders.*.customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'orders.*.order_type' => ['required', Rule::in(OrderType::values())],
            'orders.*.notes' => ['nullable', 'string', 'max:1000'],
            'orders.*.discount_type' => ['nullable', Rule::in(DiscountType::values())],
            'orders.*.discount_value' => ['nullable', 'numeric', 'min:0'],
            'orders.*.coupon_code' => ['nullable', 'string', 'max:32'],
            'orders.*.items' => ['required', 'array', 'min:1'],
            'orders.*.items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'orders.*.items.*.variant_id' => ['nullable', 'integer'],
            'orders.*.items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
            'orders.*.items.*.notes' => ['nullable', 'string', 'max:255'],
            'orders.*.items.*.addon_ids' => ['array'],
            'orders.*.items.*.addon_ids.*' => ['integer'],
            'orders.*.payments' => ['array'],
            'orders.*.payments.*.method' => ['required_with:orders.*.payments', Rule::in(PaymentMethod::values())],
            'orders.*.payments.*.amount' => ['required_with:orders.*.payments', 'numeric', 'min:0'],
            'orders.*.payments.*.tendered' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
