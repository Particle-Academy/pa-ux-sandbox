Fancy UI is responsive by construction — the components are Tailwind v4, so you size and rearrange them with the same breakpoint utilities you already know. This page covers the patterns that matter for an app shell on a phone: a collapsing nav, touch-friendly targets, and rendering client-only components without breaking SSR.

## Breakpoints are just Tailwind

There's no separate "mobile mode." You compose responsive layouts with Tailwind's mobile-first prefixes (`sm:`, `md:`, `lg:`). Default styles target the smallest screen; prefixes layer on at larger ones:

```tsx
// One column on phones, two on tablets, three on desktop.
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {cards}
</div>

// Hide the desktop nav on mobile; show the menu button only on mobile.
<nav className="hidden md:flex">{links}</nav>
<button className="md:hidden" aria-label="Menu">☰</button>
```

Tailwind v4 configures tokens CSS-first via `@theme`. To add or override a breakpoint, set it in your stylesheet — no JS config:

```css
@theme {
  --breakpoint-xs: 24rem; /* enables `xs:` utilities */
}
```

## A collapsing mobile nav

The standard app-shell move — a full horizontal nav on desktop that collapses behind a hamburger on mobile — is built into react-fancy's `Navbar`. You don't wire a drawer; `Navbar.Items` lay out in a row on desktop and stack behind `Navbar.Toggle` on mobile:

```tsx
import { Navbar } from "@particle-academy/react-fancy";

<Navbar className="sticky top-0">
  <Navbar.Brand>Acme</Navbar.Brand>
  <Navbar.Items>
    <Navbar.Item href="/docs">Docs</Navbar.Item>
    <Navbar.Item href="/pricing">Pricing</Navbar.Item>
  </Navbar.Items>
  {/* hamburger on mobile — collapses the items into a stack */}
  <Navbar.Toggle />
</Navbar>
```

The open/closed state is managed by the `Navbar` via context, so the markup stays declarative. For a heavier mobile surface — a settings panel, a filter sheet — drive a `Modal` with controlled `open` + `onOpenChange` state instead.

Two details that make either approach feel native:

- **Close on navigate.** When you roll your own panel, dismiss it as the new page loads (e.g. `onClick={() => setOpen(false)}` on the links).
- **Controlled state.** Keep open/closed in `value` + `onChange` props, never an internal-only toggle — that's what keeps the surface agent-operable and testable. (The [component contract](/docs/developing-human-plus) at work.)

## Touch ergonomics

- **Hit targets ≥ 44px.** Give interactive elements `min-h-11` (44px) or generous padding. react-fancy's `Button` defaults to a comfortable size; don't shrink it below thumb-reach on mobile.
- **Avoid hover-only affordances.** Tooltips and hover menus don't exist on touch. Anything reachable only on hover needs a tap equivalent. (We learned this on our own nav — a hover tooltip once overlapped an open menu on touch.)
- **Respect safe areas.** For full-bleed bottom bars, pad with `env(safe-area-inset-bottom)` so controls clear the home indicator.
- **Momentum scroll regions** want `overscroll-contain` so a scrollable panel doesn't drag the page behind it.

## Client-only components and SSR

Some surfaces need `window` or measure the DOM — charts (`fancy-echarts`), 3D (`fancy-3d`), anything using `IntersectionObserver`, and components that read viewport size. On a server-rendered first paint those throw or mismatch. Guard them with `<FancyClientOnly>`:

```tsx
import { FancyClientOnly } from "@particle-academy/fancy-inertia";

<FancyClientOnly fallback={<Skeleton className="h-64" />}>
  <EChart option={option} />
</FancyClientOnly>
```

It renders the fallback on the server and the real component after hydration — no `window is not defined`, no flash of mismatched markup. The fallback is your chance to reserve layout space so the page doesn't jump when the real component mounts. See the [SSR guide](/docs/page-transitions) note on deterministic first paint; the same principle applies to every client-only island.

## Responsive components that measure themselves

Components like the terminal (`fancy-term`) and the whiteboard (`fancy-whiteboard`) fit their container with a `ResizeObserver`. Two rules keep them honest on mobile:

- **Give them an explicit height.** A flex/grid child with no resolved height collapses to 0 and the component fits to nothing. Set `h-full` / a fixed height on the wrapper.
- **They re-fit on rotation and keyboard show/hide for free** — the `ResizeObserver` fires when the viewport changes. You don't wire orientation events.

## The Human+ angle

Responsive design is about *one* operator's device. Human+ adds a second operator — an agent — that has no viewport at all. The lesson: never encode meaning in layout alone. A control that only appears at a breakpoint, or state that lives only in a media query, is invisible to an agent. Keep the **state** (open/closed, selected, active) in controlled props with stable handles, and let the responsive layout be a pure presentation of that state. [Developing for Human+](/docs/developing-human-plus) makes this concrete.
