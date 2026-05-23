<?php

declare(strict_types=1);

namespace DarkSlide\Laravel;

use DarkSlide\DarkSlide;
use Illuminate\Support\ServiceProvider;

/**
 * Optional Laravel service provider. Registers the DarkSlide singleton so
 * the facade can resolve it from any application container. The core
 * package has no dependency on Laravel — this provider is loaded only
 * when `illuminate/support` is installed.
 */
final class DarkSlideServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton('dark-slide', function () {
            // Pin the temp dir to a known-writable location inside the
            // Laravel install. PHP's built-in dev server can resolve
            // `sys_get_temp_dir()` to `C:\WINDOWS` on some Windows
            // profiles, which then isn't writable. Routing through
            // storage/framework/cache sidesteps that entirely.
            $tempDir = $this->app->storagePath('framework/cache');
            if (!is_dir($tempDir)) {
                @mkdir($tempDir, 0775, true);
            }

            return new DarkSlide($tempDir);
        });
        $this->app->singleton(DarkSlide::class, fn () => $this->app->make('dark-slide'));
    }

    public function boot(): void
    {
        // Nothing to boot yet. v0.2 may publish a stub controller for
        // serving decks as PPTX downloads with the right Content-Type.
    }
}
