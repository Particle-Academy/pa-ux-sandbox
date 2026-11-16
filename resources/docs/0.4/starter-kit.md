The fastest way to start a **new** Laravel app on Fancy UI. It's a real Laravel community starter kit — installed with `laravel new --using=` — so you get a complete, running app shell (Inertia + React 19 + Tailwind v4 + Fortify auth) with **Fancy Core already wired**, not a pile of snippets to assemble yourself.

Use it for greenfield apps. To add Fancy UI to an app you **already** have, see [Installation](/docs/installation) instead.

## Create a new app

```bash
laravel new my-app --using=particle-academy/fancy-starter-kit
cd my-app
npm install && npm run build
composer run dev
```

Open the URL Laravel prints and you land on a Fancy-branded welcome page with jump-off points into your new app. (No `laravel` command yet? `composer global require laravel/installer`.)

## What's wired for you

- **Laravel 13** (`type: project`) + **Inertia** + **React 19 + TypeScript + Tailwind v4 + Vite**
- **Fancy Core** — [`react-fancy`](/packages/react-fancy), [`fancy-inertia`](/packages/fancy-inertia) (the `setupFancyApp` client entry), [`fancy-query`](/packages/fancy-query)
- **Fortify auth, every page built on Fancy UI** — login, register, forgot / reset password, a protected dashboard, and profile / password settings, each rendered as an Inertia page from Fancy primitives
- **A branded welcome page** whose cards link out to the docs, the [component browser](/packages), the [design gallery](/gallery), and "add a page" — your starting points

## Project structure

```
resources/js/
├── app.tsx                 # client entry — setupFancyApp + providers
├── ssr.tsx                 # SSR entry (createFancyServer) — off by default
├── layouts/                # AuthLayout, AppLayout, SettingsLayout
└── Pages/
    ├── Welcome.tsx         # the branded welcome (guest)
    ├── Dashboard.tsx       # authenticated home
    ├── auth/               # Login, Register, ForgotPassword, ResetPassword
    └── settings/           # Profile, Password
```

Everything is yours to edit — it's a generated app, not a dependency you import.

## Add components as you grow

Vendor any Fancy primitive — or a whole block — straight into the app with the CLI:

```bash
npx fancy-cli@latest add data-table     # one primitive
npx fancy-cli@latest add catalog-fms      # a full block (pricing, feature gating, …)
```

Browse the full catalog under [Packages](/packages), or drive it from an agent with the [fancy-ui MCP](/docs/mcp). Full reference: [CLI](/docs/cli).

## Auth (Fortify)

Authentication is [Laravel Fortify](https://laravel.com/docs/fortify). Tune features in `config/fortify.php` and the create / reset logic in `app/Actions/Fortify/`. Two-factor auth ships **off** — re-enable it in `config/fortify.php` (it needs the `two_factor_*` columns and the `TwoFactorAuthenticatable` trait on `App\Models\User`).

## SSR

Inertia SSR is **wired but off by default** — a fresh install renders client-side. `resources/js/ssr.tsx` renders each page inside the *same* Fancy provider tree as `app.tsx`, and `npm run build` already emits both the client and SSR (`bootstrap/ssr/ssr.js`) bundles. To turn it on:

1. set `INERTIA_SSR_ENABLED=true` in `.env`
2. `npm run build`
3. `php artisan inertia:start-ssr` (keep it running alongside your app)

Inertia falls back to client rendering whenever the SSR daemon isn't reachable, so leaving SSR off — or forgetting to start the daemon — never breaks the app. More on rendering + meta: [SEO & SSR](/docs/seo).

## Next steps

- Set your brand tokens — [Theming](/docs/theming)
- Add a layout / app shell — [Layouts & app shell](/docs/layouts)
- Animate navigation — [Page transitions](/docs/page-transitions)
- Make your surfaces agent-driveable — [MCP servers](/docs/mcp)
- Adding Fancy to an *existing* app instead? — [Installation](/docs/installation)
