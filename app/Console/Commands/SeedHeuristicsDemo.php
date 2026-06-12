<?php

namespace App\Console\Commands;

use App\Http\Controllers\AnalyticsController;
use FancyHeuristics\Facades\Heuristics;
use FancyHeuristics\Models\HeuristicsEvent;
use FancyHeuristics\Models\HeuristicsSession;
use FancyHeuristics\Models\HeuristicsSite;
use Illuminate\Console\Command;

/**
 * Seed a representative demo event+session stream for the showcase's OWN site
 * so the GA-parity dashboard's acquisition / audience / agent sections have
 * varied, real-shaped data to render.
 *
 * Strictly scoped to AnalyticsController::DEFAULT_SITE — we never fabricate data
 * for a real external consumer's site_key. Each session is pushed through the
 * live Heuristics::collect() path with a wire context + User-Agent, so the
 * package's own SessionRollup derives the referrer / utm / device / os / browser
 * columns exactly as a production collect would. Re-runnable: `--fresh` clears
 * the demo site's events + sessions first.
 */
class SeedHeuristicsDemo extends Command
{
    protected $signature = 'heuristics:seed-demo
                            {--fresh : Wipe the demo site’s events + sessions before seeding}
                            {--sessions=120 : Roughly how many demo sessions to generate}';

    protected $description = 'Seed representative demo heuristics data for the showcase’s own dogfood site only.';

    /** The only site this command is ever allowed to write to. */
    private const SITE = AnalyticsController::DEFAULT_SITE;

    /** @var list<array{ua: string, weight: int}> Real-shaped UA strings, weighted by prevalence. */
    private const USER_AGENTS = [
        ['ua' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'weight' => 30],
        ['ua' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', 'weight' => 18],
        ['ua' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'weight' => 12],
        ['ua' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'weight' => 15],
        ['ua' => 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36', 'weight' => 10],
        ['ua' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 Edg/124.0', 'weight' => 8],
        ['ua' => 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0', 'weight' => 5],
        ['ua' => 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'weight' => 4],
    ];

    /** @var list<array{referrer: string|null, utm: array<string, string>}> Acquisition channels. */
    private const CHANNELS = [
        ['referrer' => null, 'utm' => []], // direct
        ['referrer' => null, 'utm' => []],
        ['referrer' => 'https://www.google.com/', 'utm' => []],
        ['referrer' => 'https://news.ycombinator.com/', 'utm' => []],
        ['referrer' => 'https://github.com/', 'utm' => []],
        ['referrer' => 'https://x.com/', 'utm' => ['source' => 'twitter', 'medium' => 'social', 'campaign' => 'launch']],
        ['referrer' => 'https://www.reddit.com/', 'utm' => ['source' => 'reddit', 'medium' => 'social', 'campaign' => 'launch']],
        ['referrer' => null, 'utm' => ['source' => 'newsletter', 'medium' => 'email', 'campaign' => 'june-digest']],
        ['referrer' => null, 'utm' => ['source' => 'producthunt', 'medium' => 'referral', 'campaign' => 'launch']],
    ];

    /** @var list<string> Paths a session can land on / traverse. */
    private const PATHS = ['/', '/packages', '/components', '/pricing', '/docs', '/analytics', '/starter-kits', '/showcase'];

    /** @var list<array{id: string, label: string}> Clickable elements. */
    private const ELEMENTS = [
        ['id' => 'nav-packages', 'label' => 'Packages'],
        ['id' => 'cta-go-pro', 'label' => 'Go Pro'],
        ['id' => 'install-copy', 'label' => 'Copy install command'],
        ['id' => 'demo-run', 'label' => 'Run demo'],
        ['id' => 'docs-link', 'label' => 'Read the docs'],
        ['id' => 'starter-download', 'label' => 'Download kit'],
    ];

    public function handle(): int
    {
        if ($this->option('fresh')) {
            HeuristicsEvent::query()->where('site_key', self::SITE)->delete();
            HeuristicsSession::query()->where('site_key', self::SITE)->delete();
            $this->info('Cleared existing demo data for '.self::SITE.'.');
        }

        HeuristicsSite::firstOrCreate(
            ['site_key' => self::SITE],
            ['url' => config('app.url'), 'visible' => true],
        );

        $target = max(10, (int) $this->option('sessions'));
        $bar = $this->output->createProgressBar($target);
        $bar->start();

        for ($i = 0; $i < $target; $i++) {
            $this->seedSession($i);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info("Seeded ~{$target} demo sessions for ".self::SITE.'.');

        return self::SUCCESS;
    }

    /**
     * Build one realistic session: an acquisition channel, a device (via UA),
     * an actor (mostly human, ~22% agent), and a short path traversal with a
     * few clicks + a dwell — spread across the last 28 days.
     */
    private function seedSession(int $seed): void
    {
        $ua = $this->weightedUa();
        $channel = self::CHANNELS[array_rand(self::CHANNELS)];
        $isAgent = random_int(1, 100) <= 22;
        $actor = $isAgent ? 'agent' : 'human';

        // When did this session start? Spread over the last 28 days, biased
        // toward recent days so the timeseries trends upward a little.
        $daysAgo = (int) floor(abs(28 - sqrt(random_int(0, 784))));
        $start = now()->subDays(min(27, $daysAgo))
            ->setTime(random_int(7, 22), random_int(0, 59), random_int(0, 59));

        // 1–4 pages this session.
        $pageCount = random_int(1, 4);
        $landing = self::PATHS[array_rand(self::PATHS)];

        $events = [];
        $clock = $start->copy();
        $path = $landing;

        for ($p = 0; $p < $pageCount; $p++) {
            $events[] = [
                'kind' => 'pageview',
                'actor' => $actor,
                'path' => $path,
                'ts' => $clock->valueOf(),
            ];

            // A click or two (humans click more than agents).
            $clicks = $isAgent ? random_int(0, 1) : random_int(0, 3);
            for ($c = 0; $c < $clicks; $c++) {
                $clock->addSeconds(random_int(2, 25));
                $el = self::ELEMENTS[array_rand(self::ELEMENTS)];
                $events[] = [
                    'kind' => 'click',
                    'actor' => $actor,
                    'path' => $path,
                    'x' => random_int(40, 1240),
                    'y' => random_int(60, 760),
                    'vw' => 1280,
                    'vh' => 800,
                    'targetId' => $el['id'],
                    'label' => $el['label'],
                    'ts' => $clock->valueOf(),
                ];
            }

            // A dwell so engagement-time has something to average.
            $clock->addSeconds(random_int(5, 90));
            $events[] = [
                'kind' => 'dwell',
                'actor' => $actor,
                'path' => $path,
                'dwellMs' => random_int(3000, 90000),
                'ts' => $clock->valueOf(),
            ];

            // Next page.
            $path = self::PATHS[array_rand(self::PATHS)];
            $clock->addSeconds(random_int(3, 40));
        }

        $context = [
            'referrer' => $channel['referrer'],
            'utm' => $channel['utm'],
            'lang' => ['en-US', 'en-GB', 'fr-FR', 'de-DE', 'es-ES'][array_rand([0, 1, 2, 3, 4])],
            'tz' => 'UTC',
            'screenW' => 1280,
            'screenH' => 800,
        ];

        Heuristics::collect([
            'siteKey' => self::SITE,
            'sessionId' => 'demo-'.$seed.'-'.substr(md5((string) $seed.$start->toIso8601String()), 0, 8),
            'context' => $context,
            'events' => $events,
        ], $ua);
    }

    /**
     * Pick a User-Agent weighted by its declared prevalence.
     */
    private function weightedUa(): string
    {
        $total = array_sum(array_column(self::USER_AGENTS, 'weight'));
        $roll = random_int(1, $total);
        $acc = 0;
        foreach (self::USER_AGENTS as $entry) {
            $acc += $entry['weight'];
            if ($roll <= $acc) {
                return $entry['ua'];
            }
        }

        return self::USER_AGENTS[0]['ua'];
    }
}
