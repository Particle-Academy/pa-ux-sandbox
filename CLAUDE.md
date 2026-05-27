# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Human+ UX — the architectural framework

**This is the architectural baseline for the entire sandbox and every package it contains** — react-fancy, fancy-whiteboard, fancy-flow, fancy-sheets, fancy-code, fancy-echarts, fancy-screens, fancy-3d, agent-integrations, plus anything new. It is not a feature, a goal, or a roadmap item; it is the prerequisite that decides whether a component, demo, or package belongs here at all. Speculative work on the `dreaming` branch must satisfy it too.

**Every Fancy UI component must satisfy two design constraints, not one:**

1. **Authoring surface.** Humans and agents can rapidly compose beautiful, well-functioning applications using the component. Terse props, JSON-friendly inputs, sensible defaults, good types.

2. **Inhabited surface.** The running app embeds agents as first-class environment participants. Agents read and write component state via MCP bridges and stable handles — *not* via DOM screen-scraping, Playwright, or other puppeting tools. The component itself is the agent's affordance, not a target to be operated externally.

This is **Human+ UX**: applications where humans and agents share the same UI, trading control fluidly. The whitepaper is at [`docs/human-plus-ux.md`](./docs/human-plus-ux.md).

**The component contract** (every Fancy UI component must meet all of these):
- **Controlled state.** `value` + `onChange`. No internal-only state for anything an agent might want to read or write.
- **Stable handles.** Each interactive element gets a stable identity (`id`, `data-*`, or a selector function in props). Agents should never have to guess DOM structure.
- **JSON-friendly inputs.** Props that are agent-emittable: arrays of objects, primitives, simple discriminated unions. Avoid forcing React children for things the agent needs to populate.
- **Bridgeable surface.** For non-trivial components, a `register<Surface>Bridge(server, { adapter })` exists or could be sketched in one sitting. The bridge exposes MCP tools (`grid_paint`, `chip_reclassify`, `tray_dismiss`) so agents can drive it. If you can't sketch this, the component isn't done.
- **Observable activity.** Mutations broadcast `AgentActivity` events so presence, undo, and coaching layers compose without each component re-implementing them.
- **Trust-but-verify hooks.** Destructive or human-visible actions support a `pendingMode` / staged-write affordance — agents propose, humans confirm.

If a component is purely visual (a static label, a divider, a layout shell), only constraint #1 applies. Anything stateful or interactive owes both.

## Project Overview

This is the **Fancy UI showcase site** — a Laravel 13 + Vite + React 19 + Inertia + Tailwind v4 app that consumes the Fancy UI package suite. It lives in the flat `fancy-ui/` workspace alongside each package as an independent sibling. See `../CLAUDE.md` for workspace-wide rules; this file covers sandbox-specific guidance.

**No submodules. No Composer path repos. No Flux.**

**PHP packages** come from Packagist (declared in `composer.json`):
- `particle-academy/laravel-catalog` — Stripe catalog (Products, Prices) with optional admin UI
- `particle-academy/laravel-fms` — Feature Management System; dependency of Catalog
- `particle-academy/holy-sheet` — xlsx writer used by the AI sheets demo
- `particle-academy/dark-slide` — pptx writer/reader

**JS/TS packages** are installed from npm like in any other consumer app. There are **no Vite aliases pointing at sibling source** — that means the local build is byte-for-byte the same as Forge's, but it also means a package change isn't visible in the showcase until the package is shipped (bump → tag → push → wait for CI publish → `npm update @particle-academy/<pkg>`). For tight iteration on a single package, `cd ../<pkg> && npm run dev` (or `tsup --watch`) drives that package's own demos in isolation.

The installed packages:
- `@particle-academy/react-fancy` — core React component library (stays raw React)
- `@particle-academy/fancy-3d` (+ `/dom`, `/babylon`, `/react`) — UI kit for humans + agents to author data-driven 3D apps: engine-agnostic `Scene` types + adapters + shape primitives + 3D-native components like `Screen`. The bridge to 3D engines lives here, not in react-fancy.
- `@particle-academy/fancy-echarts` — ECharts wrapper
- `@particle-academy/fancy-code` — embedded code editor
- `@particle-academy/fancy-sheets` — spreadsheet workbook
- `@particle-academy/fancy-flow` (+ `/runtime`) — React Flow workflow editor
- `@particle-academy/fancy-slides` (+ `/registry`) — presentation editor + viewer
- `@particle-academy/fancy-screens` — screen registry + cross-screen presence (consumers bring their own Zustand store)
- `@particle-academy/fancy-whiteboard` — collaborative whiteboard canvas
- `@particle-academy/fancy-inertia` — Inertia.js bridge for Laravel hosts (showcase chrome)
- `@particle-academy/fancy-tsrx` — typed-result React spike (pilot only, 3 components)
- `@particle-academy/agent-integrations` (+ `/mcp`, `/bridges/*`, `/components/*`) — MCP server + per-package bridges

## Common Commands

### Development
```bash
composer run dev          # Starts server, queue, logs (pail), and Vite concurrently
composer run setup        # Full setup: install, env, key, migrate, npm
reload                    # Clear cache + npm run build (custom shortcut)
```

### Building

**`npm run build` is just `vite build`** — there are no special workspace tricks. Vite resolves every `@particle-academy/*` import from `node_modules` against the versions pinned in `package.json` + `package-lock.json`. Same shape locally and on Forge. To pick up a package release, `npm update @particle-academy/<pkg>` first.

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

### Package: laravel-catalog (Packagist)

Namespace: `LaravelCatalog\`

**Core pattern**: The `CatalogManager` class is the central API, accessed via the `Catalog` facade. It delegates to two services:
- `StripeCatalogService` - Syncs Products/Prices to Stripe
- `StripeCheckoutService` - Creates Stripe Checkout sessions (subscription and one-time)

**Key concept**: Plans are Products with recurring Prices -- there is no separate Plan model. Every Product must have at least one Price before syncing to Stripe.

**Models**: `Product`, `Price`, `ProductFeature` (for FMS integration)

**Optional UI**: The admin UI (`Admin\Products\Index`) only loads when `catalog.enable_ui` config is true or views have been published.

**Service Provider** (`CatalogServiceProvider`): Auto-loads Cashier migrations, registers UI components conditionally, configures FMS to use Catalog's `ProductFeature` model.

**Config**: `config/catalog.php` controls auto-sync, queue connection, admin routes/middleware, broadcasting channel.

### Package: laravel-fms (Packagist)

Namespace: `ParticleAcademy\Fms\`

Feature access control with multiple strategies checked in order: Gates/Policies -> Feature Registry -> Config -> Database. Supports boolean and resource (metered) feature types.

### Demo App (root)

The root Laravel app has controllers in `app/Http/Controllers/Admin/` and `app/Http/Controllers/` that exercise both packages. Tests live in `tests/Feature/Catalog/` and `tests/Feature/Integration/`.

### Holy Sheet AI agent demo (`/ai-sheets`)

Live demo of holy-sheet's tool-use surface driven by the Laravel AI SDK (`laravel/ai`). Lives at:
- `app/Ai/Agents/HolySheetAgent.php` — Anthropic-backed agent with system prompt + 3 tools
- `app/Ai/Tools/{BuildSpreadsheetSchema, WriteSpreadsheet, DescribeSpreadsheet}.php` — wrap `HolySheet\Agent::fromArray`, `validateAndRepair`, `write`, `describe`
- `resources/views/components/⚡ai-sheets.blade.php` — view at `Route::get('/ai-sheets', ...)`

Generated xlsx artifacts land in `storage/app/public/ai-sheets/` and are served via the public disk (`php artisan storage:link` is required, run during setup). Requires `ANTHROPIC_API_KEY` in `.env`. The default AI provider is configured via `AI_DEFAULT_PROVIDER` (defaults to `anthropic`).

## Building agent-driveable surfaces (Human+ UX)

The Fancy UI strategic goal is **complete app surfaces where agents drive the UI and humans ride shotgun, trading control fluidly**. Two packages are the top-level entry points:

- **`@particle-academy/agent-integrations`** — MCP server, presence layer, share relay, and per-package bridges (`registerWhiteboardBridge`, `registerFlowBridge`, `registerFormBridge`, `registerSheetsBridge`, `registerCodeBridge`, `registerChartsBridge`, `registerSceneBridge`).
- **`@particle-academy/fancy-screens`** — `<Screen>` containers + global `<ScreenSystem>` + ports + `ScreenMeta.agentActivity` field for cross-screen presence.

**Pattern for adding a new surface to the Human+ UX vocabulary:**

1. **Make the underlying component controlled** (`value` + `onChange` props). Most fancy-* packages already are.
2. **Write a bridge** in `agent-integrations/src/bridges/<surface>.ts` following the existing pattern:
   - `XBridgeAdapter` type — host-provided getters + setters for the surface's state
   - `registerXBridge(server, { adapter, agent })` — registers MCP tools
   - Inside, use `wrapToolWithActivity` so every mutation broadcasts an `AgentActivity` event
   - Read tools (no mutation): pass `false`/no resolver to `reg`. Mutation tools: pass a `resolveTarget` so the presence layer knows which element was touched.
   - Push undo entries via `pushUndoEntry(agentId, { ... })` after the mutation lands. Reverse-action closures should call the inverse bridge tool.
   - Call `ensureUndoToolsRegistered(server)` at the top of `register*Bridge` so `agent_undo` / `agent_redo` / `agent_history` are installed.
3. **Wire screen presence** — set `screenId` on the bridge adapter; mount `<ScreensActivityBridge system={system} />` once near the root so events flow into `ScreenMeta.agentActivity` and the screen's `<Screen>` div picks up the `.agent-focused-element` class automatically.
4. **Register bridge tools' deep import** in `agent-integrations/src/index.ts` and `tsup.config.ts` (one new entry per bridge file).
5. **Add a sandbox demo page** under `resources/js/react-demos/pages/` mounting the surface + bridge + share controls. Reuse `WhiteboardSharedDemo.tsx` / `WorkflowAgentDemo.tsx` / `HumanPlusDemo.tsx` as templates.

**Existing surfaces / tool prefixes:**

| Bridge | Tool prefix | Surface |
|---|---|---|
| `whiteboard` | `whiteboard_*` | fancy-whiteboard `<Board>` + items |
| `flow` | `flow_*` | fancy-flow `<FlowEditor>` |
| `form` | `form_*` | any controlled react-fancy form (use `<BridgedForm>`) |
| `sheets` | `sheet_*` | fancy-sheets `<SheetWorkbook>` |
| `code` | `code_*` | fancy-code `<CodeEditor>` |
| `charts` | `chart_*` | fancy-echarts `<EChart>` |
| `scene` | `scene_*` | fancy-3d Scene primitives |
| (cross-cutting) | `agent_undo` / `agent_redo` / `agent_history` | per-agent undo stack |

**Relay infrastructure** lives at `app/Http/Controllers/WhiteboardShareController.php` (the name is historical — it carries any MCP frames now, not just whiteboard). Routes in `routes/web.php` under `/whiteboard-share/*`. CSRF-exempt for external clients via `bootstrap/app.php`.

**Demos:** `/react-demos/whiteboard-shared` (whiteboard only), `/react-demos/workflow-agent` (fancy-flow), `/react-demos/human-plus` (full Human+ UX with all bridges).

## Conventions

- **PHP**: Always use curly braces for control structures. Use constructor property promotion. Explicit return types and type hints on all methods. PHPDoc blocks over inline comments.
- **Tailwind v4**: CSS-first config via `@theme` directive. Use `@import "tailwindcss"` not `@tailwind` directives. No deprecated opacity utilities.
- **Tests**: All Pest. Feature tests preferred over unit tests. Use factories and their states. Use datasets for validation testing.
- **Enums**: TitleCase keys (e.g., `Monthly`, `FavoritePerson`).
- **Database**: Prefer `Model::query()` over `DB::`. Use eager loading to prevent N+1. Use Eloquent relationships over raw queries.
- **Config access**: Always `config('key')`, never `env()` outside config files.
- **Validation**: Use Form Request classes, not inline validation.

## Git Rules

- **No submodules anywhere in the workspace.** Each sibling package (`../react-fancy`, `../fancy-3d`, …) is its own independent git repo with its own remote. Edit packages in their own folders; the sandbox sees changes only after they're shipped to npm.
- **NEVER use `git add -A` or `git add .`**. Always stage specific files by name. This workspace has untracked experiments, secrets, and files that must not be blindly committed.
- **NEVER `git push` unless the user explicitly asks.** Commit locally is fine.
- Before every commit, review changes with `git diff --stat` or `git status`, then `git add <specific files>`.

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

### React / TS packages

The `fancy-echarts` package is published from the `Particle-Academy/react-echarts` git repo (folder/repo name unchanged; only the npm package was renamed). The npm trusted-publisher config on npmjs.com must be set up under `@particle-academy/fancy-echarts` pointing to `Particle-Academy/react-echarts` + `publish.yml`.

Each TS package publishes to npm via **GitHub Actions Trusted Publishing (OIDC)**. No tokens, no manual `npm publish`. The workflow lives at `.github/workflows/publish.yml` inside each repo and fires on tag push `v*.*.*` (or manual `workflow_dispatch`).

To ship a new version of a TS package:

1. `cd ../<name>`
2. Bump `version` in `package.json`
3. Commit the bump
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. CI builds, signs provenance via OIDC, and publishes to npm — usually under 1 minute

Verify with: `npm view @particle-academy/<name> version`

**No submodule-pointer bump anywhere.** The sandbox aliases packages at dev time and pulls them from npm at install time. To force the sandbox to pick up a freshly published version, `cd px-ui-sandbox && npm update @particle-academy/<name>` (rare during dev — usually only when freezing a deploy).

**Hard requirements for the publish to succeed** (don't remove these from `package.json`):
- `repository.url` set to `git+https://github.com/Particle-Academy/<name>.git` — npm's provenance check rejects publish if this is empty or doesn't match the OIDC source
- `homepage` and `bugs` URLs (recommended for the npmjs page)
- `files` array includes `dist`, `docs`, `README.md` (so the published tarball ships docs)

**Workflow gotchas already solved (don't re-introduce)**:
- The bundled npm in `actions/setup-node@v4 (node 22)` is npm 10 — Trusted Publishing OIDC requires npm 11.5+. The workflow uses `npx -y npm@latest publish --provenance --access public` instead of `npm install -g npm@latest` (which fails with `MODULE_NOT_FOUND: promise-retry` due to a self-replacement bug).
- `fancy-code` and `fancy-sheets` declare `@particle-academy/react-fancy` as a peer dep. If any `workspace:*` ranges sneak back into a package, the workflow rewrites them to plain version ranges before `npm install`.

If a tag was pushed before the workflow file existed on that commit (or you need to re-trigger), move the tag forward and force-push: `git tag -d vX.Y.Z && git tag vX.Y.Z && git push origin vX.Y.Z --force`. (Safe because the tag hasn't been consumed by npm yet.)

If the Trusted Publisher config on npmjs.com is wrong or missing, publish fails with `404 Not Found - PUT .../<package> - Not found`. Fix at `https://www.npmjs.com/package/@particle-academy/<name>/access`.

### PHP packages (`laravel-catalog`, `laravel-fms`, `holy-sheet`, `dark-slide`)

PHP packages publish via Packagist auto-sync from GitHub. To ship:

1. `cd ../<name>`
2. Bump `"version"` in `composer.json`
3. Commit the bump (`git add composer.json && git commit -m "chore: release vX.Y.Z"`)
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. Packagist auto-syncs (manual trigger available at `https://packagist.org/packages/particle-academy/<name>`)
6. To pull into the sandbox: `composer update particle-academy/<name>`

### "Ship it" = full publish flow, not just a branch push

When the user says **ship** for any package, the flow is always: bump version → commit → tag → push tag → wait for CI (React) or Packagist (PHP) → update the consumer dep in `px-ui-sandbox` if needed. Pushing `main` alone is _not_ shipping — consumers installing via npm/composer see nothing until the tag+publish step runs.

Confirm the publish landed before updating the sandbox:

```bash
gh run list --limit 1                              # CI status (React)
npm view @particle-academy/<name> version          # live on npm
composer show particle-academy/<name>              # for PHP packages
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
- **Optional Admin UI**: Admin interface (optional, requires publishing)
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

</laravel-boost-guidelines>

## BOTS -- Bolt-On Taskmaster System

> **IMPORTANT:** Read `.bots/AGENTS.md` before dispatching workers or processing shortcodes. It contains worker domains, enforced chains, gate types, team mode instructions, and output directory rules.

**Shortcodes** (queue work from any prompt):
```
w:> <task description>    Queue background work
n:> <frame topic>         Set next frame after current work
```

**Quick CLI:**
```
npm run tm status          Active jobs
npm run tm jobs            All jobs
npm run tm approve <id>    Approve checkpoint
```

Full reference: `.bots/AGENTS.md`
