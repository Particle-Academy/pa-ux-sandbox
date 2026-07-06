<?php

use App\Http\Controllers\ActiveUsersController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFeaturesController;
use App\Http\Controllers\Admin\AdminGamificationController;
use App\Http\Controllers\Admin\AdminHeuristicsController;
use App\Http\Controllers\Admin\AdminMlmController;
use App\Http\Controllers\Admin\AdminPlansController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Admin\AdminSettingsController;
use App\Http\Controllers\Admin\AdminShopController;
use App\Http\Controllers\Admin\AdminSitesController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\Admin\AdminWellKnownFilesController;
use App\Http\Controllers\AgentRelayController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\XpController;
use App\Http\Controllers\Auth\GitHubLoginController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DarkSlideExportController;
use App\Http\Controllers\DevLoginController;
use App\Http\Controllers\EasterEggController;
use App\Http\Controllers\HolySheetExportController;
use App\Http\Controllers\OgImageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ServiceWorkerController;
use App\Http\Controllers\Showcase\DocsController;
use App\Http\Controllers\Showcase\DreamingController;
use App\Http\Controllers\Showcase\FancifiedBadgeController;
use App\Http\Controllers\Showcase\GalleryController;
use App\Http\Controllers\Showcase\HomeController;
use App\Http\Controllers\Showcase\InspirationController;
use App\Http\Controllers\Showcase\LeaderboardController;
use App\Http\Controllers\Showcase\PackagesController;
use App\Http\Controllers\Showcase\ProfileController;
use App\Http\Controllers\Showcase\ReferralController;
use App\Http\Controllers\Showcase\RegistryController;
use App\Http\Controllers\Showcase\ShopController;
use App\Http\Controllers\Showcase\ShowcaseSubmissionController;
use App\Http\Controllers\Showcase\StarterKitController;
use App\Http\Controllers\Showcase\StarterKitDownloadController;
use App\Http\Controllers\Showcase\VoteController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\Webhooks\GitHubWebhookController;
use App\Http\Controllers\WhiteboardAgentController;
use App\Http\Middleware\TrackPackageBrowsing;
use App\Mcp\Servers\FancyUiRegistry;
use App\Models\ShowcaseSubmission;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Mcp\Facades\Mcp;

// SEO / discovery + well-known endpoints (robots.txt, sitemap.xml, llms.txt,
// llms-full.txt, .well-known/security.txt, humans.txt) are auto-registered by
// particle-academy/fancy-seo; their content comes from config/fancy-seo.php +
// App\Providers\SeoServiceProvider (sitemap + llms providers).

// Dynamic Open Graph / social-card images (branded 1200×630 PNGs, headless-Chrome
// rendered + cached). Referenced by the per-route og:image in SeoServiceProvider.
Route::get('/og/default.png', [OgImageController::class, 'default'])->name('og.default');
Route::get('/og/packages/{package}.png', [OgImageController::class, 'package'])
    ->where('package', '[a-z0-9\-]+')
    ->name('og.package');

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    // Local-only one-click dev login. The route is not even registered in
    // production, and DevLoginController aborts unless the server is `local`
    // (see App\Support\DevAccounts::enabled()). Belt and suspenders — neither
    // gate is reachable from the frontend.
    if (! app()->isProduction()) {
        Route::post('/dev-login', DevLoginController::class)->name('dev-login');
    }
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    // XP analytics endpoints — JS demos + bridge hosts post here to credit
    // the signed-in user. Throttled inside XpAwarder so reload-farm and
    // agentic loops can't inflate scores.
    Route::post('/api/xp/demo', [XpController::class, 'demo'])
        ->middleware('throttle:60,1')
        ->name('xp.demo');
    Route::post('/api/xp/bridge', [XpController::class, 'bridge'])
        ->middleware('throttle:120,1')
        ->name('xp.bridge');

    // Player profile + gamification opt-out.
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::post('/profile/opt-out', [ProfileController::class, 'toggleOptOut'])->name('profile.opt-out');

    // Refer-a-friend — the gamified downline surface (fancy-mlm + fancy-mlm-ui).
    Route::get('/referrals', [ReferralController::class, 'show'])->name('referrals');
    // Admin-only demo tooling: simulating a downline action mints REAL fun-lab
    // points to uplines, so regular users must never reach it (403).
    Route::post('/referrals/simulate', [ReferralController::class, 'simulate'])
        ->middleware(['can:admin', 'throttle:30,1'])
        ->name('referrals.simulate');
    // Username settings power the /join/{username} referral link.
    Route::post('/profile/username', [ProfileController::class, 'updateUsername'])
        ->name('profile.username');

    // Pro Analytics Suite — Pro-gated dashboard over the live Fancy Heuristics
    // feed. Auth required; the controller's FMS `analytics-suite` check splits
    // Pro users (real dashboard) from everyone else (upsell panel).
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Hidden Easter-egg story endings → unlock the secret achievements.
    Route::post('/api/easter-eggs/ending', [EasterEggController::class, 'ending'])
        ->middleware('throttle:60,1')
        ->name('easter-egg.ending');
});

// Public referral entry — a member's shareable /join/{username} link. Stores a
// 30-day attribution cookie and redirects home; the sponsor attaches when the
// referred visitor's member row is first created (MlmProgram::memberForUser).
// Unknown usernames redirect home silently (no user enumeration).
Route::get('/join/{username}', [ReferralController::class, 'join'])
    ->where('username', '[A-Za-z0-9\-]+')
    ->name('referrals.join');

// xlsx export endpoint for the fancy-sheets demo. The controller is owned
// by the sandbox app — Holy Sheet ships only the writer + facade. Apps
// build their own routes (see app/Http/Controllers/HolySheetExportController).
Route::post('/holy-sheet/export', HolySheetExportController::class)
    ->withoutMiddleware([PreventRequestForgery::class])
    ->name('holy-sheet.export');

// pptx export endpoint for the fancy-slides demo. Same shape as
// holy-sheet/export — sandbox owns the controller; dark-slide ships
// only the writer + facade.
Route::post('/dark-slide/export', DarkSlideExportController::class)
    ->withoutMiddleware([PreventRequestForgery::class])
    ->name('dark-slide.export');

// GitHub issues webhook → bug-hunter-xp. HMAC-verified in the controller;
// CSRF-exempt (see bootstrap/app.php). No auth — GitHub posts server-to-server.
Route::post('/webhooks/github', GitHubWebhookController::class)
    ->name('webhooks.github');

// ─── Live "active users" feed ──────────────────────────────────────────
// REST seed the frontend hydrates with before subscribing to the public
// `active-users` Echo channel.
Route::get('/active-users', [ActiveUsersController::class, 'index'])->name('active-users.index');

// ─── Service-worker tombstone ──────────────────────────────────────────
// The site-wide PWA was removed (the SW served its offline page to online users
// and risked intercepting dynamic / SSR content). /sw.js now ALWAYS serves a
// self-unregistering tombstone so any SW from a prior deploy tears itself down
// on its next update check. Invokable controller — NOT a closure — so
// route:cache stays intact. The contained PWA demo lives at /packages/fancy-pwa.
Route::get('/sw.js', ServiceWorkerController::class)->name('sw');

// ─── Fancy UI Showcase ─────────────────────────────────────────────────
Route::get('/', HomeController::class)->name('home');

// CMS demo: the WHOLE Home page rendered from a seeded fancy-cms document
// (read-only, inline EditMode). Fed the same payload as the live Home route so
// it re-authors the exact same page. The sandbox IS the CMS demo — see
// resources/js/cms/.
Route::get('/cms/home', fn (HomeController $home) => Inertia::render('CmsHome', $home->props()))->name('cms.home');

Route::middleware(TrackPackageBrowsing::class)->group(function () {
    Route::get('/packages', [PackagesController::class, 'index'])->name('packages.index');
    Route::get('/packages/{package}', [PackagesController::class, 'show'])->name('packages.show');
    Route::get('/packages/{package}/{component}', [PackagesController::class, 'component'])->name('packages.component');
});

Route::get('/starter-kits', [StarterKitController::class, 'index'])->name('starter-kits.index');
Route::get('/starter-kits/{slug}', [StarterKitController::class, 'show'])->name('starter-kits.show');
Route::get('/starter-kits/{slug}/download.zip', StarterKitDownloadController::class)
    ->where('slug', '[a-z0-9\-]+')
    ->name('starter-kits.download');

// ─── Inspiration Gallery ───────────────────────────────────────────────
// One fictional studio portfolio ("FIELDWORK") designed 20 ways, common →
// experimental. The index catalogs every style; each style gets its own
// bespoke page (placeholder until that style component ships).
Route::get('/inspiration', [InspirationController::class, 'index'])->name('inspiration.index');
Route::get('/inspiration/{style}', [InspirationController::class, 'show'])
    ->where('style', '[a-z0-9\-]+')
    ->name('inspiration.show');

// Inspiration Gallery "grab" blueprints — agent-readable design recipes (read-only
// inspiration to re-implement + mix-and-match, NOT vendored source). Parallels /r/.
// /gallery/index.json — the 20 styles' metadata + blueprint URLs.
// /gallery/{style}.json — one style's full grab-blueprint.
Route::get('/gallery/index.json', [GalleryController::class, 'index'])->name('gallery.index');
Route::get('/gallery/{style}', [GalleryController::class, 'show'])
    ->where('style', '[a-z0-9\-\.]+')
    ->name('gallery.show');

Route::get('/dreaming', [DreamingController::class, 'index'])->name('dreaming.index');
Route::get('/dreaming/archived', [DreamingController::class, 'archived'])->name('dreaming.archived');

Route::get('/leaderboard', LeaderboardController::class)->name('leaderboard');
// JSON feed the Leaderboard page refetches via fancy-query on scope toggle.
Route::get('/api/leaderboard/contributors', [LeaderboardController::class, 'contributors'])->name('leaderboard.contributors');

// Agent Playground — anonymous, ephemeral MCP session where a visitor's own
// external agent generates Fancy UI screens + data and drives the full kit
// over MCP. No auth, no DB writes; the page owns an in-browser MicroMcpServer.
Route::get('/agent-playground', fn () => Inertia::render('AgentPlayground'))->name('agent-playground');

Route::get('/shop', [ShopController::class, 'index'])->name('shop.index');
Route::post('/shop/{item:slug}/purchase', [ShopController::class, 'purchase'])
    ->middleware('auth')
    ->name('shop.purchase');

// ─── Public registry (shadcn-compatible) ──────────────────────────────
// /r/index.json — list of all installable components.
// /r/{slug}.json — full source bundle for one component.
Route::get('/r/index.json', [RegistryController::class, 'index'])->name('registry.index');
Route::get('/r/{slug}', [RegistryController::class, 'show'])
    ->where('slug', '[a-z0-9\-\.]+')
    ->name('registry.show');

// ─── Install-MCP server ──────────────────────────────────────────────
// Hosted MCP endpoint so any MCP-capable IDE (Claude Code, Cursor, VS Code,
// Codex) can browse, search, and install Fancy UI components conversationally.
// Tools: list_components, search_components, get_component, install_instructions.
Mcp::web('/mcp', FancyUiRegistry::class);

// ─── Docs hub ────────────────────────────────────────────────────────
Route::get('/docs', [DocsController::class, 'show'])->name('docs.index');
Route::get('/docs/{slug}', [DocsController::class, 'show'])
    ->where('slug', '[a-z0-9\-]+')
    ->name('docs.show');

// Public, embeddable "Fancified" badge for repo READMEs. OUTSIDE the auth
// group so GitHub's README renderer (and the verifier) can hot-link it.
Route::get('/badge/fancified.svg', FancifiedBadgeController::class)->name('showcase.badge.fancified');

Route::get('/showcase', [ShowcaseSubmissionController::class, 'index'])->name('showcase.showcase.index');
Route::middleware('auth')->group(function () {
    Route::get('/showcase/mine', [ShowcaseSubmissionController::class, 'mine'])->name('showcase.showcase.mine');
    Route::get('/showcase/submit', [ShowcaseSubmissionController::class, 'create'])->name('showcase.showcase.create');
    Route::post('/showcase/submit', [ShowcaseSubmissionController::class, 'store'])->name('showcase.showcase.store');
    Route::get('/showcase/submit/{submission}/installed', [ShowcaseSubmissionController::class, 'installed'])->name('showcase.showcase.installed');
    Route::post('/showcase/submit/{submission}/rescan', [ShowcaseSubmissionController::class, 'rescan'])->name('showcase.showcase.rescan');
    Route::delete('/showcase/submit/{submission}', [ShowcaseSubmissionController::class, 'destroy'])->name('showcase.showcase.destroy');
});

// Vote endpoints (auth required for cast; tallies are public).
Route::get('/api/votes', [VoteController::class, 'tallies'])->name('votes.tallies');
Route::middleware('auth')->post('/api/votes', [VoteController::class, 'cast'])->name('votes.cast');

// GitHub auth.
Route::get('/auth/github', [GitHubLoginController::class, 'redirect'])->name('auth.github');
Route::get('/auth/github/callback', [GitHubLoginController::class, 'callback'])->name('auth.github.callback');
Route::post('/auth/logout', [GitHubLoginController::class, 'logout'])->name('auth.logout');

// ─── laravel-catalog package demo storefront (preserved at /catalog-demo) ──
Route::get('/catalog-demo', [ProductController::class, 'index'])->name('catalog-demo.home');
Route::get('/products', [ProductController::class, 'index'])->name('products.index');
Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');

// Subscription management routes (require authentication)
Route::middleware(['auth'])->group(function () {
    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::post('/subscriptions/create/{price}', [SubscriptionController::class, 'create'])->name('subscriptions.create');
    Route::get('/subscriptions/success', [SubscriptionController::class, 'success'])->name('subscriptions.success');
    Route::get('/subscriptions/cancel', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
});

// Custom Admin routes using facades
Route::prefix('admin')->name('admin.')->middleware(['web', 'auth', 'can:admin'])->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Custom Plans Management (recurring products using Catalog facade)
    Route::resource('plans', AdminPlansController::class);
    Route::post('plans/{plan}/sync', [AdminPlansController::class, 'sync'])->name('plans.sync');

    // Custom Products Management (using Catalog facade)
    Route::resource('products', AdminProductsController::class);
    Route::post('products/{product}/sync', [AdminProductsController::class, 'sync'])->name('products.sync');
    Route::post('products/sync-all', [AdminProductsController::class, 'syncAll'])->name('products.sync-all');

    // Features Management (using FMS facade)
    Route::get('features', [AdminFeaturesController::class, 'index'])->name('features.index');
    Route::post('features/test', [AdminFeaturesController::class, 'test'])->name('features.test');

    // Referral program config (fancy-mlm compensation plan + downline shape)
    Route::get('mlm', [AdminMlmController::class, 'index'])->name('mlm.index');
    Route::put('mlm', [AdminMlmController::class, 'update'])->name('mlm.update');

    // Referral network member management (create / re-organize / splice-delete / demo purge)
    Route::post('mlm/members', [AdminMlmController::class, 'storeMember'])->name('mlm.members.store');
    Route::post('mlm/members/purge-demo', [AdminMlmController::class, 'purgeDemoMembers'])->name('mlm.members.purge-demo');
    Route::put('mlm/members/{member}', [AdminMlmController::class, 'updateMember'])->name('mlm.members.update');
    Route::delete('mlm/members/{member}', [AdminMlmController::class, 'destroyMember'])->name('mlm.members.destroy');

    // Coin Shop Management
    Route::resource('shop', AdminShopController::class)->except(['show']);
    Route::post('shop/{shop}/toggle', [AdminShopController::class, 'toggle'])->name('shop.toggle');

    // User Management + manual grants
    Route::get('users', [AdminUsersController::class, 'index'])->name('users.index');
    Route::get('users/{user}', [AdminUsersController::class, 'show'])->name('users.show');
    Route::post('users/{user}/grant-xp', [AdminUsersController::class, 'grantXp'])->name('users.grant-xp');
    Route::post('users/{user}/grant-coins', [AdminUsersController::class, 'grantCoins'])->name('users.grant-coins');
    Route::post('users/{user}/grant-achievement', [AdminUsersController::class, 'grantAchievement'])->name('users.grant-achievement');
    Route::post('users/{user}/grant-prize', [AdminUsersController::class, 'grantPrize'])->name('users.grant-prize');
    Route::post('users/{user}/toggle-opt-out', [AdminUsersController::class, 'toggleOptOut'])->name('users.toggle-opt-out');
    Route::post('users/{user}/toggle-admin', [AdminUsersController::class, 'toggleAdmin'])->name('users.toggle-admin');
    Route::post('users/{user}/toggle-pro', [AdminUsersController::class, 'togglePro'])->name('users.toggle-pro');
    Route::post('users/{user}/toggle-suspend', [AdminUsersController::class, 'toggleSuspend'])->name('users.toggle-suspend');

    // Gamification taxonomy (achievements + prizes)
    Route::get('gamification', [AdminGamificationController::class, 'index'])->name('gamification.index');
    Route::get('gamification/achievements/create', [AdminGamificationController::class, 'editAchievement'])->name('gamification.achievements.create');
    Route::post('gamification/achievements', [AdminGamificationController::class, 'saveAchievement'])->name('gamification.achievements.store');
    Route::get('gamification/achievements/{achievement}/edit', [AdminGamificationController::class, 'editAchievement'])->name('gamification.achievements.edit');
    Route::put('gamification/achievements/{achievement}', [AdminGamificationController::class, 'saveAchievement'])->name('gamification.achievements.update');
    Route::post('gamification/achievements/{achievement}/toggle', [AdminGamificationController::class, 'toggleAchievement'])->name('gamification.achievements.toggle');
    Route::get('gamification/prizes/create', [AdminGamificationController::class, 'editPrize'])->name('gamification.prizes.create');
    Route::post('gamification/prizes', [AdminGamificationController::class, 'savePrize'])->name('gamification.prizes.store');
    Route::get('gamification/prizes/{prize}/edit', [AdminGamificationController::class, 'editPrize'])->name('gamification.prizes.edit');
    Route::put('gamification/prizes/{prize}', [AdminGamificationController::class, 'savePrize'])->name('gamification.prizes.update');
    Route::post('gamification/prizes/{prize}/toggle', [AdminGamificationController::class, 'togglePrize'])->name('gamification.prizes.toggle');

    // Unified Sites admin — a showcase submission IS an analytics site, so
    // moderation + analytics + the owner's Pro tier live on one surface.
    Route::get('sites', [AdminSitesController::class, 'index'])->name('sites.index');
    Route::get('sites/{submission}', [AdminSitesController::class, 'show'])->name('sites.show');
    Route::post('sites/bulk', [AdminSitesController::class, 'bulk'])->name('sites.bulk');
    Route::post('sites/{submission}/verify', [AdminSitesController::class, 'verify'])->name('sites.verify');
    Route::post('sites/{submission}/reject', [AdminSitesController::class, 'reject'])->name('sites.reject');
    Route::post('sites/{submission}/rescan', [AdminSitesController::class, 'rescan'])->name('sites.rescan');
    Route::post('sites/{submission}/recapture', [AdminSitesController::class, 'recapture'])->name('sites.recapture');
    Route::post('sites/{submission}/feature', [AdminSitesController::class, 'feature'])->name('sites.feature');
    Route::post('sites/{submission}/unfeature', [AdminSitesController::class, 'unfeature'])->name('sites.unfeature');
    Route::post('sites/{submission}/suspend', [AdminSitesController::class, 'suspend'])->name('sites.suspend');
    Route::post('sites/{submission}/unsuspend', [AdminSitesController::class, 'unsuspend'])->name('sites.unsuspend');
    Route::post('sites/{submission}/nsfw-confirm', [AdminSitesController::class, 'confirmNsfw'])->name('sites.nsfw-confirm');
    Route::post('sites/{submission}/nsfw-clear', [AdminSitesController::class, 'clearNsfw'])->name('sites.nsfw-clear');
    Route::post('sites/{submission}/category', [AdminSitesController::class, 'setCategory'])->name('sites.category');
    Route::post('sites/{submission}/toggle-pro', [AdminSitesController::class, 'toggleOwnerPro'])->name('sites.toggle-pro');
    Route::post('sites/{submission}/verify-pixel', [AdminSitesController::class, 'verifyPixel'])->name('sites.verify-pixel');

    // Legacy routes → unified Sites admin. Old per-site heuristics drilldown
    // (incl. the non-submission dogfood site) stays available for deep links.
    Route::get('submissions', fn () => redirect()->route('admin.sites.index'))->name('submissions.index');
    Route::get('submissions/{submission}', fn (ShowcaseSubmission $submission) => redirect()->route('admin.sites.show', $submission))->name('submissions.show');
    Route::get('heuristics', fn () => redirect()->route('admin.sites.index'))->name('heuristics.index');
    Route::get('heuristics/{site:site_key}', [AdminHeuristicsController::class, 'show'])->name('heuristics.show');
    Route::post('heuristics/{site:site_key}/verify', [AdminHeuristicsController::class, 'verify'])->name('heuristics.verify');

    // App settings — admin-editable config (e.g. the tracker/pixel snippet).
    Route::get('settings', [AdminSettingsController::class, 'index'])->name('settings.index');
    Route::post('settings', [AdminSettingsController::class, 'update'])->name('settings.update');

    // Well-known files editor (robots.txt / security.txt / humans.txt / …),
    // served by fancy-x-files from the saved model.
    Route::get('well-known-files', [AdminWellKnownFilesController::class, 'index'])->name('well-known-files.index');
    Route::post('well-known-files', [AdminWellKnownFilesController::class, 'update'])->name('well-known-files.update');
    Route::post('well-known-files/reset', [AdminWellKnownFilesController::class, 'reset'])->name('well-known-files.reset');
});

// React demos (SPA catch-all)
Route::get('/react-demos/{any?}', fn () => view('react-demos'))->where('any', '.*')->name('react-demos');

// Shared whiteboard agent — proxies Anthropic messages so the browser
// can drive an MCP-style tool-use loop against the local board state.
Route::post('/whiteboard-agent/turn', WhiteboardAgentController::class)
    ->name('whiteboard-agent.turn');

// Agent relay — token-gated SSE + POST broker that lets external MCP clients
// reach a browser-side MicroMcpServer. Generic (co-browse / whiteboard / flow /
// …). See app/Http/Controllers/AgentRelayController.php for the wire model.
// `/whiteboard-share/*` is kept as a back-compat alias (the relay keys state by
// session id, not path, so old + new clients interoperate on the same session).
foreach (['agent-relay', 'whiteboard-share'] as $relayPrefix) {
    Route::post("/{$relayPrefix}/register", [AgentRelayController::class, 'register']);
    Route::post("/{$relayPrefix}/{session}/unregister", [AgentRelayController::class, 'unregister']);
    Route::post("/{$relayPrefix}/{session}/inbox", [AgentRelayController::class, 'inbox']);
    Route::post("/{$relayPrefix}/{session}/outbox", [AgentRelayController::class, 'outbox']);
    Route::get("/{$relayPrefix}/{session}/events", [AgentRelayController::class, 'events']);
    // CDN/Cloudflare-safe receive leg (bounded long-poll) — survives an HTTP/3
    // edge that resets SSE. Client: @particle-academy/fancy-cf-relay.
    Route::get("/{$relayPrefix}/{session}/poll", [AgentRelayController::class, 'poll']);
}
