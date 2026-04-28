# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo sandbox** for developing and prototyping Particle Academy packages. The root is a Laravel 12 application that consumes local packages via Composer path repositories and git submodules, providing a live environment to build, test, and demo everything together.

Packages symlinked via Composer path repos:
- `packages/laravel-catalog/` - **Primary**: Stripe catalog management (Products, Prices) with optional admin UI
- `packages/laravel-fms/` - Feature Management System (FMS) - dependency of Catalog
- `packages/fancy-flux/` - Blade UI component library (git submodule, repo: wishborn/fancy)
- `packages/react-fancy/` - React UI component library (git submodule)
- `packages/react-echarts/` - React ECharts component library (git submodule, npm: `@particle-academy/fancy-echarts`)
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
- Each package under `packages/*` is its own git submodule with its own remote on `Particle-Academy/<repo>`. Doc/code changes inside a submodule require: commit in the submodule → push the submodule → then a separate commit in the root repo bumping the submodule pointer.

## Publishing Releases

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
