# TanStack in Fancy UI

Fancy UI uses TanStack where it closes a real gap, and **never depends on it**.

That distinction is the whole policy. Every TanStack package is an optional
**peer**: nothing is bundled, no existing Fancy package gained a TanStack
dependency, and a consumer who does not opt in sees zero behaviour change and
zero bytes.

## What we adopted, and why

| TanStack | Fancy package | The gap it closes |
|---|---|---|
| **Query** | `fancy-query` | Server state, plus the two bridges Query cannot know about: Inertia page-prop hydration, and Laravel Echo broadcasts mapped to cache keys. |
| **Table** | `fancy-grid` | `react-fancy`'s `<Table>` is a presentational compound — no column model, no row model, no sorting or filtering engine. |
| **Virtual** | `fancy-grid/virtual` | Nothing in the suite windowed anything. A grid over ten thousand rows rendered ten thousand rows. |

## What we deliberately did NOT adopt

**TanStack Router, Start, Form and Store.** Each is a bet on one audience —
non-Laravel React teams — and each would add a permanent second support matrix
to every surface that touched it. The suite already spans PHP and Node backends;
a second routing and form story on top is a cost that outlives whoever chose it.

Routing is handled instead by a **polymorphic `as` prop** on every `react-fancy`
navigation primitive. One prop covers Inertia, TanStack Router, React Router and
Next — a router `Link` renders in place of a hardcoded `<a href>`, which in a
client-routed app is the difference between a navigation and a full page load.

```tsx
import { Link } from "@inertiajs/react";

<Navbar.Item as={Link} href="/packages">Packages</Navbar.Item>
```

## The Live Contract

A package that owns live data declares, **as pure data**, which query keys its
surface owns and which broadcast events invalidate them.

```ts
import type { LiveContract } from "@particle-academy/fancy-query";

export const catalogLive = {
  namespace: "catalog",
  events: [
    { event: "catalog.product.updated", keys: [["catalog", "products"]] },
  ],
} as const satisfies LiveContract;
```

`LiveContract` is imported as a **type**, so declaring a contract adds no
dependency: a host that does not want live behaviour pays nothing for the
declaration existing.

Data rather than code, on purpose — three audiences read the same declaration:
the JS host wiring it up, the PHP twin asserting parity against it, and an agent
reasoning about what a mutation will invalidate. Only the first can execute code.

`toEchoMap()` turns a contract into the map `useFancyEchoInvalidation` already
takes. `validateLiveContract()` returns everything wrong with one at once — a
namespace carrying its own package prefix, an event outside its namespace, a key
reaching into another package's cache. Each of those otherwise fails **silently**:
a cache nobody invalidated presents as "the UI does not update", with no error
anywhere.

### What belongs in a contract, and what does not

The contract covers **durable state** — does this record exist, has this run
finished. It deliberately excludes streams: cursors, presence, per-node
progress, in-flight strokes. Those fire many times a second, and invalidating a
query on each one means a board with three people on it re-fetches hundreds of
times a minute and still shows nothing new. Render those from the transport
directly.

Getting that split wrong is the mistake an author makes first, and it is why the
whiteboard contract carries no cursor event and the flow contract carries no
per-node event.

## Driving a grid from an agent

`registerGridBridge` from `agent-integrations` exposes a `fancy-grid` over MCP:
`grid_sort`, `grid_filter`, `grid_select_rows` and `grid_edit_cell`, plus a read
tool that reports which columns and rows are addressable.

Two behaviours worth knowing. An **unknown column is an error**, not a silent
no-op — a sort nothing applies looks identical to a grid that is not sorted, so
an agent would have no way to tell it failed. And `grid_edit_cell` is the only
tool there that changes stored data rather than view state, so it is the only one
`pendingMode` gates: sorting a grid is not a trust-but-verify action, and gating
it would just train people to click through confirmations.

## Installing

TanStack packages are peers, so you install the ones you use:

```bash
npm install @particle-academy/fancy-query @tanstack/react-query
npm install @particle-academy/fancy-grid @tanstack/react-table
# windowing is opt-in, on its own entry
npm install @tanstack/react-virtual
```
