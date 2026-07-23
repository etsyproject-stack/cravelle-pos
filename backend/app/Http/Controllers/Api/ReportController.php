<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function __construct(private readonly ReportService $reports)
    {
    }

    public function daily(Request $request): JsonResponse
    {
        $date = $request->query('date')
            ? Carbon::parse($request->query('date'))
            : today();

        return response()->json(['data' => $this->reports->daily($date)]);
    }

    public function monthly(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->monthly($this->month($request))]);
    }

    public function products(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->products($this->month($request))]);
    }

    public function profit(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->reports->profit($this->month($request))]);
    }

    private function month(Request $request): Carbon
    {
        return $request->query('month')
            ? Carbon::parse($request->query('month').'-01')
            : now();
    }
}
