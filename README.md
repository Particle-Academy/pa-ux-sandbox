# Fancy UI — Showcase

A Laravel 13 + Vite + React 19 + Inertia + Tailwind v4 app that consumes the Fancy UI package suite. Lives in the flat `fancy-ui/` workspace alongside each package as an independent sibling.

## Packages

PHP packages (Packagist):

| Package | Registry |
|---------|----------|
| **laravel-catalog** | [Packagist](https://packagist.org/packages/particle-academy/laravel-catalog) |
| **laravel-fms** | [Packagist](https://packagist.org/packages/particle-academy/laravel-fms) |
| **holy-sheet** | [Packagist](https://packagist.org/packages/particle-academy/holy-sheet) |
| **dark-slide** | [Packagist](https://packagist.org/packages/particle-academy/dark-slide) |

JS/TS packages (npm; sources aliased at dev time via `vite.config.js`):

| Package | Registry |
|---------|----------|
| **react-fancy** | [npm](https://www.npmjs.com/package/@particle-academy/react-fancy) |
| **fancy-3d** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-3d) |
| **fancy-echarts** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-echarts) |
| **fancy-code** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-code) |
| **fancy-sheets** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-sheets) |
| **fancy-flow** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-flow) |
| **fancy-slides** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-slides) |
| **fancy-screens** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-screens) |
| **fancy-whiteboard** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-whiteboard) |
| **fancy-inertia** | [npm](https://www.npmjs.com/package/@particle-academy/fancy-inertia) |
| **agent-integrations** | [npm](https://www.npmjs.com/package/@particle-academy/agent-integrations) |

No submodules. No Composer path repos. The sandbox sees package source changes immediately via Vite aliases; published versions only matter for external consumers.

## Setup

```bash
composer run setup    # install, env, key, migrate, npm install
```

## Development

```bash
composer run dev      # Starts server, queue, logs (pail), and Vite concurrently
```

Showcase routes are served by Inertia + React from `resources/js/`. The `/react-demos` page exercises every fancy-* package's components.

## Testing

```bash
php artisan test --compact                            # All tests
php artisan test --compact tests/Feature/Catalog/     # Catalog tests
php artisan test --compact --filter=testName         # Single test
```

Tests use Pest with SQLite in-memory and `RefreshDatabase`.

## Code Formatting

```bash
vendor/bin/pint --dirty   # Format changed files
vendor/bin/pint           # Format all
```

## Working on a sibling package

Edit files in `../<package-name>/src/` — the sandbox reloads on save. To ship a release, follow the per-package CLAUDE.md flow (bump → commit → tag → push → CI publishes via OIDC).
