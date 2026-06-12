Fancy spans roughly **thirty packages across two families** — UI packages and Service & Tool packages — each its own independent repo with its own release cadence. This page indexes the canonical release notes (GitHub Releases) for each. Install commands and live demos live on the [Packages](/packages) page.

## UI packages

| Package | Release notes |
|---|---|
| `react-fancy` | [Releases](https://github.com/Particle-Academy/react-fancy/releases) |
| `fancy-whiteboard` | [Releases](https://github.com/Particle-Academy/fancy-whiteboard/releases) |
| `fancy-artboard` | [Releases](https://github.com/Particle-Academy/fancy-artboard/releases) |
| `fancy-flow` | [Releases](https://github.com/Particle-Academy/fancy-flow/releases) |
| `fancy-sheets` | [Releases](https://github.com/Particle-Academy/fancy-sheets/releases) |
| `fancy-slides` | [Releases](https://github.com/Particle-Academy/fancy-slides/releases) |
| `fancy-code` | [Releases](https://github.com/Particle-Academy/fancy-code/releases) |
| `fancy-term` | [Releases](https://github.com/Particle-Academy/fancy-term/releases) |
| `fancy-diff` | [Releases](https://github.com/Particle-Academy/fancy-diff/releases) |
| `fancy-echarts` | [Releases](https://github.com/Particle-Academy/fancy-echarts/releases) |
| `fancy-screens` | [Releases](https://github.com/Particle-Academy/fancy-screens/releases) |
| `fancy-3d` (+ `-babylon`, `-three`) | [Releases](https://github.com/Particle-Academy/fancy-3d/releases) |
| `fancy-motion` | [Releases](https://github.com/Particle-Academy/fancy-motion/releases) |
| `fancy-cms-ui` | [Releases](https://github.com/Particle-Academy/fancy-cms-ui/releases) |

## Service & Tool packages

| Package | Kind | Release notes |
|---|---|---|
| `agent-integrations` | MCP server + bridges | [Releases](https://github.com/Particle-Academy/agent-integrations/releases) |
| `fancy-auto-common` | shared Human+ primitives | [Releases](https://github.com/Particle-Academy/fancy-auto-common/releases) |
| `docs-mcp` | docs MCP server | [Releases](https://github.com/Particle-Academy/docs-mcp/releases) |
| `mcp-relay-client` | single-file MCP client | [Releases](https://github.com/Particle-Academy/mcp-relay-client/releases) |
| `fancy-inertia` | Inertia ↔ React adapter | [Releases](https://github.com/Particle-Academy/fancy-inertia/releases) |
| `fancy-query` | server-state | [Releases](https://github.com/Particle-Academy/fancy-query/releases) |
| `fancy-pixel` | verification badge + beacon | [Releases](https://github.com/Particle-Academy/fancy-pixel/releases) |
| `fancy-heuristics` (PHP) + `-js` | interaction analytics | [Releases](https://github.com/Particle-Academy/fancy-heuristics/releases) |
| `holy-sheet` (PHP) + `holy-sheet-js` | xlsx writer | [Releases](https://github.com/Particle-Academy/holy-sheet/releases) |
| `dark-slide` (PHP) + `dark-slide-js` | pptx writer/reader | [Releases](https://github.com/Particle-Academy/dark-slide/releases) |
| `fancy-cms` (PHP) | Stages page renderer / host | [Releases](https://github.com/Particle-Academy/fancy-cms/releases) |
| `laravel-catalog` (PHP) | Stripe catalog | [Releases](https://github.com/Particle-Academy/laravel-catalog/releases) |
| `laravel-fms` (PHP) | feature management | [Releases](https://github.com/Particle-Academy/laravel-fms/releases) |
| `laravel-fun-lab` (PHP) | gamification | [Releases](https://github.com/Particle-Academy/laravel-fun-lab/releases) |
| `fancy-cli` | source-vendoring CLI | [Releases](https://github.com/Particle-Academy/fancy-ui-cli/releases) |

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
