# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo sandbox** for developing and prototyping Particle Academy packages. The root is a Laravel 13 application that consumes local packages via Composer path repositories and git submodules, providing a live environment to build, test, and demo everything together.

Packages symlinked via Composer path repos:
- `packages/laravel-catalog/` - **Primary**: Stripe catalog management (Products, Prices) with optional admin UI
- `packages/laravel-fms/` - Feature Management System (FMS) - dependency of Catalog
- `packages/fancy-flux/` - Blade UI component library (git submodule, repo: wishborn/fancy)
- `packages/react-fancy/` - React UI component library (git submodule)
- `packages/fancy-echarts/` - React ECharts component library (git submodule, npm: `@particle-academy/fancy-echarts`)
- `packages/fancy-code/` - React code editor (git submodule)
- `packages/fancy-sheets/` - React spreadsheet (git submodule)
- `packages/fancy-3d/` - UI kit for humans and agents to author rich, data-driven 3D apps: engine-agnostic `Scene` types + adapters (`/dom`, `/babylon`) + shape primitives + 3D-native components like `Screen`. Local-only, not yet a submodule. `react-fancy` stays raw React; the bridge to 3D engines lives here.

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
- Each package under `packages/*` is its own git submodule with its own remote on `Particle-Academy/<repo>`. Doc/code changes inside a submodule require: commit in the submodule → push the submodule → then a separate commit in the root repo bumping the submodule pointer.

## Publishing Releases

### Bootstrapping a brand-new package (one-time)

**Claude can't fill the npm Trusted Publisher form** — modifying npm account access controls is outside what I can do for you, even with explicit permission. This is a one-time manual step per package. The process below is the path-of-least-friction; follow it once and every subsequent release ships via OIDC with zero token handling.

A new package needs three things wired up before its first publish:

1. **GitHub repo** — `gh repo create Particle-Academy/<name> --public --description "..."` (Claude can do).
2. **Bootstrap path for the very first publish** — npm won't let you configure a Trusted Publisher for a package that doesn't exist yet. Two options:
   - **Token bootstrap** (recommended): create a 7-day granular npm token at `https://www.npmjs.com/settings/<your-user>/tokens`, scoped to `@particle-academy` with read+write. Set it as the GitHub repo secret `NPM_TOKEN` via `gh secret set NPM_TOKEN --repo Particle-Academy/<name>` (paste at the prompt — never echoes to chat or shell history). Use a token-based `publish.yml` step (`env: NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` + `npm publish --provenance --access public`).
   - **Manual `npm publish`**: run `npm publish` locally. Same token requirement. Less repeatable.
3. **Trusted Publisher (after first publish lands)** — go to `https://www.npmjs.com/package/@particle-academy/<name>/access`, click **Trusted Publishers** → **Add Trusted Publisher**, fill:
   - Publisher: `GitHub Actions`
   - Organization or user: `Particle-Academy`
   - Repository: `<name>`
   - Workflow filename: `publish.yml`
   - Environment: *(empty)*

   Then **revoke the bootstrap token** at `https://www.npmjs.com/settings/<your-user>/tokens` and **edit `publish.yml`** to drop the `NODE_AUTH_TOKEN` env line — leaving just `npx -y npm@latest publish --provenance --access public` with `id-token: write` permission. Tag and ship the next version; CI publishes via OIDC.

Once a package has been bootstrapped this way, every subsequent release uses the standard "React packages" flow below — no tokens, no special config.

### React packages (all 4 — `react-fancy`, `fancy-echarts`, `fancy-code`, `fancy-sheets`)

The `fancy-echarts` package is published from the `Particle-Academy/react-echarts` git repo (folder/repo name unchanged; only the npm package was renamed). The npm trusted-publisher config on npmjs.com must be set up under `@particle-academy/fancy-echarts` pointing to `Particle-Academy/react-echarts` + `publish.yml`.

Each React package publishes to npm via **GitHub Actions Trusted Publishing (OIDC)**. No tokens, no manual `npm publish`. The workflow lives at `.github/workflows/publish.yml` inside each submodule and fires on tag push `v*.*.*` (or manual `workflow_dispatch`).

To ship a new version of a React package:

1. `cd packages/<name>`
2. Bump `version` in `package.json`
3. Commit the bump
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. CI builds, signs provenance via OIDC, and publishes to npm — usually under 1 minute
6. After CI succeeds, `cd` to root and bump the submodule pointer: `git add packages/<name> && git commit && git push`

Verify with: `npm view @particle-academy/<name> version`

**Hard requirements for the publish to succeed** (don't remove these from `package.json`):
- `repository.url` set to `git+https://github.com/Particle-Academy/<name>.git` — npm's provenance check rejects publish if this is empty or doesn't match the OIDC source
- `homepage` and `bugs` URLs (recommended for the npmjs page)
- `files` array includes `dist`, `docs`, `README.md` (so the published tarball ships docs)

**Workflow gotchas already solved (don't re-introduce)**:
- The bundled npm in `actions/setup-node@v4 (node 22)` is npm 10 — Trusted Publishing OIDC requires npm 11.5+. The workflow uses `npx -y npm@latest publish --provenance --access public` instead of `npm install -g npm@latest` (which fails with `MODULE_NOT_FOUND: promise-retry` due to a self-replacement bug)
- `fancy-code` and `fancy-sheets` declare `@particle-academy/react-fancy` as `workspace:*` in `devDependencies`. Standalone CI has no workspace, so the workflow runs a small `node -e` step that rewrites `workspace:*` → its plain version range before `npm install`

If a tag was pushed before the workflow file existed on that commit (or you need to re-trigger), move the tag forward and force-push: `git tag -d vX.Y.Z && git tag vX.Y.Z && git push origin vX.Y.Z --force`. (Safe because the tag hasn't been consumed by npm yet.)

If the trusted publisher config on npmjs.com is wrong or missing, publish fails with `404 Not Found - PUT .../<package> - Not found`. Fix at `https://www.npmjs.com/package/@particle-academy/<name>/access` — Repository owner = `Particle-Academy`, Repository name = `<name>`, Workflow filename = `publish.yml`, Environment = empty.

### Blade / PHP packages (`fancy-flux`)

`fancy-flux` is consumed by Composer resolving a git tag — no Packagist registry push, no CI workflow. Submodule remote: `wishborn/fancy` (not `Particle-Academy/*`).

To ship a new version:

1. `cd packages/fancy-flux`
2. Bump `"version"` in `composer.json`
3. Commit the bump (`git add composer.json && git commit -m "chore: release vX.Y.Z"`)
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. `cd` to root and bump the submodule pointer: `git add packages/fancy-flux && git commit && git push`

No verification step — the moment the tag is on GitHub, consumers doing `composer update wishborn/fancy-flux` pick it up.

### "Ship it" = full publish flow, not just a branch push

When the user says **ship** for any package, the flow is always: bump version → commit → tag → push tag → wait for CI (React) or none (Blade) → bump submodule pointer in root → push root. Pushing `main` alone is _not_ shipping — consumers installing via npm/composer see nothing until the tag+publish step runs.

Confirm npm publish succeeded before bumping the submodule pointer. For React packages:

```bash
gh run list --limit 1                              # CI status
npm view @particle-academy/<name> version          # live on npm
```

===

<laravel-boost-guidelines>
=== foundation rules ===

# Laravel Boost Guidelines

The Laravel Boost guidelines are specifically curated by Laravel maintainers for this application. These guidelines should be followed closely to ensure the best experience when building Laravel applications.

## Foundational Context

This application is a Laravel application and its main Laravel ecosystems package & versions are below. You are an expert with them all. Ensure you abide by these specific packages & versions.

- php - 8.4
- laravel/cashier (CASHIER) - v15
- laravel/framework (LARAVEL) - v12
- laravel/prompts (PROMPTS) - v0
- livewire/flux (FLUXUI_FREE) - v2
- livewire/livewire (LIVEWIRE) - v4
- laravel/boost (BOOST) - v2
- laravel/mcp (MCP) - v0
- laravel/pail (PAIL) - v1
- laravel/pint (PINT) - v1
- laravel/sail (SAIL) - v1
- pestphp/pest (PEST) - v4
- phpunit/phpunit (PHPUNIT) - v12
- react (REACT) - v19
- tailwindcss (TAILWINDCSS) - v4

## Skills Activation

This project has domain-specific skills available in `**/skills/**`. You MUST activate the relevant skill whenever you work in that domain—don't wait until you're stuck.

## Conventions

- You must follow all existing code conventions used in this application. When creating or editing a file, check sibling files for the correct structure, approach, and naming.
- Use descriptive names for variables and methods. For example, `isRegisteredForDiscounts`, not `discount()`.
- Check for existing components to reuse before writing a new one.

## Verification Scripts

- Do not create verification scripts or tinker when tests cover that functionality and prove they work. Unit and feature tests are more important.

## Application Structure & Architecture

- Stick to existing directory structure; don't create new base folders without approval.
- Do not change the application's dependencies without approval.

## Frontend Bundling

- If the user doesn't see a frontend change reflected in the UI, it could mean they need to run `npm run build`, `npm run dev`, or `composer run dev`. Ask them.

## Documentation Files

- You must only create documentation files if explicitly requested by the user.

## Replies

- Be concise in your explanations - focus on what's important rather than explaining obvious details.

=== boost rules ===

# Laravel Boost

## Tools

- Laravel Boost is an MCP server with tools designed specifically for this application. Prefer Boost tools over manual alternatives like shell commands or file reads.
- Use `database-query` to run read-only queries against the database instead of writing raw SQL in tinker.
- Use `database-schema` to inspect table structure before writing migrations or models.
- Use `get-absolute-url` to resolve the correct scheme, domain, and port for project URLs. Always use this before sharing a URL with the user.
- Use `browser-logs` to read browser logs, errors, and exceptions. Only recent logs are useful, ignore old entries.

## Searching Documentation (IMPORTANT)

- Always use `search-docs` before making code changes. Do not skip this step. It returns version-specific docs based on installed packages automatically.
- Pass a `packages` array to scope results when you know which packages are relevant.
- Use multiple broad, topic-based queries: `['rate limiting', 'routing rate limiting', 'routing']`. Expect the most relevant results first.
- Do not add package names to queries because package info is already shared. Use `test resource table`, not `filament 4 test resource table`.

### Search Syntax

1. Use words for auto-stemmed AND logic: `rate limit` matches both "rate" AND "limit".
2. Use `"quoted phrases"` for exact position matching: `"infinite scroll"` requires adjacent words in order.
3. Combine words and phrases for mixed queries: `middleware "rate limit"`.
4. Use multiple queries for OR logic: `queries=["authentication", "middleware"]`.

## Artisan

- Run Artisan commands directly via the command line (e.g., `php artisan route:list`). Use `php artisan list` to discover available commands and `php artisan [command] --help` to check parameters.
- Inspect routes with `php artisan route:list`. Filter with: `--method=GET`, `--name=users`, `--path=api`, `--except-vendor`, `--only-vendor`.
- Read configuration values using dot notation: `php artisan config:show app.name`, `php artisan config:show database.default`. Or read config files directly from the `config/` directory.
- To check environment variables, read the `.env` file directly.

## Tinker

- Execute PHP in app context for debugging and testing code. Do not create models without user approval, prefer tests with factories instead. Prefer existing Artisan commands over custom tinker code.
- Always use single quotes to prevent shell expansion: `php artisan tinker --execute 'Your::code();'`
  - Double quotes for PHP strings inside: `php artisan tinker --execute 'User::where("active", true)->count();'`

=== php rules ===

# PHP

- Always use curly braces for control structures, even for single-line bodies.
- Use PHP 8 constructor property promotion: `public function __construct(public GitHub $github) { }`. Do not leave empty zero-parameter `__construct()` methods unless the constructor is private.
- Use explicit return type declarations and type hints for all method parameters: `function isAccessible(User $user, ?string $path = null): bool`
- Use TitleCase for Enum keys: `FavoritePerson`, `BestLake`, `Monthly`.
- Prefer PHPDoc blocks over inline comments. Only add inline comments for exceptionally complex logic.
- Use array shape type definitions in PHPDoc blocks.

=== deployments rules ===

# Deployment

- Laravel can be deployed using [Laravel Cloud](https://cloud.laravel.com/), which is the fastest way to deploy and scale production Laravel applications.

=== tests rules ===

# Test Enforcement

- Every change must be programmatically tested. Write a new test or update an existing test, then run the affected tests to make sure they pass.
- Run the minimum number of tests needed to ensure code quality and speed. Use `php artisan test --compact` with a specific filename or filter.

=== laravel/core rules ===

# Do Things the Laravel Way

- Use `php artisan make:` commands to create new files (i.e. migrations, controllers, models, etc.). You can list available Artisan commands using `php artisan list` and check their parameters with `php artisan [command] --help`.
- If you're creating a generic PHP class, use `php artisan make:class`.
- Pass `--no-interaction` to all Artisan commands to ensure they work without user input. You should also pass the correct `--options` to ensure correct behavior.

### Model Creation

- When creating new models, create useful factories and seeders for them too. Ask the user if they need any other things, using `php artisan make:model --help` to check the available options.

## APIs & Eloquent Resources

- For APIs, default to using Eloquent API Resources and API versioning unless existing API routes do not, then you should follow existing application convention.

## URL Generation

- When generating links to other pages, prefer named routes and the `route()` function.

## Testing

- When creating models for tests, use the factories for the models. Check if the factory has custom states that can be used before manually setting up the model.
- Faker: Use methods such as `$this->faker->word()` or `fake()->randomDigit()`. Follow existing conventions whether to use `$this->faker` or `fake()`.
- When creating tests, make use of `php artisan make:test [options] {name}` to create a feature test, and pass `--unit` to create a unit test. Most tests should be feature tests.

## Vite Error

- If you receive an "Illuminate\Foundation\ViteException: Unable to locate file in Vite manifest" error, you can run `npm run build` or ask the user to run `npm run dev` or `composer run dev`.

=== laravel/v12 rules ===

# Laravel 12

- CRITICAL: ALWAYS use `search-docs` tool for version-specific Laravel documentation and updated code examples.
- Since Laravel 11, Laravel has a new streamlined file structure which this project uses.

## Laravel 12 Structure

- In Laravel 12, middleware are no longer registered in `app\Http/Kernel.php`.
- Middleware are configured declaratively in `bootstrap/app.php` using `Application::configure()->withMiddleware()`.
- `bootstrap/app.php` is the file to register middleware, exceptions, and routing files.
- `bootstrap/providers.php` contains application specific service providers.
- The `app\Console/Kernel.php` file no longer exists; use `bootstrap/app.php` or `routes/console.php` for console configuration.
- Console commands in `app\Console/Commands/` are automatically available and do not require manual registration.

## Database

- When modifying a column, the migration must include all of the attributes that were previously defined on the column. Otherwise, they will be dropped and lost.
- Laravel 12 allows limiting eagerly loaded records natively, without external packages: `$query->latest()->limit(10);`.

### Models

- Casts can and likely should be set in a `casts()` method on a model rather than the `$casts` property. Follow existing conventions from other models.

=== livewire/core rules ===

# Livewire

- Livewire allow to build dynamic, reactive interfaces in PHP without writing JavaScript.
- You can use Alpine.js for client-side interactions instead of JavaScript frameworks.
- Keep state server-side so the UI reflects it. Validate and authorize in actions as you would in HTTP requests.

=== pint/core rules ===

# Laravel Pint Code Formatter

- If you have modified any PHP files, you must run `vendor/bin/pint --dirty --format agent` before finalizing changes to ensure your code matches the project's expected style.
- Do not run `vendor/bin/pint --test --format agent`, simply run `vendor/bin/pint --format agent` to fix any formatting issues.

=== pest/core rules ===

## Pest

- This project uses Pest for testing. Create tests: `php artisan make:test --pest {name}`.
- The `{name}` argument should not include the test suite directory. Use `php artisan make:test --pest SomeFeatureTest` instead of `php artisan make:test --pest Feature/SomeFeatureTest`.
- Run tests: `php artisan test --compact` or filter: `php artisan test --compact --filter=testName`.
- Do NOT delete tests without approval.

=== particle-academy/laravel-catalog rules ===

## Laravel Catalog Package

This package provides Stripe catalog (Products and Prices) management with an optional admin UI. All functionality is accessible via a facade, making it perfect for apps using their own UX. Plans are Products with recurring Prices - there is no separate Plan model.

### Features

- **Product Management**: Create, edit, and manage Stripe products with full CRUD operations
- **Price Management**: Manage recurring (subscription) and one-time prices for products
- **Plans Support**: Plans are simply Products with recurring Prices - no separate model needed
- **Stripe Sync**: Automatic or manual synchronization with Stripe's catalog
- **Facade API**: Complete programmatic access via `Catalog` facade - no UI required
- **Optional Admin UI**: Complete Livewire-based admin interface (optional, requires publishing)
- **Product Features**: Support for product features and feature configurations via FMS integration
- **Checkout Integration**: Ready-to-use Stripe Checkout session creation for subscriptions and one-time payments

### File Structure

- `src/CatalogManager.php` - Main facade implementation providing unified interface
- `src/Services/StripeCatalogService.php` - Handles Stripe product/price synchronization
- `src/Services/StripeCheckoutService.php` - Handles Stripe Checkout session creation
- `src/Models/Product.php` - Product model with Stripe sync fields
- `src/Models/Price.php` - Price model for recurring and one-time pricing
- `src/Models/ProductFeature.php` - Product features model for FMS integration
- `src/Facades/Catalog.php` - Facade for accessing catalog functionality
- `src/Livewire/Admin/Products/Index.php` - Admin UI component (optional)

### Core Concepts

**Important**: Every Product must have at least one Price before it can be synced to Stripe. Plans are Products with recurring Prices - there is no separate Plan model.

### Configuration

Publish the configuration file:

<code-snippet name="Publish Catalog config" lang="bash">
php artisan vendor:publish --tag=catalog-config
</code-snippet>

Configure in `config/catalog.php`:

<code-snippet name="Catalog Configuration" lang="php">
return [
    'auto_sync' => env('CATALOG_AUTO_SYNC', false),
    'queue_connection' => env('CATALOG_QUEUE_CONNECTION', 'default'),
    'enable_ui' => env('CATALOG_ENABLE_UI', false),
    'admin_route_prefix' => env('CATALOG_ADMIN_PREFIX', 'admin/catalog'),
    'admin_middleware' => ['web', 'auth'],
    'broadcasting_channel' => env('CATALOG_BROADCASTING_CHANNEL', 'catalog-sync'),
];
</code-snippet>

### Using the Catalog Facade

<code-snippet name="Catalog Facade Usage" lang="php">
use LaravelCatalog\Facades\Catalog;

// Create a product
$product = Catalog::createProduct([
    'name' => 'Pro Plan',
    'description' => 'Professional features',
    'metadata' => ['key' => 'value'],
]);

// Create a price
$price = Catalog::createPrice($product, [
    'amount' => 2999, // in cents
    'currency' => 'usd',
    'recurring' => [
        'interval' => 'month',
    ],
]);

// Sync product to Stripe
Catalog::syncProductAndPrices($product);

// Create checkout session
$checkout = Catalog::createCheckoutSession($user, [
    'price' => $price->stripe_price_id,
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
]);
</code-snippet>

### Creating Products

<code-snippet name="Create Product" lang="php">
use LaravelCatalog\Models\Product;
use LaravelCatalog\Facades\Catalog;

// Using facade
$product = Catalog::createProduct([
    'name' => 'Basic Plan',
    'description' => 'Basic features',
    'active' => true,
    'metadata' => ['plan_type' => 'basic'],
]);

// Using model directly
$product = Product::create([
    'name' => 'Pro Plan',
    'description' => 'Professional features',
    'active' => true,
]);
</code-snippet>

### Creating Prices

<code-snippet name="Create Price" lang="php">
use LaravelCatalog\Models\Price;
use LaravelCatalog\Facades\Catalog;

// Recurring price (subscription)
$recurringPrice = Catalog::createPrice($product, [
    'amount' => 2999, // $29.99 in cents
    'currency' => 'usd',
    'recurring' => [
        'interval' => 'month',
        'interval_count' => 1,
    ],
]);

// One-time price
$oneTimePrice = Catalog::createPrice($product, [
    'amount' => 9999, // $99.99 in cents
    'currency' => 'usd',
    'type' => 'one_time',
]);
</code-snippet>

### Syncing to Stripe

<code-snippet name="Sync to Stripe" lang="php">
use LaravelCatalog\Facades\Catalog;

// Sync single product and its prices
Catalog::syncProductAndPrices($product);

// Sync all products (if auto_sync is disabled)
Catalog::syncAllProducts();

// Queue sync job
Catalog::queueSyncProduct($product);
</code-snippet>

### Creating Checkout Sessions

<code-snippet name="Create Checkout Session" lang="php">
use LaravelCatalog\Facades\Catalog;

// Subscription checkout
$checkout = Catalog::createCheckoutSession($user, [
    'price' => $price->stripe_price_id,
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
    'mode' => 'subscription',
]);

// One-time payment checkout
$checkout = Catalog::createCheckoutSession($user, [
    'price' => $oneTimePrice->stripe_price_id,
    'success_url' => route('checkout.success'),
    'cancel_url' => route('checkout.cancel'),
    'mode' => 'payment',
]);

// Redirect to checkout
return redirect($checkout->url);
</code-snippet>

### Working with Product Features

<code-snippet name="Product Features" lang="php">
use LaravelCatalog\Models\Product;
use LaravelCatalog\Models\ProductFeature;

// Attach feature to product
$product = Product::find($productId);
$feature = ProductFeature::where('key', 'advanced-editing')->first();

$product->productFeatures()->attach($feature->id, [
    'enabled' => true,
    'included_quantity' => 100,
]);

// Check if product has feature
if ($product->productFeatures()->where('key', 'advanced-editing')->exists()) {
    // Product has feature
}
</code-snippet>

### Integration with FMS

When FMS is installed, Catalog automatically configures FMS to use Catalog's `ProductFeature` model:

<code-snippet name="FMS Integration" lang="php">
use ParticleAcademy\Fms\Facades\FMS;
use LaravelCatalog\Models\Product;

// Check feature access for user's subscription
$user = auth()->user();
$subscription = $user->subscriptions()->active()->first();

if ($subscription) {
    $product = $subscription->product();
    
    foreach ($product->productFeatures as $feature) {
        if (FMS::canAccess($feature->key, $user)) {
            // Feature is available
        }
    }
}
</code-snippet>

### Best Practices

- Always create at least one Price before syncing a Product to Stripe
- Use the Catalog facade for all operations to maintain consistency
- Queue sync operations for better performance in production
- Use metadata fields for custom product configurations
- Enable UI only when needed - the package works without UI
- Use Product Features with FMS for feature-based access control
- Always handle Stripe API errors gracefully

=== particle-academy/laravel-fms rules ===

## Laravel Feature Management System (FMS)

This package provides flexible feature access control and management for Laravel applications. FMS supports multiple access control strategies: Gates/Policies, config-based, registry-based, and database lookups. It supports both boolean (on/off) and resource (metered) features.

### Features

- **Multiple Access Control Strategies**: Gates/Policies, config files, feature registry, or database lookups
- **Boolean & Resource Features**: Support for simple on/off features and metered resource features
- **Middleware Protection**: Protect routes based on feature access
- **Facade & Helpers**: Clean API via facade and global helper functions
- **Standalone Package**: Zero dependencies on other packages

### File Structure

- `src/Services/FeatureManager.php` - Core feature access checking logic
- `src/Services/FmsFeatureRegistry.php` - Registry for programmatically registered features
- `src/Facades/FMS.php` - Facade for accessing FMS functionality
- `src/Http/Middleware/RequireFeature.php` - Middleware for route protection
- `src/Models/FeatureUsage.php` - Model for database-based feature tracking
- `src/helpers.php` - Global helper functions
- `config/fms.php` - Configuration file for feature definitions

### Configuration

Features are defined in `config/fms.php`. Publish the config file:

<code-snippet name="Publish FMS config" lang="bash">
php artisan vendor:publish --tag=fms-config
</code-snippet>

Define features in the config:

<code-snippet name="FMS Feature Configuration" lang="php">
return [
    'features' => [
        // Boolean feature
        'use-mcp' => [
            'name' => 'Use MCP',
            'description' => 'Access to MCP-powered assistants and tools.',
            'type' => 'boolean',
            'enabled' => true, // or callable: fn($user) => $user->isPremium()
        ],

        // Resource feature with limit
        'ai-tokens' => [
            'name' => 'AI Tokens',
            'description' => 'Metered AI token usage per billing period.',
            'type' => 'resource',
            'limit' => 10000, // or callable
            'usage' => fn($user) => $user->getTokenUsage(), // optional
        ],
    ],
];
</code-snippet>

### Using the Facade

<code-snippet name="FMS Facade Usage" lang="php">
use ParticleAcademy\Fms\Facades\FMS;

// Check if feature is accessible
if (FMS::canAccess('use-mcp')) {
    // Feature is enabled
}

// Check if user has feature
if (FMS::hasFeature('use-mcp', $user)) {
    // User has access
}

// Get remaining quantity for resource features
$remaining = FMS::remaining('ai-tokens', $user);
if ($remaining > 0) {
    // Allow action
}

// Get all enabled features
$enabled = FMS::enabled($user);
</code-snippet>

### Using Helper Functions

<code-snippet name="FMS Helper Functions" lang="php">
// Get feature manager or check feature
if (feature('use-mcp')) {
    // Feature is enabled
}

// Check feature access
if (can_access_feature('use-mcp', $user)) {
    // User has access
}

// Get remaining quantity
$remaining = feature_remaining('ai-tokens', $user);

// Get all enabled features
$enabled = enabled_features($user);
</code-snippet>

### Using Middleware

Protect routes with feature requirements:

<code-snippet name="FMS Middleware Protection" lang="php">
use ParticleAcademy\Fms\Http\Middleware\RequireFeature;

Route::middleware(['auth', RequireFeature::class . ':use-mcp'])->group(function () {
    Route::get('/mcp', [McpController::class, 'index']);
});

// Multiple features (OR logic - user needs at least one)
Route::middleware(['auth', RequireFeature::class . ':feature1,feature2'])->group(function () {
    // Route protected by feature1 OR feature2
});
</code-snippet>

### Using Gates/Policies

FMS automatically checks Laravel Gates if they exist:

<code-snippet name="FMS Gate Integration" lang="php">
// In AuthServiceProvider
Gate::define('use-mcp', function ($user) {
    return $user->subscription->plan === 'pro';
});

// FMS will automatically use this gate
if (FMS::canAccess('use-mcp')) {
    // Gate check passed
}
</code-snippet>

### Feature Registry

Register features programmatically:

<code-snippet name="FMS Feature Registry" lang="php">
use ParticleAcademy\Fms\Services\FmsFeatureRegistry;

app(FmsFeatureRegistry::class)->register('custom-feature', [
    'name' => 'Custom Feature',
    'type' => 'boolean',
    'enabled' => fn($user) => $user->hasPermission('custom'),
]);
</code-snippet>

### Access Control Strategy Order

FMS checks features in this order:

1. **Gates/Policies** - If a Gate exists with the feature name, it's checked first
2. **Feature Registry** - Checks registered features via `FmsFeatureRegistry`
3. **Config File** - Checks `config/fms.features.{feature}`
4. **Database** - If `FeatureUsage` model exists, checks database (extensible)

### Resource Features

Resource features support metered usage:

<code-snippet name="FMS Resource Features" lang="php">
'api-calls' => [
    'type' => 'resource',
    'limit' => 1000,
    'usage' => fn($user) => $user->apiCalls()->thisMonth()->count(),
    'remaining' => fn($user) => 1000 - $user->apiCalls()->thisMonth()->count(), // optional
],
</code-snippet>

### Best Practices

- Always check feature access before allowing actions that require features
- Use middleware for route-level protection
- Use Gates/Policies for complex authorization logic
- Use resource features for metered/usage-based features
- Register features programmatically when they need to be dynamic
- Keep feature definitions in config for static features

=== wishborn/fancy-flux rules ===

## Fancy Flux

Custom Flux UI components for Laravel Livewire applications. Provides enhanced carousel, color picker, and emoji select components that extend the base Flux UI library.

### Features

- **FANCY Facade**: Unified API for programmatic access to emoji lookup, carousel control, and configuration
- **Action Component**: Reusable button with standalone colors, behavioral states (active, checked, warn, alert), shape variants (default, circle), avatars, badges, flexible icon/emoji placement, and dark mode
- **Carousel Component**: Flexible carousel/slideshow with multiple variants (directional, wizard, thumbnail)
- **Color Picker Component**: Native color input with enhanced UI, swatch preview, and preset support
- **Emoji Select Component**: Composable emoji picker with category navigation, search, and customizable styling
- **Timeline Component**: Lightweight vertical timeline with stacked/alternating layouts, per-event colors, icons, emojis, and scroll-reveal animation

### Installation

```bash
composer require wishborn/fancy-flux
```

**Component Prefix Configuration:**

To avoid naming conflicts with official Flux components, you can configure a custom prefix:

```bash
php artisan vendor:publish --tag=fancy-flux-config
```

Set in `.env`:
```env
FANCY_FLUX_PREFIX=fancy
FANCY_FLUX_USE_FLUX_NAMESPACE=true
```

- **No prefix (default):** Components available as `<flux:carousel>`
- **With prefix:** Components available as `<fancy:carousel>` (and optionally `<flux:carousel>`)

### FANCY Facade

The `FANCY` facade provides unified access to FancyFlux features:

```php
// Emoji lookup
FANCY::emoji('fire');           // Returns: 🔥
FANCY::emoji()->list();         // Get all emoji slugs
FANCY::emoji()->find('rocket'); // Get emoji data
FANCY::emoji()->search('heart'); // Search emojis

// Carousel control
FANCY::carousel('wizard')->next();
FANCY::carousel('wizard')->goTo('step-3');
FANCY::carousel('dynamic')->refreshAndGoTo('new-slide');

// Configuration
FANCY::prefix();            // Custom prefix or null
FANCY::usesFluxNamespace(); // true/false
FANCY::components();        // List of components
```

### Action Component

A reusable button component with standalone colors, behavioral states, icons, emojis, avatars, badges, and flexible placement.

```blade
<!-- Default state -->
<flux:action>Default Action</flux:action>

<!-- Standalone colors (independent of states) -->
<flux:action color="blue">Blue</flux:action>
<flux:action color="emerald">Emerald</flux:action>
<flux:action color="red">Red</flux:action>
<flux:action color="violet">Violet</flux:action>

<!-- Behavioral states (use default colors when no color prop) -->
<flux:action active>Active (blue)</flux:action>
<flux:action checked>Checked (emerald)</flux:action>
<flux:action warn icon="exclamation-triangle">Warning (amber)</flux:action>
<flux:action alert alert-icon="bell">Alert (pulse)</flux:action>

<!-- Color + state (color wins, state adds behavior) -->
<flux:action color="red" alert>Red + Pulsing</flux:action>
```

**Shape Variants:**

```blade
<!-- Default (rounded rectangle) -->
<flux:action icon="pencil">Edit</flux:action>

<!-- Circle (perfect circle for icon-only) -->
<flux:action variant="circle" icon="play" />
<flux:action variant="circle" icon="pause" size="lg" />
<flux:action variant="circle" emoji="fire" color="red" />
```

**Avatar, Badge & Sort:**

```blade
<!-- Avatar support -->
<flux:action avatar="/img/user.jpg">John Doe</flux:action>
<flux:action avatar="/img/user.jpg" avatar-trailing>Profile</flux:action>

<!-- Badge support -->
<flux:action badge="3" icon="bell">Notifications</flux:action>
<flux:action badge="NEW" color="emerald">Featured</flux:action>

<!-- Sort order (e=emoji, i=icon, a=avatar, b=badge) -->
<flux:action icon="star" emoji="fire" badge="HOT" sort="bie">Custom Order</flux:action>
```

**Icon Placement Options:**

```blade
<!-- Icon on left (default) -->
<flux:action icon="pencil">Edit</flux:action>

<!-- Icon on right -->
<flux:action icon="arrow-right" icon-trailing>Next</flux:action>

<!-- Icon above text -->
<flux:action icon="cog" icon-place="top">Settings</flux:action>

<!-- Icon below text -->
<flux:action icon="info" icon-place="bottom">Info</flux:action>
```

**Emoji Support:**

```blade
<!-- Leading emoji -->
<flux:action emoji="fire">Hot!</flux:action>
<flux:action emoji="rocket" color="blue">Launch</flux:action>

<!-- Trailing emoji -->
<flux:action emoji-trailing="thumbs-up">Like</flux:action>

<!-- Combined emojis -->
<flux:action emoji="party-popper" emoji-trailing="sparkles">Celebrate</flux:action>
```

**Size Variants:**

```blade
<flux:action size="sm">Small</flux:action>
<flux:action size="md">Medium</flux:action>
<flux:action size="lg">Large</flux:action>
```

**Props Reference:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | string | 'default' | Shape: 'default' (rounded rectangle) or 'circle' |
| `color` | string | null | Standalone color: blue, emerald, amber, red, violet, indigo, sky, rose, orange, zinc |
| `active` | bool | false | Active/selected state (blue if no color) |
| `checked` | bool | false | Toggle/checkbox state (emerald if no color) |
| `warn` | bool | false | Warning state (light amber if no color) |
| `alert` | bool | false | Pulse animation effect (no color change) |
| `icon` | string | null | Heroicon name for main icon |
| `icon-color` | string | null | Custom icon color class |
| `icon-place` | string | 'left' | Icon position: left, right, top, bottom, over, under |
| `icon-trailing` | bool | false | Place icon on trailing side |
| `alert-icon` | string | null | Pulsing icon for alert state |
| `alert-icon-trailing` | bool | false | Pulsing icon on trailing side |
| `emoji` | string | null | Emoji slug for leading emoji |
| `emoji-trailing` | string | null | Emoji slug for trailing emoji |
| `avatar` | string | null | Image URL for circular avatar |
| `avatar-trailing` | bool | false | Place avatar on trailing side |
| `badge` | string | null | Badge text to display |
| `badge-trailing` | bool | false | Place badge on trailing side |
| `sort` | string | 'eiab' | Element order: e=emoji, i=icon, a=avatar, b=badge |
| `disabled` | bool | false | Disabled state |
| `size` | string | 'md' | Size: sm, md, lg |

### Carousel Component

The carousel component supports data-driven and slot-based usage patterns with multiple variants.

**Data-Driven (Simplest):**

```blade
@php
$slides = [
    ['name' => 'slide1', 'label' => 'First Slide', 'src' => '/images/slide1.jpg'],
    ['name' => 'slide2', 'label' => 'Second Slide', 'src' => '/images/slide2.jpg'],
];
@endphp

<flux:carousel :data="$slides" autoplay />
```

**Wizard Variant (Multi-Step Forms):**

```blade
<flux:carousel variant="wizard" :loop="false" name="wizard-form">
    <flux:carousel.tabs>
        <flux:carousel.tab name="account" label="Account" />
        <flux:carousel.tab name="profile" label="Profile" />
    </flux:carousel.tabs>
    
    <flux:carousel.panels>
        <flux:carousel.panel name="account">
            <!-- Form content -->
        </flux:carousel.panel>
    </flux:carousel.panels>
    
    <flux:carousel.controls wire:submit="submitWizard" />
</flux:carousel>
```

**Programmatic Navigation (FANCY Facade - Recommended):**

```php
class MyComponent extends Component
{
    public function goToStep(string $stepName): void
    {
        // Use FANCY facade (preferred)
        FANCY::carousel('my-carousel')->goTo($stepName);
    }
    
    public function advanceWizard(): void
    {
        FANCY::carousel('wizard')->next();
    }
}
```

**Legacy InteractsWithCarousel Trait:**

```php
use FancyFlux\Concerns\InteractsWithCarousel;

class MyComponent extends Component
{
    use InteractsWithCarousel;
    
    public function goToStep(string $stepName): void
    {
        // Trait delegates to FANCY facade internally
        $this->carousel('my-carousel')->goTo($stepName);
    }
}
```

**Nested Carousels:**

```blade
<flux:carousel variant="wizard" :loop="false" name="parent-wizard">
    <flux:carousel.panels>
        <flux:carousel.panel name="step1">
            <!-- Nested carousel -->
            <flux:carousel variant="wizard" name="nested-wizard" parentCarousel="parent-wizard">
                <!-- Nested content -->
            </flux:carousel>
        </flux:carousel.panel>
    </flux:carousel.panels>
</flux:carousel>
```

### Color Picker Component

Native color input with enhanced UI and preset support.

```blade
<flux:color-picker label="Primary Color" wire:model="primaryColor" />

<!-- With custom presets -->
<flux:color-picker 
    label="Brand Colors" 
    wire:model="brandColor"
    :presets="['3b82f6', '8b5cf6', 'ec4899']"
/>
```

### Emoji Component

Display emojis using slugs, classic emoticons, or raw characters - like `flux:icon` but for emoji.

```blade
<!-- From slugs -->
<flux:emoji name="fire" />           {{-- 🔥 --}}
<flux:emoji name="rocket" size="lg" />

<!-- From classic emoticons -->
<flux:emoji name=":)" />             {{-- 😊 --}}
<flux:emoji name=":D" />             {{-- 😃 --}}
<flux:emoji name="<3" />             {{-- ❤️ --}}

<!-- Dynamic usage -->
<flux:emoji :name="$selectedEmoji" size="xl" />
```

### Emoji Select Component

Composable emoji picker with category navigation and search.

```blade
<flux:emoji-select wire:model.live="selectedEmoji" />

<!-- Display the selected emoji -->
@if($selectedEmoji)
    <flux:emoji :name="$selectedEmoji" size="lg" />
@endif

<!-- With label and custom placeholder -->
<flux:emoji-select 
    wire:model.live="reactionEmoji" 
    label="Reaction" 
    placeholder="Choose reaction..." 
/>

<!-- In form groups -->
<flux:input.group>
    <flux:emoji-select wire:model.live="reactionEmoji" />
    <flux:input placeholder="Add a comment..." />
</flux:input.group>
```

### Timeline Component

Lightweight vertical timeline for displaying events. Pure Tailwind CSS + Alpine.js, no external dependencies.

```blade
{{-- Stacked (default) --}}
<flux:timeline :events="$events" />

{{-- Alternating layout --}}
<flux:timeline :events="$events" variant="alternating" />

{{-- With heading --}}
<flux:timeline :events="$events" heading="Our Journey" description="Key milestones." />
```

**Event Structure:**

```php
$events = [
    [
        'date' => 'March 2024',
        'title' => 'Series A',
        'description' => 'Raised $10M in funding.',
        'icon' => 'rocket-launch',   // Optional Heroicon
        'emoji' => '🚀',            // Optional emoji (alternative to icon)
        'color' => 'blue',          // Optional accent color
    ],
];
```

**Props Reference:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `events` | array | [] | Array of event objects |
| `variant` | string | 'stacked' | 'stacked' or 'alternating' |
| `heading` | string | null | Optional heading text |
| `description` | string | null | Optional description |
| `animated` | bool | true | Scroll-reveal animation |

### D3 Visualization Component

Advanced data visualizations powered by D3.js. Complements Flux Pro's `flux:chart` with force graphs, hierarchies, and flow diagrams.

```blade
{{-- Force-directed graph --}}
<flux:d3 type="force" :data="$networkData" :height="500" tooltip zoom />

{{-- Tree hierarchy --}}
<flux:d3 type="tree" :data="$orgChart" :height="400" />

{{-- Treemap --}}
<flux:d3 type="treemap" :data="$fileSystem" :height="300" tooltip />

{{-- Sunburst --}}
<flux:d3 type="sunburst" :data="$categories" :height="400" />
```

**Sparklines for Tables:**

```blade
<flux:d3.sparkline :data="[12, 15, 8, 22, 18, 25]" />
<flux:d3.sparkline :data="$trend" type="area" color="emerald" />
<flux:d3.sparkline :data="$values" type="bar" color="violet" />
<flux:d3.sparkline :data="[1, -1, 1, 1, -1]" type="win-loss" />
```

**Data Formats:**

```php
// Force graph
$networkData = [
    'nodes' => [['id' => 'A', 'label' => 'Node A', 'group' => 1], ...],
    'links' => [['source' => 'A', 'target' => 'B', 'value' => 1], ...],
];

// Hierarchy (tree, treemap, sunburst, pack)
$hierarchy = [
    'name' => 'root',
    'children' => [
        ['name' => 'child1', 'value' => 100],
        ['name' => 'child2', 'children' => [...]],
    ],
];
```

**Programmatic Control:**

```php
FANCY::d3('network')->update($newData);
FANCY::d3('network')->zoomToFit();
FANCY::d3('tree')->toggleNode('node-5');
FANCY::d3('graph')->highlight(['A', 'B']);
```

### Key Conventions

- **FANCY Facade**: Use `FANCY::` for emoji lookup (supports slugs AND emoticons like `:)`), carousel control, and configuration access
- **Component Namespace**: Components use the `flux:` namespace by default. If `FANCY_FLUX_PREFIX` is configured, components are also available with that prefix.
- **Livewire Integration**: Components work seamlessly with wire:model and wire:submit
- **Unique Names**: When using multiple carousels, always provide unique name props
- **Nested Carousels**: Use parentCarousel prop to link nested carousels to their parent
- **Programmatic Control**: Use `FANCY::carousel('name')` (preferred) or traits
- **Emoji Slugs**: Use kebab-case slugs like 'fire', 'thumbs-up', 'red-heart' for emojis
- **Prefix Configuration**: Use a custom prefix to avoid conflicts with official Flux components

### Documentation

- Full documentation: See docs/ folder in package
- Demos: See demos/ folder for ready-to-use examples
- Usage guide: See USAGE.md in package root

</laravel-boost-guidelines>
