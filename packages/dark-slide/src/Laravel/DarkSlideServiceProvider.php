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
        $this->app->singleton('dark-slide', fn () => new DarkSlide());
        $this->app->singleton(DarkSlide::class, fn () => $this->app->make('dark-slide'));
    }

    public function boot(): void
    {
        // Nothing to boot yet. v0.2 may publish a stub controller for
        // serving decks as PPTX downloads with the right Content-Type.
    }
}
