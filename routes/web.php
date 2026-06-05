<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFeaturesController;
use App\Http\Controllers\Admin\AdminGamificationController;
use App\Http\Controllers\Admin\AdminPlansController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Admin\AdminShopController;
use App\Http\Controllers\Admin\AdminShowcaseSubmissionsController;
use App\Http\Controllers\Admin\AdminUsersController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\XpController;
use App\Http\Controllers\Auth\GitHubLoginController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DarkSlideExportController;
use App\Http\Controllers\DevLoginController;
use App\Http\Controllers\EasterEggController;
use App\Http\Controllers\HolySheetExportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SeoController;
use App\Http\Controllers\Showcase\DocsController;
use App\Http\Controllers\Showcase\DreamingController;
use App\Http\Controllers\Showcase\FancifiedBadgeController;
use App\Http\Controllers\Showcase\HomeController;
use App\Http\Controllers\Showcase\LeaderboardController;
use App\Http\Controllers\Showcase\PackagesController;
use App\Http\Controllers\Showcase\ProfileController;
use App\Http\Controllers\Showcase\RegistryController;
use App\Http\Controllers\Showcase\ShopController;
use App\Http\Controllers\Showcase\ShowcaseSubmissionController;
use App\Http\Controllers\Showcase\StarterKitController;
use App\Http\Controllers\Showcase\StarterKitDownloadController;
use App\Http\Controllers\Showcase\VoteController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\Webhooks\GitHubWebhookController;
use App\Http\Controllers\WhiteboardAgentController;
use App\Http\Controllers\WhiteboardShareController;
use App\Http\Middleware\TrackPackageBrowsing;
use App\Mcp\Servers\FancyUiRegistry;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Mcp\Facades\Mcp;

// SEO / discovery + well-known endpoints (public, plain-text/xml — served
// dynamically so they stay in sync with the routes + PackageRegistry).
Route::get('/robots.txt', [SeoController::class, 'robots'])->name('seo.robots');
Route::get('/sitemap.xml', [SeoController::class, 'sitemap'])->name('seo.sitemap');
Route::get('/llms.txt', [SeoController::class, 'llms'])->name('seo.llms');
Route::get('/llms-full.txt', [SeoController::class, 'llmsFull'])->name('seo.llms-full');
Route::get('/.well-known/security.txt', [SeoController::class, 'securityTxt'])->name('seo.security');
Route::get('/security.txt', [SeoController::class, 'securityTxt']);
Route::get('/humans.txt', [SeoController::class, 'humans'])->name('seo.humans');

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

    // Pro Analytics Suite — Pro-gated dashboard over the live Fancy Heuristics
    // feed. Auth required; the controller's FMS `analytics-suite` check splits
    // Pro users (real dashboard) from everyone else (upsell panel).
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Hidden Easter-egg story endings → unlock the secret achievements.
    Route::post('/api/easter-eggs/ending', [EasterEggController::class, 'ending'])
        ->middleware('throttle:60,1')
        ->name('easter-egg.ending');
});

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

Route::get('/dreaming', [DreamingController::class, 'index'])->name('dreaming.index');
Route::get('/dreaming/archived', [DreamingController::class, 'archived'])->name('dreaming.archived');

Route::get('/leaderboard', LeaderboardController::class)->name('leaderboard');

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
    Route::get('/showcase/submit', [ShowcaseSubmissionController::class, 'create'])->name('showcase.showcase.create');
    Route::post('/showcase/submit', [ShowcaseSubmissionController::class, 'store'])->name('showcase.showcase.store');
    Route::get('/showcase/submit/{submission}/installed', [ShowcaseSubmissionController::class, 'installed'])->name('showcase.showcase.installed');
    Route::post('/showcase/submit/{submission}/rescan', [ShowcaseSubmissionController::class, 'rescan'])->name('showcase.showcase.rescan');
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

    // Showcase Submissions moderation
    Route::get('submissions', [AdminShowcaseSubmissionsController::class, 'index'])->name('submissions.index');
    Route::get('submissions/{submission}', [AdminShowcaseSubmissionsController::class, 'show'])->name('submissions.show');
    Route::post('submissions/{submission}/verify', [AdminShowcaseSubmissionsController::class, 'verify'])->name('submissions.verify');
    Route::post('submissions/{submission}/reject', [AdminShowcaseSubmissionsController::class, 'reject'])->name('submissions.reject');
    Route::post('submissions/{submission}/feature', [AdminShowcaseSubmissionsController::class, 'feature'])->name('submissions.feature');
    Route::post('submissions/{submission}/unfeature', [AdminShowcaseSubmissionsController::class, 'unfeature'])->name('submissions.unfeature');
    Route::post('submissions/{submission}/rescan', [AdminShowcaseSubmissionsController::class, 'rescan'])->name('submissions.rescan');
});

// React demos (SPA catch-all)
Route::get('/react-demos/{any?}', fn () => view('react-demos'))->where('any', '.*')->name('react-demos');

// Shared whiteboard agent — proxies Anthropic messages so the browser
// can drive an MCP-style tool-use loop against the local board state.
Route::post('/whiteboard-agent/turn', WhiteboardAgentController::class)
    ->name('whiteboard-agent.turn');

// Whiteboard share relay — token-gated SSE + POST broker that lets external
// MCP clients reach a browser-side MicroMcpServer. See
// app/Http/Controllers/WhiteboardShareController.php for the wire model.
Route::post('/whiteboard-share/register', [WhiteboardShareController::class, 'register']);
Route::post('/whiteboard-share/{session}/unregister', [WhiteboardShareController::class, 'unregister']);
Route::post('/whiteboard-share/{session}/inbox', [WhiteboardShareController::class, 'inbox']);
Route::post('/whiteboard-share/{session}/outbox', [WhiteboardShareController::class, 'outbox']);
Route::get('/whiteboard-share/{session}/events', [WhiteboardShareController::class, 'events']);
