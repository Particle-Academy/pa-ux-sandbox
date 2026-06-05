<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Showcase upkeep.
Artisan::command('showcase:auto-archive', function () {
    $archived = \App\Support\DreamRegistry::autoArchive();
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
