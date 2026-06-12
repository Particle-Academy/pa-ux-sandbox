A hard content swap on every navigation feels like a website from 2010. A crossfade — the outgoing page easing out while the incoming page eases in — feels like an app. `@particle-academy/fancy-inertia` ships that as a controlled, zero-dependency primitive: no framer-motion, no CSS you hand-write, and it respects `prefers-reduced-motion` out of the box.

## How it works

Inertia swaps page content client-side and hands you a **`key` that changes on every navigation**. That key is the hook. `<FancyPageTransition>` watches it and, on each change:

1. **Snapshots the outgoing page** and renders two layers at once — the new page in normal flow (animating *in*) and the old page absolutely positioned on top (animating *out*).
2. Runs both CSS animations for ~280ms.
3. Drops the outgoing layer on `animationend`.

Because both layers are keyed, React **preserves the old page's DOM** instead of re-mounting it — so there's no flash. The keyframes are injected by the package itself; you import nothing extra.

## The quickest path

Wrap your page body in `<FancyPageTransition>`, keyed by the Inertia URL:

```tsx
import { FancyPageTransition } from "@particle-academy/fancy-inertia";
import { usePage } from "@inertiajs/react";

function Layout({ children }) {
  const { url } = usePage();
  return (
    <div>
      <Navbar />
      <main>
        <FancyPageTransition pageKey={url} transition="fade">
          {children}
        </FancyPageTransition>
      </main>
    </div>
  );
}
```

That's it — every navigation now crossfades. The `transition` prop takes `fade` (default), `slide`, `scale`, `blur`, or `none`.

> **Placement matters.** Put `<FancyPageTransition>` *inside* your [persistent layout](/docs/layouts), around only the page body. The navbar and footer stay static; only the content animates. This only works if the layout itself persists across navigation — which is exactly what Inertia's `Page.layout = …` gives you.

## A live, app-wide transition picker

To let the *whole app* share one transition that a user can change at runtime, mount the engine **once at the App root** and back it with a provider. Use Inertia's children render-prop so the transition survives the page swap even on pages that render their layout inline:

```tsx
import { createInertiaApp } from "@inertiajs/react";
import {
  FancyAppRoot,
  FancyTransitionProvider,
  FancyPageTransition,
} from "@particle-academy/fancy-inertia";

createInertiaApp({
  setup({ App, props, el }) {
    createRoot(el).render(
      <FancyAppRoot>
        <FancyTransitionProvider defaultTransition="fade">
          <App {...props}>
            {({ Component, key, props }) => {
              const child = <Component {...props} />;
              const page = Component.layout ? Component.layout(child) : child;
              return <FancyPageTransition pageKey={key}>{page}</FancyPageTransition>;
            }}
          </App>
        </FancyTransitionProvider>
      </FancyAppRoot>,
    );
  },
});
```

When a `<FancyTransitionProvider>` is present, `<FancyPageTransition>` reads the active transition from it automatically — omit the `transition` prop.

## Building a switcher

`useFancyTransition()` exposes the active choice and a setter; the provider persists it to `localStorage`, so the preference sticks across navigations and reloads:

```tsx
import {
  useFancyTransition,
  FANCY_TRANSITION_LABELS,
} from "@particle-academy/fancy-inertia";

function TransitionPicker() {
  const { transition, setTransition, transitions } = useFancyTransition();
  return (
    <select value={transition} onChange={(e) => setTransition(e.target.value)}>
      {transitions.map((t) => (
        <option key={t} value={t}>{FANCY_TRANSITION_LABELS[t]}</option>
      ))}
    </select>
  );
}
```

This very showcase dogfoods it — the ✨ picker in the top nav drives every navigation you make on this site.

## Whole-page vs. body-only

There's a real trade-off in *where* you mount the engine:

- **App root (render-prop):** works on every page regardless of how it attaches its layout. The catch: the **whole page** crossfades, navbar included. For `fade`/`scale`/`blur` that's invisible at the nav (it's nearly identical frame-to-frame); for `slide` the whole page slides — a bolder, mobile-app feel.
- **Inside a persistent layout:** only the body animates, the chrome stays rock-still. Cleaner, but it requires *every* page to use a persistent `Page.layout` (no inline `<Layout>`).

Pick App-root for the least friction; pick in-layout when you want the nav perfectly fixed and you've standardized on persistent layouts.

## Accessibility & SSR

- **Reduced motion is automatic.** Under `prefers-reduced-motion: reduce`, the crossfade is skipped — pages swap instantly. You don't have to do anything.
- **SSR-safe.** The first paint is static; the transition only engages on subsequent client-side navigations, so server-rendered markup is deterministic. The provider hydrates the stored preference after first paint.
- **`animateInitial`** (default `false`) lets you opt the very first mount into the enter animation if you want a load-in flourish.

## API reference

| Export | Purpose |
|---|---|
| `<FancyPageTransition pageKey transition? duration? animateInitial?>` | The engine. Wrap the page body. |
| `<FancyTransitionProvider defaultTransition? storageKey?>` | Holds + persists the active transition for a switcher. |
| `useFancyTransition()` | `{ transition, setTransition, transitions }`. |
| `FANCY_TRANSITIONS` | `["fade","slide","scale","blur","none"]`. |
| `FANCY_TRANSITION_LABELS` | Human labels keyed by id, for building a control. |

The Human+ takeaway: a transition is a *visual* signal that the surface changed. Agents perceive that change through state and the URL, not the animation — so transitions are pure polish for humans, and they never get in an agent's way. That separation is the subject of [Designing for Human+](/docs/designing-human-plus).
