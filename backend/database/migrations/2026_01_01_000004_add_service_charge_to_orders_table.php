<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Service charge is billed alongside tax but is not tax: it is the shop's own
 * revenue, it is taxable itself, and it has to be reported separately. The rate
 * is stored per order so a later change in Settings cannot rewrite the past.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('service_charge_rate', 5, 2)->default(0)->after('coupon_code');
            $table->decimal('service_charge', 10, 2)->default(0)->after('service_charge_rate');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['service_charge_rate', 'service_charge']);
        });
    }
};
