<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface extends BaseRepositoryInterface
{
    /**
     * Ordered categories with product counts.
     *
     * The management screen wants everything so a retired category can be
     * brought back; the till wants only what it can sell today.
     */
    public function allWithCounts(bool $activeOnly = false): Collection;
}
