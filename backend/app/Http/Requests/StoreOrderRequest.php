<?php

namespace App\Http\Requests;

use App\Enums\DiscountType;
use App\Enums\OrderType;
use App\Enums\PaymentMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'order_type' => ['required', Rule::in(OrderType::values())],
            'notes' => ['nullable', 'string', 'max:1000'],
            'discount_type' => ['nullable', Rule::in(DiscountType::values())],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'coupon_code' => ['nullable', 'string', 'max:32'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:999'],
            'items.*.notes' => ['nullable', 'string', 'max:255'],
            'items.*.addon_ids' => ['array'],
            'items.*.addon_ids.*' => ['integer'],
            'payments' => ['array'],
            'payments.*.method' => ['required_with:payments', Rule::in(PaymentMethod::values())],
            'payments.*.amount' => ['required_with:payments', 'numeric', 'min:0'],
            'payments.*.tendered' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
