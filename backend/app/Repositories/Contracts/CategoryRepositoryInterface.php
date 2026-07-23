<?php

namespace App\Repositories\Contracts;

use Illuminate\Database\Eloquent\Collection;

interface CategoryRepositoryInterface extends BaseRepositoryInterface
{
    /** Ordered categories with product counts for the management screen. */
    public function allWithCounts(): Collection;
}
