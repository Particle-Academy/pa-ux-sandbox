# `@particle-academy/fancy-ui`

The Fancy UI CLI. Vendor component source from the [Fancy UI registry](https://ui.particle.academy/docs/registry) into your project so you own the code.

## Install

Always run via `npx`:

```bash
npx fancy-ui@latest init
npx fancy-ui@latest add card
```

Don't `npm install -g` it — `@latest` keeps you in lockstep with the registry version.

## Commands

| Command | What it does |
|---|---|
| `init` | Configures the project; writes `fancy.json`. |
| `add <name…>` | Vendors components. Resolves registryDependencies recursively. Installs missing npm deps. |
| `list` | Lists every component in the registry, grouped by package. |
| `search <query>` | Substring search across name + title + description. |
| `diff <name>` | Compares the local vendored copy against the registry. |

## Configuration

`fancy.json` at your project root:

```json
{
  "$schema": "https://ui.particle.academy/schema/fancy.json",
  "registry": "https://ui.particle.academy",
  "aliases": {
    "components": "@/components/fancy",
    "utils": "@/lib/utils"
  },
  "tsx": true,
  "rsc": false,
  "tailwind": { "css": "src/index.css" }
}
```

`aliases.components` controls where vendored files land — see the [registry docs](https://ui.particle.academy/docs/registry) for the field semantics.

## Zero third-party deps

By policy, this CLI has zero runtime dependencies. Argument parsing, output, network, and file I/O are hand-rolled on Node 18+ primitives. Only `tsup` + `typescript` at build time.

## Self-hosted registries

Override the registry URL — the CLI accepts any source that follows the [registry contract](https://ui.particle.academy/docs/registry):

```bash
npx fancy-ui@latest --registry https://my-team.example.com add card
```

Or set it once in `fancy.json` and forget it.

## Docs

Full reference at [ui.particle.academy/docs/cli](https://ui.particle.academy/docs/cli).
