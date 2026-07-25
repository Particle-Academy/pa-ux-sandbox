The `fancy-cli` CLI is the **vendor path** — it fetches component source from the [hosted registry](/docs/registry) and writes the files into your project so you own the code.

> **Available now** — published as [`fancy-cli`](https://www.npmjs.com/package/fancy-cli). Run it with `npx fancy-cli …`; the installed binary is named `fancy-cli` (it uses the name `fancy-cli` because the bare `fancy-ui` name is blocked on npm). Source: [Particle-Academy/fancy-ui-cli](https://github.com/Particle-Academy/fancy-ui-cli).

## Installation

The CLI is meant to be run with `npx` — no global install required, and the `@latest` tag is your friend so you always get the registry-compatible version.

```bash
# Always run via npx — never npm install -g.
npx fancy-cli@latest init
```

You can pin a specific version if you need reproducibility:

```bash
npx fancy-cli@0.1.0 init
```

## `init`

Configures your project for the vendor flow. Run it once per project.

```bash
npx fancy-cli@latest init
```

Walks you through:

- Where component source should live (default: `src/components/fancy/`)
- The import alias for that directory (default: `@/components/fancy`)
- Your CSS file (Tailwind v4 location)
- Whether to install peer deps automatically (default: yes — `clsx`, `tailwind-merge`, `lucide-react` as needed)

Writes a `fancy.json` at the project root capturing these choices. Subsequent `add` commands read it.

```json
{
  "$schema": "https://ui.particle.academy/schema/fancy.json",
  "registry": "https://ui.particle.academy",
  "aliases": {
    "components": "@/components/fancy",
    "utils": "@/lib/utils"
  },
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/index.css"
  }
}
```

## `add <name…>`

Fetches one or more components from the registry and writes them to disk.

```bash
npx fancy-cli@latest add card
npx fancy-cli@latest add card button tabs dropdown
```

For each component:

1. Hit `https://ui.particle.academy/r/{name}.json` and download the registry-item bundle.
2. Write each `file.content` to `file.target` (resolved against the `components` alias in `fancy.json`).
3. Recursively resolve `registryDependencies` — fetches and writes them too unless they already exist locally.
4. Collect every `dependencies` entry across the bundle, dedupe, and run `npm install` for any missing.

The CLI never overwrites a file you've already vendored unless you pass `--overwrite`.

## `list`

Show every component available in the registry, grouped by package:

```bash
npx fancy-cli@latest list

# Output:
# react-fancy (68)
#   accordion        Accordion          Stateful disclosure surface.
#   button           Button             The flexible button.
#   card             Card               Container with header/body/footer.
#   ...
# fancy-flow (6)
#   flow-editor      FlowEditor         Workflow canvas + executor.
#   ...
```

## Workflow nodes — `add node` / `list nodes` / `search nodes`

A [fancy-flow](/packages/fancy-flow) graph runs on node **kinds**. The engine ships 27 builtins that need no install; the rest come from the node marketplace, and the CLI installs them per runtime.

```bash
# Find one by concept before you hand-roll a step in app code.
npx fancy-cli@latest search nodes "route with an llm"

# Every published node, grouped by category.
npx fancy-cli@latest list nodes

# Install — checks the node runs on the runtimes your project actually executes on.
npx fancy-cli@latest add node @acme/salesforce_upsert
```

`add node` is a subcommand rather than a flag because it installs something different from a component: components vendor source files; nodes install per-runtime packages after a compatibility check. A node installed only for TypeScript is invisible to a PHP runner and the graph fails at that node — `add node` reads the project's real runtimes and refuses a mismatch, which raw `npm install` / `composer require` cannot.

## `search <query>`

Substring search across name, title, and description:

```bash
npx fancy-cli@latest search calendar

# accordion-panel  Stateful disclosure surface...
# calendar         Calendar           Date picker built on a 6×7 grid...
# time-picker      TimePicker         Sibling of Calendar for time entry...
```

## `diff <name>`

Compare the local vendored copy of a component against the latest registry version. Useful for spotting upstream improvements you might want to merge in.

```bash
npx fancy-cli@latest diff card
```

Prints a unified diff. The CLI doesn't apply changes automatically — that's intentional, since the whole point of vendoring is that you may have customized the local copy.

## Configuration reference (`fancy.json`)

| Key | Default | What it controls |
|---|---|---|
| `registry` | `https://ui.particle.academy` | The base URL of the registry. Override for self-hosted mirrors. |
| `aliases.components` | `@/components/fancy` | Where component files land. |
| `aliases.utils` | `@/lib/utils` | Where shared utilities (the `cn` helper) land. |
| `rsc` | `false` | If true, mark client components with `"use client"`. Currently a no-op for React 19 server components. |
| `tsx` | `true` | Emit `.tsx` (true) or `.jsx` (false). |
| `tailwind.css` | `src/index.css` | Stylesheet to extend if a component ships CSS. |

## Self-hosting the registry

Point `registry` at any URL that follows the [registry contract](/docs/registry). The CLI doesn't care whether it's our hosted registry, a private mirror, or a local file server — as long as `GET {registry}/r/{name}.json` returns a valid registry-item.

## What this is *not*

- It's not a build tool. Once components are vendored they're just files in your codebase. You compile them with your existing bundler.
- It's not a runtime dependency. You can delete `fancy.json` and uninstall the CLI; the vendored components keep working.
- It's not the only way to use Fancy UI. The npm-install path remains a first-class citizen — see [Installation](/docs/installation).
