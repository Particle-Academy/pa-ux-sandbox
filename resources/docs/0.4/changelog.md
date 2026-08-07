Fancy spans **two families of package** — UI packages and Service & Tool packages — each its own independent repo with its own release cadence. The index below is generated from the package registry, so it's always current. Click through for the canonical release notes on GitHub; install commands and live demos live on the [Packages](/packages) page.

<!--PACKAGES-->

## Versioning

Every package follows [semver](https://semver.org/). Minor versions add features; patch versions fix bugs; majors are reserved for breaking changes (we ship those rarely and document them with codemod hints where possible).

## How releases work

**npm packages** (React/TS) publish via **GitHub Actions Trusted Publishing (OIDC)** — no tokens, signed provenance, deterministic supply chain. Each repo is independent; tag a release on `main` and CI does the rest:

```bash
cd fancy-term           # or any package repo
# bump version in package.json
git commit -am "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
# CI builds, signs provenance, and publishes to npm within ~60s
```

**PHP packages** publish via **Packagist auto-sync** from GitHub tags — bump `composer.json` (or rely on the git tag), commit, tag, push, and Packagist picks it up.

## CLI + registry release notes

The `fancy-cli` CLI and the registry contract have their own release notes:

- [fancy-cli releases](https://github.com/Particle-Academy/fancy-ui-cli/releases) — the vendoring CLI
- [pa-ux-sandbox releases](https://github.com/Particle-Academy/pa-ux-sandbox/releases) — registry + this docs site

If a major change affects the registry schema, we'll roll a `$schema` version (`/schema/registry-v2.json`) and run both side-by-side for a deprecation window. Consumers pinned to the old schema URL keep working.
