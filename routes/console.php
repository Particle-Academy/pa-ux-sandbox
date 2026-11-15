<?php

use App\Support\DreamRegistry;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Showcase upkeep.
Artisan::command('showcase:auto-archive', function () {
    $archived = DreamRegistry::autoArchive();
    $this->info('Archived '.count($archived).' dreams: '.implode(', ', $archived));
})->purpose('Auto-archive dreams whose net votes have gone negative.');

Schedule::command('showcase:refresh-leaderboard --scope=all_time')->dailyAt('03:00');
Schedule::command('showcase:refresh-leaderboard --scope=last_30_days')->dailyAt('03:15');
Schedule::command('showcase:auto-archive')->hourly();

// Fancy Heuristics: twice-daily server-side re-poll of every registered site's
// pixel (liveness for the Analytics Suite). The public showcase listing is gated
// by ScanShowcaseSubmission's own per-kind verification, so this updates the
// HeuristicsSite flags without touching the listing.
Schedule::command('heuristics:verify-pixels')->twiceDailyAt(4, 16, 30);

// Public download counts (npm, Packagist, PyPI) for /packages, each package
// page and the home page. A failed fetch keeps the last known counts.
Schedule::command('packages:fetch-downloads')
    ->dailyAt((string) config('package-downloads.schedule_at', '04:30'))
    ->withoutOverlapping();
