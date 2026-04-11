# Particle Academy — Package Sandbox

A Laravel 12 monorepo for developing and prototyping Particle Academy packages. The root app consumes local packages via Composer path repositories and git submodules, providing a live environment to build, test, and demo everything together.

## Packages

| Package | Type | Path | Registry |
|---------|------|------|----------|
| **laravel-catalog** | PHP (Composer) | `packages/laravel-catalog/` | [Packagist](https://packagist.org/packages/particle-academy/laravel-catalog) |
| **laravel-fms** | PHP (Composer) | `packages/laravel-fms/` | [Packagist](https://packagist.org/packages/particle-academy/laravel-fms) |
| **fancy-flux** | PHP (Composer) | `packages/fancy-flux/` | [Packagist](https://packagist.org/packages/wishborn/fancy-flux) |
| **react-fancy** | React (npm) | `packages/react-fancy/` | [npm](https://www.npmjs.com/package/@particle-academy/react-fancy) |
| **react-echarts** | React (npm) | `packages/react-echarts/` | [npm](https://www.npmjs.com/package/@particle-academy/react-echarts) |
| **fancy-code** | React (npm) | `packages/fancy-code/` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-code) |
| **fancy-sheets** | React (npm) | `packages/fancy-sheets/` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-sheets) |

All packages are git submodules with their own repositories.

## Setup

```bash
git clone --recurse-submodules <repo-url>
composer run setup    # install, env, key, migrate, npm install
```

If you already cloned without `--recurse-submodules`:

```bash
git submodule update --init --recursive
```

## Development

```bash
composer run dev      # Starts server, queue, logs (pail), and Vite concurrently
```

The app includes two demo surfaces:

- **Livewire demos** at `/ux-demos` — Blade/Livewire components from `fancy-flux`
- **React demos** at `/react-demos` — React components from `react-fancy`, `react-echarts`, `fancy-code`, and `fancy-sheets`

## Testing

```bash
php artisan test --compact                            # All tests
php artisan test --compact tests/Feature/Catalog/     # Catalog tests
php artisan test --compact --filter=testName           # Single test
```

Tests use Pest with SQLite in-memory and `RefreshDatabase`.

## Code Formatting

```bash
vendor/bin/pint --dirty   # Format changed files
vendor/bin/pint           # Format all
```

## Submodule Workflow

Each package is an independent repo. To work on a package:

```bash
cd packages/<package-name>
# make changes, commit, push, tag
git tag v1.x.x
git push origin main --tags
```

After committing inside a submodule, update the pointer in the root repo:

```bash
cd ../..
git add packages/<package-name>
git commit -m "Update <package-name> to v1.x.x"
```
