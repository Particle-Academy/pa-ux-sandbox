<?php

use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminFeaturesController;
use App\Http\Controllers\Admin\AdminPlansController;
use App\Http\Controllers\Admin\AdminProductsController;
use App\Http\Controllers\Auth\GitHubLoginController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HolySheetExportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Showcase\DocsController;
use App\Http\Controllers\Showcase\DreamingController;
use App\Http\Controllers\Showcase\HomeController;
use App\Http\Controllers\Showcase\LeaderboardController;
use App\Http\Controllers\Showcase\PackagesController;
use App\Http\Controllers\Showcase\RegistryController;
use App\Http\Controllers\Showcase\ShowcaseSubmissionController;
use App\Http\Controllers\Showcase\StarterKitController;
use App\Http\Controllers\Showcase\VoteController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\WhiteboardAgentController;
use App\Http\Controllers\WhiteboardShareController;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Facades\Route;

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// xlsx export endpoint for the fancy-sheets demo. The controller is owned
// by the sandbox app — Holy Sheet ships only the writer + facade. Apps
// build their own routes (see app/Http/Controllers/HolySheetExportController).
Route::post('/holy-sheet/export', HolySheetExportController::class)
    ->withoutMiddleware([PreventRequestForgery::class])
    ->name('holy-sheet.export');

// ─── Fancy UI Showcase ─────────────────────────────────────────────────
Route::get('/', HomeController::class)->name('home');

Route::get('/packages', [PackagesController::class, 'index'])->name('packages.index');
Route::get('/packages/{package}', [PackagesController::class, 'show'])->name('packages.show');
Route::get('/packages/{package}/{component}', [PackagesController::class, 'component'])->name('packages.component');

Route::get('/starter-kits', [StarterKitController::class, 'index'])->name('starter-kits.index');
Route::get('/starter-kits/{slug}', [StarterKitController::class, 'show'])->name('starter-kits.show');

Route::get('/dreaming', [DreamingController::class, 'index'])->name('dreaming.index');
Route::get('/dreaming/archived', [DreamingController::class, 'archived'])->name('dreaming.archived');

Route::get('/leaderboard', LeaderboardController::class)->name('leaderboard');

// ─── Public registry (shadcn-compatible) ──────────────────────────────
// /r/index.json — list of all installable components.
// /r/{slug}.json — full source bundle for one component.
Route::get('/r/index.json', [RegistryController::class, 'index'])->name('registry.index');
Route::get('/r/{slug}', [RegistryController::class, 'show'])
    ->where('slug', '[a-z0-9\-\.]+')
    ->name('registry.show');

// ─── Docs hub ────────────────────────────────────────────────────────
Route::get('/docs', [DocsController::class, 'show'])->name('docs.index');
Route::get('/docs/{slug}', [DocsController::class, 'show'])
    ->where('slug', '[a-z0-9\-]+')
    ->name('docs.show');

Route::get('/showcase', [ShowcaseSubmissionController::class, 'index'])->name('showcase.showcase.index');
Route::middleware('auth')->group(function () {
    Route::get('/showcase/submit', [ShowcaseSubmissionController::class, 'create'])->name('showcase.showcase.create');
    Route::post('/showcase/submit', [ShowcaseSubmissionController::class, 'store'])->name('showcase.showcase.store');
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
