<?php

namespace App\Http\Controllers\Showcase;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\View\View;

class LeaderboardController extends Controller
{
    public function __invoke(): View
    {
        return view('showcase.leaderboard');
    }
}
