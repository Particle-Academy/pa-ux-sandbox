<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HolySheetExportController;

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
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class])
    ->name('holy-sheet.export');

// ─── Fancy UI Showcase ─────────────────────────────────────────────────
Route::get('/', \App\Http\Controllers\Showcase\HomeController::class)->name('home');

Route::get('/packages', [\App\Http\Controllers\Showcase\PackagesController::class, 'index'])->name('packages.index');
Route::get('/packages/{package}', [\App\Http\Controllers\Showcase\PackagesController::class, 'show'])->name('packages.show');
Route::get('/packages/{package}/{component}', [\App\Http\Controllers\Showcase\PackagesController::class, 'component'])->name('packages.component');

Route::get('/starter-kits', [\App\Http\Controllers\Showcase\StarterKitController::class, 'index'])->name('starter-kits.index');
Route::get('/starter-kits/{slug}', [\App\Http\Controllers\Showcase\StarterKitController::class, 'show'])->name('starter-kits.show');

Route::get('/dreaming', [\App\Http\Controllers\Showcase\DreamingController::class, 'index'])->name('dreaming.index');
Route::get('/dreaming/archived', [\App\Http\Controllers\Showcase\DreamingController::class, 'archived'])->name('dreaming.archived');

Route::get('/leaderboard', \App\Http\Controllers\Showcase\LeaderboardController::class)->name('leaderboard');

Route::get('/showcase', [\App\Http\Controllers\Showcase\ShowcaseSubmissionController::class, 'index'])->name('showcase.showcase.index');
Route::middleware('auth')->group(function () {
    Route::get('/showcase/submit', [\App\Http\Controllers\Showcase\ShowcaseSubmissionController::class, 'create'])->name('showcase.showcase.create');
    Route::post('/showcase/submit', [\App\Http\Controllers\Showcase\ShowcaseSubmissionController::class, 'store'])->name('showcase.showcase.store');
});

// Vote endpoints (auth required for cast; tallies are public).
Route::get('/api/votes', [\App\Http\Controllers\Showcase\VoteController::class, 'tallies'])->name('votes.tallies');
Route::middleware('auth')->post('/api/votes', [\App\Http\Controllers\Showcase\VoteController::class, 'cast'])->name('votes.cast');

// GitHub auth.
Route::get('/auth/github', [\App\Http\Controllers\Auth\GitHubLoginController::class, 'redirect'])->name('auth.github');
Route::get('/auth/github/callback', [\App\Http\Controllers\Auth\GitHubLoginController::class, 'callback'])->name('auth.github.callback');
Route::post('/auth/logout', [\App\Http\Controllers\Auth\GitHubLoginController::class, 'logout'])->name('auth.logout');

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
    Route::get('/', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');
    
    // Custom Plans Management (recurring products using Catalog facade)
    Route::resource('plans', \App\Http\Controllers\Admin\AdminPlansController::class);
    Route::post('plans/{plan}/sync', [\App\Http\Controllers\Admin\AdminPlansController::class, 'sync'])->name('plans.sync');
    
    // Custom Products Management (using Catalog facade)
    Route::resource('products', \App\Http\Controllers\Admin\AdminProductsController::class);
    Route::post('products/{product}/sync', [\App\Http\Controllers\Admin\AdminProductsController::class, 'sync'])->name('products.sync');
    Route::post('products/sync-all', [\App\Http\Controllers\Admin\AdminProductsController::class, 'syncAll'])->name('products.sync-all');
    
    // Features Management (using FMS facade)
    Route::get('features', [\App\Http\Controllers\Admin\AdminFeaturesController::class, 'index'])->name('features.index');
    Route::post('features/test', [\App\Http\Controllers\Admin\AdminFeaturesController::class, 'test'])->name('features.test');
});

// React demos (SPA catch-all)
Route::get('/react-demos/{any?}', fn () => view('react-demos'))->where('any', '.*')->name('react-demos');

// Shared whiteboard agent — proxies Anthropic messages so the browser
// can drive an MCP-style tool-use loop against the local board state.
Route::post('/whiteboard-agent/turn', \App\Http\Controllers\WhiteboardAgentController::class)
    ->name('whiteboard-agent.turn');

// Whiteboard share relay — token-gated SSE + POST broker that lets external
// MCP clients reach a browser-side MicroMcpServer. See
// app/Http/Controllers/WhiteboardShareController.php for the wire model.
Route::post('/whiteboard-share/register', [\App\Http\Controllers\WhiteboardShareController::class, 'register']);
Route::post('/whiteboard-share/{session}/unregister', [\App\Http\Controllers\WhiteboardShareController::class, 'unregister']);
Route::post('/whiteboard-share/{session}/inbox', [\App\Http\Controllers\WhiteboardShareController::class, 'inbox']);
Route::post('/whiteboard-share/{session}/outbox', [\App\Http\Controllers\WhiteboardShareController::class, 'outbox']);
Route::get('/whiteboard-share/{session}/events', [\App\Http\Controllers\WhiteboardShareController::class, 'events']);

