Fancy UI is split across **eleven packages**, each with its own release cadence and changelog. This page is an index — click through to the canonical release notes on GitHub for each one.

## React packages

| Package | Latest | Changelog |
|---|---|---|
| `@particle-academy/react-fancy` | [npm](https://www.npmjs.com/package/@particle-academy/react-fancy) | [Releases](https://github.com/Particle-Academy/react-fancy/releases) |
| `@particle-academy/fancy-flow` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-flow) | [Releases](https://github.com/Particle-Academy/fancy-flow/releases) |
| `@particle-academy/fancy-whiteboard` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-whiteboard) | [Releases](https://github.com/Particle-Academy/fancy-whiteboard/releases) |
| `@particle-academy/fancy-sheets` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-sheets) | [Releases](https://github.com/Particle-Academy/fancy-sheets/releases) |
| `@particle-academy/fancy-code` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-code) | [Releases](https://github.com/Particle-Academy/fancy-code/releases) |
| `@particle-academy/fancy-echarts` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-echarts) | [Releases](https://github.com/Particle-Academy/react-echarts/releases) |
| `@particle-academy/fancy-screens` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-screens) | [Releases](https://github.com/Particle-Academy/fancy-screens/releases) |
| `@particle-academy/fancy-3d` | (local) | [Repo](https://github.com/Particle-Academy/fancy-3d) |
| `@particle-academy/agent-integrations` | [npm](https://www.npmjs.com/package/@particle-academy/agent-integrations) | [Releases](https://github.com/Particle-Academy/agent-integrations/releases) |
| `@particle-academy/fancy-inertia` | [npm](https://www.npmjs.com/package/@particle-academy/fancy-inertia) | [Releases](https://github.com/Particle-Academy/fancy-inertia/releases) |

## PHP packages

| Package | Latest | Changelog |
|---|---|---|
| `particle-academy/holy-sheet` | [Packagist](https://packagist.org/packages/particle-academy/holy-sheet) | [Releases](https://github.com/Particle-Academy/holy-sheet/releases) |

## Versioning

Every package follows [semver](https://semver.org/). Minor versions add features; patch versions fix bugs; majors are reserved for breaking changes (we ship those rarely and document them with codemod hints where possible).

## How releases work

React packages publish to npm via **GitHub Actions Trusted Publishing (OIDC)** — no tokens, signed provenance, deterministic supply chain. Tag a release on `main` and CI does the rest:

```bash
cd packages/react-fancy
# bump version in package.json
git commit -am "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
# CI publishes, npmjs.com gets it within ~60s
```

PHP packages publish via Composer resolving git tags directly — no Packagist push needed. Same flow: bump `composer.json`, commit, tag, push.

## CLI + registry release notes

The `fancy-ui` CLI and the registry contract have their own release notes — track them at:

- [@particle-academy/fancy-ui releases](https://github.com/Particle-Academy/fancy-ui/releases) — CLI
- [pa-ux-sandbox releases](https://github.com/Particle-Academy/pa-ux-sandbox/releases) — registry + docs site

If a major change affects the registry schema, we'll roll a `$schema` version (`/schema/registry-v2.json`) and run both side-by-side for a deprecation window. Consumers pinned to the old schema URL keep working.
