# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo sandbox** for developing and prototyping Particle Academy packages. The root is a Laravel 12 application that consumes local packages via Composer path repositories and git submodules, providing a live environment to build, test, and demo everything together.

Packages symlinked via Composer path repos:
- `packages/laravel-catalog/` - **Primary**: Stripe catalog management (Products, Prices) with optional admin UI
- `packages/laravel-fms/` - Feature Management System (FMS) - dependency of Catalog
- `packages/fancy-flux/` - Blade UI component library (git submodule, repo: wishborn/fancy)
- `packages/react-fancy/` - React UI component library (git submodule)
- `packages/react-echarts/` - React ECharts component library (git submodule)
- `packages/fancy-code/` - React code editor (git submodule)
- `packages/fancy-sheets/` - React spreadsheet (git submodule)

## Common Commands

### Development
```bash
composer run dev          # Starts server, queue, logs (pail), and Vite concurrently
composer run setup        # Full setup: install, env, key, migrate, npm
reload                    # Clear cache + npm run build (custom shortcut)
```

### Building

**Just run `npm run build`. Never run per-package builds.**

The sandbox handles everything — `vite.config.js` aliases `@particle-academy/*` to each package's `src/` directory, so `npm run build` compiles package source alongside the app in one pass. Package `dist/` output only matters for external npm consumers, and `npm publish` regenerates it automatically.

### Testing
```bash
php artisan test --compact                                    # Run all tests
php artisan test --compact tests/Feature/Catalog/             # Run catalog tests
php artisan test --compact --filter=testName                  # Run specific test
php artisan test --compact tests/Feature/Catalog/ProductCreationTest.php  # Single file
```

Tests use Pest, SQLite in-memory, and `RefreshDatabase` (via `Tests\TestCase`).

### Code Formatting
```bash
vendor/bin/pint --dirty   # Format only changed files (run before finalizing)
vendor/bin/pint           # Format all files
```

## Architecture

### Package: laravel-catalog (`packages/laravel-catalog/`)

Namespace: `LaravelCatalog\`

**Core pattern**: The `CatalogManager` class is the central API, accessed via the `Catalog` facade. It delegates to two services:
- `StripeCatalogService` - Syncs Products/Prices to Stripe
- `StripeCheckoutService` - Creates Stripe Checkout sessions (subscription and one-time)

**Key concept**: Plans are Products with recurring Prices -- there is no separate Plan model. Every Product must have at least one Price before syncing to Stripe.

**Models**: `Product`, `Price`, `ProductFeature` (for FMS integration)

**Optional UI**: The admin UI (`Admin\Products\Index`) only loads when `catalog.enable_ui` config is true or views have been published.

**Service Provider** (`CatalogServiceProvider`): Auto-loads Cashier migrations, registers UI components conditionally, configures FMS to use Catalog's `ProductFeature` model.

**Config**: `config/catalog.php` controls auto-sync, queue connection, admin routes/middleware, broadcasting channel.

### Package: laravel-fms (`packages/laravel-fms/`)

Namespace: `ParticleAcademy\Fms\`

Feature access control with multiple strategies checked in order: Gates/Policies -> Feature Registry -> Config -> Database. Supports boolean and resource (metered) feature types.

### Demo App (root)

The root Laravel app has controllers in `app/Http/Controllers/Admin/` and `app/Http/Controllers/` that exercise both packages. Tests live in `tests/Feature/Catalog/` and `tests/Feature/Integration/`.

## Conventions

- **PHP**: Always use curly braces for control structures. Use constructor property promotion. Explicit return types and type hints on all methods. PHPDoc blocks over inline comments.
- **Tailwind v4**: CSS-first config via `@theme` directive. Use `@import "tailwindcss"` not `@tailwind` directives. No deprecated opacity utilities.
- **Tests**: All Pest. Feature tests preferred over unit tests. Use factories and their states. Use datasets for validation testing.
- **Enums**: TitleCase keys (e.g., `Monthly`, `FavoritePerson`).
- **Database**: Prefer `Model::query()` over `DB::`. Use eager loading to prevent N+1. Use Eloquent relationships over raw queries.
- **Config access**: Always `config('key')`, never `env()` outside config files.
- **Validation**: Use Form Request classes, not inline validation.

## Git Rules

- **NEVER use `git add -A` or `git add .`**. Always stage specific files by name. This monorepo has submodules, untracked experiments, and files that must not be blindly committed.
- Before every commit, review changes with `git diff --stat` or `git status`, then `git add <specific files>`.
- Always tag releases for packages (`git tag v1.x.x`) and push tags with `git push origin main --tags`.
- For `react-fancy`, publish to npm with `npm publish --access public` after tagging.
- For `fancy-flux`, pushing the tag to GitHub is sufficient (Composer resolves from git).
