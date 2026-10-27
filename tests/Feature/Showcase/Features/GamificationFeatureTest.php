<?php

use App\Models\User;
use LaravelFunLab\Facades\LFL;
use LaravelFunLab\Models\MetricLevel;
use LaravelFunLab\Models\Profile;
use LaravelFunLab\Services\MetricLevelService;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/gamification (Phase B, .ai/plans/features-microsites.md).
 *
 * The demo models laravel-fun-lab's rules in the browser (funlab.ts), because
 * the engine is PHP. These tests run the REAL engine over the same seed file
 * and assert the same parity fixture the vitest suite asserts the model
 * against: so if the package's rules move, or the model drifts, a test fails
 * rather than the page quietly showing numbers the package would not produce.
 */

const GAMIFICATION_DIR = 'resources/js/Pages/Features/Gamification';

function gamificationPage(string $html): array
{
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> */
function gamificationSources(): array
{
    $files = [];
    foreach (glob(base_path(GAMIFICATION_DIR.'/*')) as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

/** @return array<string, mixed> */
function gamificationSeed(): array
{
    return json_decode((string) file_get_contents(base_path(GAMIFICATION_DIR.'/funlab-seed.json')), true);
}

/**
 * Set the seed's metrics, levels and level-attached achievements up in the
 * real engine, then award each player's seed XP metric by metric.
 *
 * @return array<string, User> player id => user
 */
function seedFunLab(array $seed): array
{
    foreach ($seed['metrics'] as $metric) {
        LFL::setup(a: 'gamed-metric', with: ['slug' => $metric['slug'], 'name' => $metric['name']]);
        foreach ($seed['levels'] as $level) {
            LFL::setup(a: 'metric-level', with: ['metric' => $metric['slug'], 'level' => $level['level'], 'xp' => $level['xp'], 'name' => $level['name']]);
        }
    }

    foreach ($seed['achievements'] as $achievement) {
        $model = LFL::setup(a: 'achievement', with: [
            'slug' => $achievement['slug'],
            'name' => $achievement['name'],
            'description' => $achievement['description'],
            'icon' => $achievement['icon'],
        ]);
        MetricLevel::query()
            ->whereHas('gamedMetric', fn ($query) => $query->where('slug', $achievement['metric']))
            ->where('level', $achievement['level'])
            ->firstOrFail()
            ->achievements()
            ->attach($model->id);
    }

    $users = [];
    foreach ($seed['players'] as $player) {
        $users[$player['id']] = $user = User::factory()->create(['name' => $player['name']]);
        foreach ($seed['metrics'] as $metric) {
            $amount = $player['xp'][$metric['slug']] ?? 0;
            if ($amount > 0) {
                LFL::award($metric['slug'])->to($user)->amount($amount)->save();
            }
        }
    }

    return $users;
}

/** @return array{total: int, levels: array<string, int>, achievements: list<string>} */
function funLabSnapshot(User $user, array $seed): array
{
    $levels = [];
    foreach ($seed['metrics'] as $metric) {
        $levels[$metric['slug']] = app(MetricLevelService::class)->getCurrentLevel($user, $metric['slug']);
    }

    $achievements = array_values(array_filter(
        array_column($seed['achievements'], 'slug'),
        fn (string $slug): bool => $user->hasAchievement($slug),
    ));
    sort($achievements);

    return [
        'total' => (int) Profile::query()->where('awardable_type', User::class)->where('awardable_id', $user->id)->value('total_xp'),
        'levels' => $levels,
        'achievements' => $achievements,
    ];
}

it('renders the Gamification micro-site on laravel-fun-lab', function () {
    $page = gamificationPage($this->get('/features/gamification')->assertOk()->getContent());

    expect($page['component'])->toBe('Features/Gamification/Index')
        ->and($page['props']['feature']['slug'])->toBe('gamification')
        ->and(array_column($page['props']['feature']['members'], 'slug'))->toContain('laravel-fun-lab');
});

it('ships no Phase A placeholder', function () {
    foreach (gamificationSources() as $file => $source) {
        // toContain() is variadic, so a message argument would be read as a
        // second needle and the check would pass on the stub. Assert booleans.
        expect(str_contains($source, 'TODO'))->toBeFalse("{$file} still carries a TODO")
            ->and(str_contains($source, 'feature-todo'))->toBeFalse("{$file} still uses the placeholder block");
    }
});

it('builds the demo from react-fancy, with a text alternative on every meter', function () {
    $sources = gamificationSources();

    expect($sources['Index.tsx'])
        ->toContain('<DemoFrame', '<ArcadeDemo', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta', 'href: "/leaderboard"')
        ->and($sources['ArcadeDemo.tsx'])
        ->toContain('from "@particle-academy/react-fancy"', '<Progress', 'aria-valuetext={text}', 'aria-labelledby={labelId}', '<StatList', 'aria-live="polite"');
});

it('names nothing unbuilt as coming', function () {
    // Owner ruling: "more coming" is generic. A named future feature, or a
    // version promise, is the thing this guards against.
    $index = gamificationSources()['Index.tsx'];

    expect($index)->toContain('more is on the way')
        ->and($index)->not->toMatch('/coming soon:|roadmap|planned|in v\d/i');
});

it('produces the seeded profiles the demo shows, through the real engine', function () {
    $seed = gamificationSeed();
    $users = seedFunLab($seed);

    foreach ($seed['parity']['seeded'] as $player => $expected) {
        expect(funLabSnapshot($users[$player], $seed))->toBe($expected, "player {$player}");
    }
});

it('ranks the seeded players in the order the demo shows', function () {
    $seed = gamificationSeed();
    $users = seedFunLab($seed);
    $byUserId = array_flip(array_map(fn (User $user) => $user->id, $users));

    $order = LFL::leaderboard()->for(User::class)->by('xp')->take(10)
        ->map(fn (Profile $profile) => $byUserId[$profile->awardable_id])
        ->all();

    expect($order)->toBe($seed['parity']['leaderboardByXp']);
});

it('levels up and unlocks achievements exactly as the demo does after its scripted actions', function () {
    $seed = gamificationSeed();
    $users = seedFunLab($seed);
    $actions = array_column($seed['actions'], null, 'id');

    foreach ($seed['parity']['script'] as $id) {
        LFL::award($actions[$id]['metric'])->to($users[$seed['you']])->amount($actions[$id]['amount'])->save();
    }

    expect(funLabSnapshot($users[$seed['you']], $seed))->toBe($seed['parity']['afterScript']);
});

it('links its calls to action to pages that exist', function (string $url) {
    $this->get($url)->assertOk();
})->with(['/leaderboard', '/packages/laravel-fun-lab']);
