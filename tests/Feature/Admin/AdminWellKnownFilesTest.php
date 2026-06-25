<?php

use App\Models\Setting;
use App\Models\User;
use App\Support\WellKnownFilesModel;
use ParticleAcademy\XFiles\Registry;
use ParticleAcademy\XFiles\Robots\RobotsPolicy;
use Tests\TestCase;

uses(TestCase::class);

function wkfAdmin(): User
{
    return User::factory()->create(['is_admin' => true]);
}

it('renders the editor with the current model for an admin', function () {
    $this->actingAs(wkfAdmin())
        ->get('/admin/well-known-files')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/WellKnownFiles')
            ->has('model.robots.groups')
            ->has('protectedPaths')
            ->where('isCustomized', false));
});

it('is gated to admins', function () {
    $this->actingAs(User::factory()->create(['is_admin' => false]))
        ->get('/admin/well-known-files')
        ->assertForbidden();
});

it('saves a model and the served robots.txt reflects the edit', function () {
    $model = WellKnownFilesModel::default();
    $model['robots']['groups'][] = ['userAgents' => ['MyCoolBot'], 'allow' => ['/'], 'disallow' => []];

    $this->actingAs(wkfAdmin())
        ->post('/admin/well-known-files', ['model' => json_encode($model)])
        ->assertRedirect();

    expect(Setting::get(WellKnownFilesModel::SETTING_KEY))->not->toBeNull();
    // Prod re-boots per request (fresh Registry); drop the boot-time singleton so
    // the served file re-renders from the just-saved model.
    $this->app->forgetInstance(Registry::class);
    $this->get('/robots.txt')->assertOk()->assertSee('User-agent: MyCoolBot', false);
});

it('keeps the configured private paths Disallowed even if a saved model omits them', function () {
    // A wide-open model with NO protected paths — the server-side rail must still win.
    Setting::put(WellKnownFilesModel::SETTING_KEY, json_encode([
        'robots' => ['groups' => [['userAgents' => ['*'], 'allow' => ['/']]], 'sitemaps' => [], 'protectedPaths' => []],
    ]));
    $this->app->forgetInstance(Registry::class);

    $body = (string) $this->get('/robots.txt')->assertOk()->getContent();
    $policy = RobotsPolicy::parse($body);

    expect($policy->allowed('/admin/sites', '*'))->toBeFalse()
        ->and($policy->allowed('/admin/sites', 'GPTBot'))->toBeFalse();
});

it('resets to the config default, dropping the override', function () {
    Setting::put(WellKnownFilesModel::SETTING_KEY, json_encode(['robots' => ['groups' => []]]));

    $this->actingAs(wkfAdmin())
        ->post('/admin/well-known-files/reset')
        ->assertRedirect();

    expect(Setting::get(WellKnownFilesModel::SETTING_KEY))->toBeNull();
});

it('passes the live auto-discovered sitemap URLs to the editor', function () {
    $this->actingAs(wkfAdmin())
        ->get('/admin/well-known-files')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/WellKnownFiles')
            ->has('sitemapUrls.0.loc')
            ->has('sitemapUrls.0.path')
            ->has('sitemapUrls.0.priority')
            ->has('sitemapUrls.0.changefreq'));
});

it('applies admin sitemap controls (exclude + extra) to the served sitemap.xml', function () {
    Setting::put(WellKnownFilesModel::SETTING_KEY, json_encode(array_merge(
        WellKnownFilesModel::default(),
        ['sitemapControls' => [
            'exclude' => ['/leaderboard'],
            'extra' => [['loc' => 'https://example.test/grab-bag', 'priority' => '0.9', 'changefreq' => 'daily']],
        ]],
    )));
    // Drop the boot-time Registry singleton so the served file re-renders.
    $this->app->forgetInstance(Registry::class);

    $body = (string) $this->get('/sitemap.xml')->assertOk()->getContent();

    expect($body)
        ->toContain('<loc>'.rtrim((string) config('app.url'), '/').'/</loc>') // still dynamic
        ->not->toContain('/leaderboard</loc>')                                // excluded
        ->toContain('https://example.test/grab-bag');                         // extra added
});
