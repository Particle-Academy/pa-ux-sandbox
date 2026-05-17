Fancy UI ships in **two distribution modes** and you can mix them freely within the same project. Pick the one that fits each surface.

## Mode 1 — npm install (default fast path)

The simplest way to use any Fancy UI package. You install the npm package, import the components you need, and ship.

```bash
npm install @particle-academy/react-fancy
# or
pnpm add @particle-academy/react-fancy
# or
yarn add @particle-academy/react-fancy
```

```tsx
import { Card, Action, Heading } from "@particle-academy/react-fancy";

export function ProductCard() {
  return (
    <Card variant="elevated">
      <Card.Body>
        <Heading level={3} size="sm">Pro plan</Heading>
        <Action color="violet">Subscribe</Action>
      </Card.Body>
    </Card>
  );
}
```

You'll need **Tailwind CSS v4** in the host app (it's a peer dependency). React 19 and react-dom 19 are also peer dependencies. See [Theming](/docs/theming) for the Tailwind import line and the design-token setup.

This mode is the right call when:

- You want the fastest possible setup.
- You don't need to fork the component source.
- You're fine getting updates via `npm update`.

## Mode 2 — `npx fancy-ui add` (vendor the source)

For teams that want to **own the code** and treat Fancy UI as a starting point they'll modify, the CLI fetches the component source from our [hosted registry](/docs/registry) and writes the files directly into the host project.

```bash
# One-time per project — writes fancy.json with your conventions.
npx fancy-ui@latest init

# Add a component. Sources land under src/components/fancy/<slug>/.
npx fancy-ui@latest add card

# Add several at once (registry deps resolve automatically).
npx fancy-ui@latest add card action tabs dropdown
```

After this, you import from your own codebase:

```tsx
import { Card } from "@/components/fancy/card";
```

The CLI is documented in full at [CLI reference](/docs/cli). The registry it consumes is documented at [Registry](/docs/registry).

This mode is the right call when:

- You're building a design system on top of Fancy UI and need to fork primitives.
- Your team treats third-party UI deps as a smell and prefers vendored source.
- You want the option to drop or replace primitives without coordinating with our release cadence.

## Mode 3 — Both (recommended for big apps)

For most non-trivial apps, the right answer is **both**: keep the long tail on `npm install`, and vendor the 5–10 primitives you actually customize. That way you pay maintenance cost only on the components you've forked.

## Laravel apps with Inertia

If you're building a Laravel app with Inertia and React, install the Inertia bridge too:

```bash
composer require particle-academy/laravel-fms  # optional, for feature gating
npm install @particle-academy/fancy-inertia @particle-academy/react-fancy
```

Then wire `<FancyAppRoot>` at your Inertia bootstrap:

```tsx
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { FancyAppRoot } from "@particle-academy/fancy-inertia";

createInertiaApp({
  resolve: (name) => import(`./Pages/${name}.tsx`),
  setup({ App, props, el }) {
    createRoot(el).render(
      <FancyAppRoot>
        <App {...props} />
      </FancyAppRoot>,
    );
  },
});
```

`FancyAppRoot` mounts `<Toast.Provider>`, the `ScreenSystem` from fancy-screens, and registers the ECharts modules — all above the Inertia outlet so the providers survive page swaps.

## Next steps

- Set up your Tailwind tokens — [Theming](/docs/theming)
- Wire up the CLI for the vendoring path — [CLI](/docs/cli)
- Make the components agent-driveable — [MCP servers](/docs/mcp)
