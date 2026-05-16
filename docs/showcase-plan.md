# Fancy UI Showcase — architectural plan

The `pa-ux-sandbox` repository is being repurposed from "dev sandbox" into
the **public-facing Fancy UI showcase site**. This document is the running
plan; phases can run in parallel where they don't depend on each other.

## Goals

1. **Showcase** every Fancy UI package with browsable demos for each
   component.
2. Ship **Starter Kits** — full-app demos built from Fancy UI pieces.
3. **Dreaming section** — speculative components users can vote on (GitHub
   login required) with auto-archival of components that net negative.
4. **Leaderboard** — contributors ranked by PRs merged across submodules +
   votes cast.
5. **Designer Showcase** — users submit websites or repos that use Fancy
   UI; we scan to verify before listing.

Browsing is anonymous. **Every write action requires GitHub login.**

## Site map

```
/                                    Home / hero / featured starter kits
/packages                            All packages grid
/packages/{package}                  Per-package overview + component grid
/packages/{package}/{component}      Per-component live demo + props + usage
/starter-kits                        Starter-kit list
/starter-kits/{slug}                 One starter kit (running embedded app)
/dreaming                            Active dreams, with voting (auth-only)
/dreaming/archived                   Archived dreams (read-only, for posterity)
/leaderboard                         Top contributors (PRs + votes)
/showcase                            User-submitted sites/repos using Fancy UI
/showcase/submit                     Submission form (auth-only)
/auth/github                         OAuth start
/auth/github/callback                OAuth callback
/auth/logout                         Sign out
```

## Phases

### Phase 1 — Foundation (this turn)
- Laravel Socialite for GitHub OAuth
- Migrations: add `github_id`, `github_username`, `avatar_url` to `users`;
  create `votes`, `showcase_submissions`, `dream_archives`,
  `leaderboard_snapshots`
- Base Blade layout with site nav + GitHub-login affordance
- Stubbed pages at every route in the site map so navigation works
- README of what each stub will become

### Phase 2 — Package + component pages
- A registry (PHP or JSON) of every package + its components + a slug + a
  React mount-point for the live demo
- `/packages` grid + `/packages/{package}` per-package page
- `/packages/{package}/{component}` page with: live demo, props table,
  usage snippet (consumer-side import + bridge sketch)
- Source for the demos comes from each package's `src/components/*/`
  (compile-time scan)

### Phase 3 — Dreaming (public mode)
- Move dreaming UI from the dev `/dreaming` page into a public route at
  `/dreaming` (the old dev page stays on the `dreaming` branch where it
  belongs)
- DB-backed voting (auth required)
- Auto-archive on net-negative score
- Preserve current voting state: on first authenticated visit, the client
  uploads any localStorage votes under `dreaming.votes.v1` and they're
  attributed to the user

### Phase 4 — Leaderboard
- GitHub API job that nightly pulls merged-PR counts per author across
  every `Particle-Academy/*` submodule repo
- Cache snapshots in `leaderboard_snapshots` so we don't hit the rate
  limit on every page view
- Vote count joins from `votes` table
- `/leaderboard` renders a top-50 table with PR + vote columns

### Phase 5 — Designer Showcase
- Submission form: URL (website) or repo (`owner/name` or full GitHub URL)
- Queued scan job:
  - For a website: fetch homepage, look for `@particle-academy/*` chunk
    names in script tags or hashed bundle names containing component
    identifiers
  - For a repo: fetch raw `package.json` / `composer.json` from
    `main`/`master`, check for `@particle-academy/*` or
    `particle-academy/*` deps
- Submissions land as `pending` → `verified` / `rejected` based on scan
- `/showcase` lists `verified` submissions

### Phase 6 — Merge to dreaming
- Once the main showcase is shipping, fast-forward (or merge) the
  showcase work into the `dreaming` branch
- Configure the dreaming branch's `composer.json` + `package.json` to
  point each submodule at its own `dreaming` branch (where present)
- The dreaming-branch deploy serves a parallel preview environment so
  contributors can see in-flight work from every Fancy UI package
  together

## Required external setup (user must do)

1. **Create a GitHub OAuth App** at <https://github.com/settings/applications/new>:
   - Homepage URL: `https://particle.academy` (or local dev URL)
   - Authorization callback URL: `https://<host>/auth/github/callback`
   - Note the **Client ID** and generate a **Client Secret**
2. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=…
   GITHUB_CLIENT_SECRET=…
   GITHUB_REDIRECT_URI=http://laravel-catalog.test/auth/github/callback
   ```
3. (Phase 4/5) Generate a fine-grained GitHub PAT with **public repo
   metadata** scope for the leaderboard cron and showcase scanner; add as
   `GITHUB_API_TOKEN=…`. Without this we share the unauthenticated
   60 req/hour limit and the leaderboard breaks.

## Open decisions

These were defaulted; flag back if you want them changed.

- **Auth provider:** Laravel Socialite (the de-facto Laravel pattern;
  zero token-handling in our code).
- **Scan strategy v1:** dependency-file parsing only (`package.json` +
  `composer.json`). HTML-bundle sniffing is a v2 add-on if false
  negatives hurt.
- **Voting unit:** one vote per user per dream, value `+1` / `-1`. No
  weighting.
- **Archive threshold:** dream auto-archives when `down > up` AND total
  votes ≥ 3. The "min 3" prevents a single grumpy login from auto-killing
  a fresh dream.
- **Leaderboard granularity:** all-time + last-30-days tabs.
