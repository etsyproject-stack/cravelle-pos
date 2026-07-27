<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Client-generated id for offline orders. Unique, so replaying a
            // queued order after a flaky sync can never bill the customer twice.
            $table->uuid('client_uuid')->nullable()->unique()->after('order_number');
            $table->boolean('placed_offline')->default(false)->after('client_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['client_uuid', 'placed_offline']);
        });
    }
};
