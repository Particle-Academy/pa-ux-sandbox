# Publishing Releases

Runbook for shipping Fancy UI packages. Consulted occasionally, not
every turn — kept out of `CLAUDE.md` deliberately. The one-line rule
lives there; the full procedure lives here.

## "Ship it" = full publish flow, not just a branch push

When the user says **ship** for any package: bump version → commit →
tag → push tag → wait for CI (React) or Packagist (PHP) → update the
consumer dep in `px-ui-sandbox` if needed. Pushing `main` alone is _not_
shipping — consumers installing via npm/composer see nothing until the
tag+publish step runs.

Confirm the publish landed before updating the sandbox:

```bash
gh run list --limit 1                              # CI status (React)
npm view @particle-academy/<name> version          # live on npm
composer show particle-academy/<name>              # for PHP packages
```

## Bootstrapping a brand-new package (one-time)

**Claude can't fill the npm Trusted Publisher form** — modifying npm
account access controls is outside what I can do, even with explicit
permission. This is a one-time manual step per package. The process
below is the path of least friction; follow it once and every
subsequent release ships via OIDC with zero token handling.

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

## React / TS packages

The `fancy-echarts` package is published from the
`Particle-Academy/react-echarts` git repo (folder/repo name unchanged;
only the npm package was renamed). The npm trusted-publisher config on
npmjs.com must be set up under `@particle-academy/fancy-echarts`
pointing to `Particle-Academy/react-echarts` + `publish.yml`.

Each TS package publishes to npm via **GitHub Actions Trusted
Publishing (OIDC)**. No tokens, no manual `npm publish`. The workflow
lives at `.github/workflows/publish.yml` inside each repo and fires on
tag push `v*.*.*` (or manual `workflow_dispatch`).

To ship a new version of a TS package:

1. `cd ../<name>`
2. Bump `version` in `package.json`
3. Commit the bump
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. CI builds, signs provenance via OIDC, and publishes to npm — usually under 1 minute

Verify with: `npm view @particle-academy/<name> version`

**Hard requirements for the publish to succeed** (don't remove these from `package.json`):
- `repository.url` set to `git+https://github.com/Particle-Academy/<name>.git` — npm's provenance check rejects publish if this is empty or doesn't match the OIDC source
- `homepage` and `bugs` URLs (recommended for the npmjs page)
- `files` array includes `dist`, `docs`, `README.md` (so the published tarball ships docs)

**Workflow gotchas already solved (don't re-introduce)**:
- The bundled npm in `actions/setup-node@v4 (node 22)` is npm 10 — Trusted Publishing OIDC requires npm 11.5+. The workflow uses `npx -y npm@latest publish --provenance --access public` instead of `npm install -g npm@latest` (which fails with `MODULE_NOT_FOUND: promise-retry` due to a self-replacement bug).
- `fancy-code` and `fancy-sheets` declare `@particle-academy/react-fancy` as a peer dep. If any `workspace:*` ranges sneak back into a package, the workflow rewrites them to plain version ranges before `npm install`.

If a tag was pushed before the workflow file existed on that commit (or
you need to re-trigger), move the tag forward and force-push:
`git tag -d vX.Y.Z && git tag vX.Y.Z && git push origin vX.Y.Z --force`.
(Safe because the tag hasn't been consumed by npm yet.)

If the Trusted Publisher config on npmjs.com is wrong or missing,
publish fails with `404 Not Found - PUT .../<package> - Not found`. Fix
at `https://www.npmjs.com/package/@particle-academy/<name>/access`.

## PHP packages (`laravel-catalog`, `laravel-fms`, `holy-sheet`, `dark-slide`)

PHP packages publish via Packagist auto-sync from GitHub. To ship:

1. `cd ../<name>`
2. Bump `"version"` in `composer.json`
3. Commit the bump (`git add composer.json && git commit -m "chore: release vX.Y.Z"`)
4. Tag and push: `git tag vX.Y.Z && git push origin main --tags`
5. Packagist auto-syncs (manual trigger available at `https://packagist.org/packages/particle-academy/<name>`)
6. To pull into the sandbox: `composer update particle-academy/<name>`
