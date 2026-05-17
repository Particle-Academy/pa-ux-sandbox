The Fancy UI registry is a **public, JSON-only HTTP contract** that lets anyone — humans, agents, third-party tooling — discover and download component source. The site you're reading runs it at `https://ui.particle.academy/r/` and the schema is intentionally compatible with shadcn's so adjacent tooling that already speaks the format works out of the box.

## Endpoints

| Path | Returns |
|---|---|
| `/r/index.json` | The registry index — every installable component, lightweight summary. |
| `/r/{slug}.json` | One registry-item — full source bundle for that component. |

Both endpoints are public, cacheable, and CORS-open (`Access-Control-Allow-Origin: *`). They cache for 5 minutes at the edge and 15 minutes at our origin. They contain no secrets and no user data.

## The index — `/r/index.json`

```json
{
  "$schema": "https://ui.particle.academy/schema/registry.json",
  "name": "fancy-ui",
  "homepage": "https://ui.particle.academy",
  "items": [
    {
      "name": "card",
      "type": "registry:ui",
      "title": "Card",
      "description": "Card from react-fancy",
      "package": "react-fancy",
      "files": 6,
      "url": "/r/card.json"
    },
    ...
  ]
}
```

Each item carries enough to render in a list or run substring search against. The `url` points at the full bundle for that component.

## The bundle — `/r/{slug}.json`

```json
{
  "$schema": "https://ui.particle.academy/schema/registry-item.json",
  "name": "card",
  "type": "registry:ui",
  "title": "Card",
  "description": "...",
  "package": "react-fancy",
  "dependencies": ["clsx", "tailwind-merge"],
  "registryDependencies": ["utils-cn"],
  "files": [
    {
      "path": "components/fancy/card/Card.tsx",
      "content": "import { forwardRef } from \"react\";\n...",
      "type": "registry:ui",
      "target": "components/fancy/card/Card.tsx"
    },
    ...
  ]
}
```

### Field reference

| Field | Type | Description |
|---|---|---|
| `name` | string | Globally unique slug (kebab-case). |
| `type` | string | One of `registry:ui`, `registry:hook`, `registry:lib`, `registry:block`. |
| `title` | string | The display name (TitleCase). |
| `description` | string | One-line summary. |
| `package` | string | Which Fancy UI package this component lives in. Informational; the bundle is self-contained. |
| `dependencies` | string[] | npm packages the component imports. Peer deps (react, react-dom, tailwindcss) are filtered out. |
| `registryDependencies` | string[] | Other registry slugs this component imports from. Resolves recursively. |
| `files` | object[] | The source files to write. |

### File entries

| Field | Type | Description |
|---|---|---|
| `path` | string | Original path within the bundle. |
| `content` | string | The raw source code. |
| `type` | string | Same vocabulary as the top-level `type`. |
| `target` | string | Where the file should land in the consumer's codebase. Relative to the `aliases.components` path in `fancy.json`. |

## How consumers use it

The reference consumer is the [`fancy-ui` CLI](/docs/cli) but anything that speaks HTTP can use it.

### Manual fetch

```bash
curl -s https://ui.particle.academy/r/card.json | jq .files[].path
# "components/fancy/card/Card.tsx"
# "components/fancy/card/Card.types.ts"
# "components/fancy/card/CardBody.tsx"
# "components/fancy/card/CardFooter.tsx"
# "components/fancy/card/CardHeader.tsx"
# "components/fancy/card/index.ts"
```

### CLI

```bash
npx fancy-ui@latest add card
```

### MCP

Agents in any IDE that speaks the [Fancy UI MCP server](/docs/mcp) can browse and install components conversationally:

> "Add the card and dropdown components to my project."

The MCP server reads the registry on the agent's behalf and applies the writes.

## Recursive dependency resolution

If a component bundle lists `registryDependencies`, consumers should fetch and install those too, recursively. The CLI and MCP server both do this — they collect the full dependency tree before applying writes so partial installs aren't possible.

The graph is a DAG. We deliberately avoid cycles in our own registry.

## Self-hosting

Any HTTP server that exposes `/r/index.json` + `/r/{slug}.json` in this schema is a valid registry. The CLI accepts a `registry` URL in `fancy.json`:

```json
{
  "registry": "https://my-company.example.com"
}
```

You could host a private mirror that only has your internal company components, or one that overrides specific Fancy UI components with your team's forks. Mixing multiple registries (e.g. ours + yours) is on the CLI roadmap.

## What this is *not*

- It's not an npm replacement. The bundles are source-code distribution, not a package format. You don't `require()` a registry-item; the CLI copies it into your codebase.
- It's not a build artifact source. The `content` strings are the raw `.tsx` we ship in our repo, not transpiled. Your bundler compiles them like any other source file.
- It's not authenticated. There's nothing private in the registry — it's a public CDN-friendly contract.
