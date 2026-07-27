<?php

use App\Http\Controllers\Api\AddonController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HoldOrderController;
use App\Http\Controllers\Api\KitchenController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Cheap reachability probe the POS polls to tell online from offline.
    Route::get('/ping', fn () => response()->json(['ok' => true]));

    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Front of house: admin, manager, cashier
        Route::middleware('role:admin,manager,cashier')->group(function () {
            Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

            Route::get('/categories', [CategoryController::class, 'index']);
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/products/{product}', [ProductController::class, 'show']);
            Route::get('/addons', [AddonController::class, 'index']);

            // Everything the till needs to keep selling while offline.
            Route::get('/bootstrap', [BootstrapController::class, 'index']);

            Route::get('/orders', [OrderController::class, 'index']);
            Route::post('/orders', [OrderController::class, 'store']);
            Route::post('/orders/sync', [OrderController::class, 'sync']);
            Route::get('/orders/{order}', [OrderController::class, 'show']);
            Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
            Route::post('/orders/{order}/payments', [OrderController::class, 'addPayment']);
            Route::get('/orders/{order}/kot', [OrderController::class, 'kot']);

            Route::get('/hold-orders', [HoldOrderController::class, 'index']);
            Route::post('/hold-orders', [HoldOrderController::class, 'store']);
            Route::delete('/hold-orders/{holdOrder}', [HoldOrderController::class, 'destroy']);

            Route::get('/customers', [CustomerController::class, 'index']);
            Route::post('/customers', [CustomerController::class, 'store']);
            Route::put('/customers/{customer}', [CustomerController::class, 'update']);
            Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
            Route::get('/customers/{customer}/loyalty', [CustomerController::class, 'loyalty']);

            Route::get('/coupons', [CouponController::class, 'index']);
            Route::post('/coupons/validate', [CouponController::class, 'validateCode']);

            Route::get('/settings', [SettingController::class, 'index']);
        });

        // Kitchen Display System: kitchen staff plus management
        Route::middleware('role:admin,manager,kitchen')->group(function () {
            Route::get('/kitchen/orders', [KitchenController::class, 'index']);
            Route::patch('/kitchen/orders/{order}/advance', [KitchenController::class, 'advance']);
        });

        // Management only: admin, manager
        Route::middleware('role:admin,manager')->group(function () {
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::put('/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

            Route::post('/products', [ProductController::class, 'store']);
            Route::put('/products/{product}', [ProductController::class, 'update']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);
            Route::post('/products/{product}/stock', [ProductController::class, 'adjustStock']);

            Route::post('/addons', [AddonController::class, 'store']);
            Route::put('/addons/{addon}', [AddonController::class, 'update']);
            Route::delete('/addons/{addon}', [AddonController::class, 'destroy']);

            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);

            Route::get('/reports/daily', [ReportController::class, 'daily']);
            Route::get('/reports/monthly', [ReportController::class, 'monthly']);
            Route::get('/reports/products', [ReportController::class, 'products']);
            Route::get('/reports/profit', [ReportController::class, 'profit']);

            Route::apiResource('/expenses', ExpenseController::class)->except(['show']);

            Route::post('/coupons', [CouponController::class, 'store']);
            Route::put('/coupons/{coupon}', [CouponController::class, 'update']);
            Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy']);

            Route::put('/settings', [SettingController::class, 'update']);
        });
    });
});
