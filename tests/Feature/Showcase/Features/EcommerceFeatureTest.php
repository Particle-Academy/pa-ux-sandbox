<?php

use FancyMlm\Contracts\MemberRepository;
use FancyMlm\Contracts\RewardSink;
use FancyMlm\Member;
use FancyMlm\Plan\CompensationPlan;
use FancyMlm\Referral\ReferralEngine;
use FancyMlm\Referral\RewardComputation;
use Tests\TestCase;

uses(TestCase::class);

/*
 * /features/ecommerce (Phase B, .ai/plans/features-microsites.md).
 *
 * The page is client-rendered, so these pin three things: the Inertia page and
 * props the micro-site is built on, that its source ships no Phase A
 * placeholder and uses the real packages (fancy-catalog + fancy-features in
 * the storefront, fancy-mlm-ui for referrals), and that every seeded reward the
 * referral demo shows is exactly what fancy-mlm's ReferralEngine computes.
 */

const ECOMMERCE_DIR = 'resources/js/Pages/Features/Ecommerce';

/** The Inertia page object an initial (HTML) visit carries. */
function ecommercePage(string $html): array
{
    preg_match('#<script data-page="app" type="application/json">(.*?)</script>#s', $html, $page);

    return json_decode($page[1] ?? '{}', true) ?? [];
}

/** @return array<string, string> path => contents, for every file in the micro-site's folder */
function ecommerceSources(): array
{
    $files = [];
    foreach (glob(base_path(ECOMMERCE_DIR.'/*')) as $path) {
        $files[basename($path)] = (string) file_get_contents($path);
    }

    return $files;
}

it('renders the Ecommerce micro-site with its members and bridges', function () {
    $page = ecommercePage($this->get('/features/ecommerce')->assertOk()->getContent());

    expect($page['component'])->toBe('Features/Ecommerce/Index')
        ->and($page['props']['feature']['slug'])->toBe('ecommerce')
        ->and(array_column($page['props']['feature']['members'], 'slug'))
        ->toContain('laravel-catalog', 'fancy-catalog-js', 'laravel-fms', 'fancy-features-js', 'fancy-mlm-ui')
        ->and(array_column($page['props']['feature']['bridges'], 'name'))
        ->toBe(['registerCatalogBridge', 'registerFeaturesBridge']);
});

it('ships no Phase A placeholder', function () {
    foreach (ecommerceSources() as $file => $source) {
        // toContain() is variadic, so a message argument would be read as a
        // second needle and the check would pass on the stub. Assert booleans.
        expect(str_contains($source, 'TODO'))->toBeFalse("{$file} still carries a TODO")
            ->and(str_contains($source, 'feature-todo'))->toBeFalse("{$file} still uses the placeholder block");
    }
});

it('builds the demos from the shared kit and the real packages', function () {
    $sources = ecommerceSources();

    expect($sources['Index.tsx'])
        ->toContain('<DemoFrame', '<StorefrontDemo', '<ReferralDemo', '<FeatureTour', '<HowItFits', '<InstallSteps', '<PackagesGrid', '<FeatureCta')
        ->and($sources['storefront.ts'])
        ->toContain('from "@particle-academy/fancy-catalog"', 'from "@particle-academy/fancy-catalog/features"', 'from "@particle-academy/fancy-features"', 'refusingStripe')
        ->and($sources['ReferralDemo.tsx'])
        ->toContain('from "@particle-academy/fancy-mlm-ui"', '<DownlineTree', '<CommissionStatement', '<RankProgress');

    // Every package the browser demo imports is one the showcase installs.
    $installed = json_decode((string) file_get_contents(base_path('package.json')), true)['dependencies'];
    expect($installed)->toHaveKeys(['@particle-academy/fancy-catalog', '@particle-academy/fancy-features', '@particle-academy/fancy-mlm-ui']);
});

it('makes no checkout claim the demo cannot back', function () {
    $sources = implode("\n", ecommerceSources());

    // The demo never sells anything: no checkout call, no "buy" button.
    expect($sources)->not->toMatch('/subscriptionCheckout\(|oneTimeCheckout\(|getSubscriptionCheckoutUrl\(/')
        ->and($sources)->not->toMatch('/>\s*(Buy|Checkout|Pay)\b/i');
});

it('shows exactly the rewards fancy-mlm computes for the seeded network', function () {
    $seed = json_decode((string) file_get_contents(base_path(ECOMMERCE_DIR.'/referrals.json')), true);

    $members = [];
    foreach ($seed['members'] as $row) {
        $members[$row['id']] = new Member(
            id: $row['id'],
            sponsorId: $row['sponsorId'] ?? null,
            tier: $row['tier'],
            active: $row['active'] ?? true,
            placementId: $row['placementId'] ?? null,
        );
    }

    $repository = new class($members) implements MemberRepository
    {
        /** @param array<string, Member> $members */
        public function __construct(private array $members) {}

        public function find(string $id): ?Member
        {
            return $this->members[$id] ?? null;
        }
    };
    $sink = new class implements RewardSink
    {
        public function pay(RewardComputation $reward): void {}
    };

    $engine = new ReferralEngine(CompensationPlan::fromArray($seed['plan']), $repository, $sink);

    expect($seed['orders'])->toHaveCount(5);
    foreach ($seed['orders'] as $order) {
        $computed = array_map(fn (RewardComputation $reward): array => [
            'recipient' => $reward->recipientMemberId,
            'level' => $reward->level,
            'tier' => $reward->tier,
            'amount' => $reward->amount,
        ], $engine->distribute($order['memberId'], (float) $order['points']));

        $shown = array_map(fn (array $reward): array => [...$reward, 'amount' => (float) $reward['amount']], $order['rewards']);

        expect($computed)->toBe($shown, "order {$order['id']} shows rewards the engine does not compute");
    }
});

it('links its calls to action to pages that exist', function (string $url) {
    $this->get($url)->assertOk();
})->with(['/packages/laravel-catalog', '/packages/fancy-mlm-ui/downline-tree']);
