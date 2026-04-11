<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\AuthController;

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// Storefront routes
Route::get('/', [ProductController::class, 'index'])->name('home');
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
Route::prefix('admin')->name('admin.')->middleware(['web', 'auth'])->group(function () {
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

// UX Demo Hub
Route::get('/ux-demos', fn () => view('ux-demos'))->name('ux-demos');

// Fancy Flux Demos
Route::prefix('ux-demos')->name('ux-demos.')->group(function () {
    Route::get('/action', \App\Livewire\ActionExamples::class)->name('action');
    Route::get('/carousel', \App\Livewire\BasicCarousel::class)->name('carousel');
    Route::get('/color-picker', \App\Livewire\ColorPickerExamples::class)->name('color-picker');
    Route::get('/drawer', \App\Livewire\DrawerExamples::class)->name('drawer');
    Route::get('/dynamic-carousel', \App\Livewire\DynamicCarousel::class)->name('dynamic-carousel');
    Route::get('/emoji-select', \App\Livewire\EmojiSelectExamples::class)->name('emoji-select');
    Route::get('/nested-carousel', \App\Livewire\NestedCarousel::class)->name('nested-carousel');
    Route::get('/wizard-form', \App\Livewire\WizardForm::class)->name('wizard-form');
    Route::get('/timeline', \App\Livewire\TimelineExamples::class)->name('timeline');
});

// React demos (SPA catch-all)
Route::get('/react-demos/{any?}', fn () => view('react-demos'))->where('any', '.*')->name('react-demos');

// Published Catalog UI routes (only if UI is enabled)
if (config('catalog.enable_ui', false) || file_exists(resource_path('views/vendor/catalog'))) {
    Route::prefix('ctrl')->name('ctrl.')->middleware(['web', 'auth'])->group(function () {
        Route::get('/products', \LaravelCatalog\Livewire\Admin\Products\Index::class)->name('products.index');
    });
}
