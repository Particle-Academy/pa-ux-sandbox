A layout is the chrome that stays put while pages come and go — the navbar, the sidebar, the footer. Get it right and everything else (transitions, scroll restoration, presence) composes cleanly on top. Get it wrong and you'll fight remounts forever.

## Persistent layouts are the foundation

In an Inertia app, the naive approach is to render your shell *inside* every page:

```tsx
export default function Dashboard() {
  return <Layout><DashboardBody /></Layout>; // ❌ Layout remounts on every navigation
}
```

This works, but the entire shell unmounts and remounts on each navigation — the navbar flickers, scroll position resets, any state in the shell is lost, and **enter/exit [page transitions](/docs/page-transitions) become impossible** (there's no persistent element to animate from).

The fix is Inertia's **persistent layout** — attach the layout as a static property, and return only the page body:

```tsx
function Dashboard() {
  return <DashboardBody />;
}

// The layout function receives the page and persists across navigation.
Dashboard.layout = (page) => <Layout>{page}</Layout>;

export default Dashboard;
```

Now `Layout` mounts once. Pages swap inside it. The navbar never flickers, scroll restoration works, and the shell can hold state (an open sidebar, a presence socket) across navigation.

## A minimal app shell

A shell is just a flex column with the page in the middle. Compose it from react-fancy primitives:

```tsx
import { Navbar } from "@particle-academy/react-fancy";
import { usePage } from "@inertiajs/react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { url } = usePage();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar className="sticky top-0 z-40">
        <Navbar.Brand>Acme</Navbar.Brand>
        <Navbar.Items>
          <Navbar.Item href="/docs" active={url.startsWith("/docs")}>Docs</Navbar.Item>
          <Navbar.Item href="/pricing" active={url.startsWith("/pricing")}>Pricing</Navbar.Item>
        </Navbar.Items>
        {/* Toggle collapses the items into a stack on mobile — see Mobile. */}
        <Navbar.Toggle />
      </Navbar>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
        {children}
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        {/* … */}
      </footer>
    </div>
  );
}
```

`Navbar` is a compound component — `Navbar.Brand`, `Navbar.Items`, `Navbar.Item` (which takes `href` + `active`), and `Navbar.Toggle` for the mobile hamburger. A few conventions that pay off:

- **Sticky navbars** (style the `<Navbar>` with `sticky top-0`) want a `min-h-screen flex flex-col` root so the footer sits at the bottom on short pages.
- **Read shared data with `usePage()`** — auth, flash messages, feature flags. Laravel shares them once via `HandleInertiaRequests`; the layout reads them on every page for free.
- **Full-bleed vs contained.** Give your `<main>` a `bleed` prop: landing pages and editors own their own width and sit flush under the nav; everything else gets the `max-w-7xl` container. One layout, two rhythms.

## Sidebars and nested navigation

For docs, settings, or admin areas, add a sidebar alongside the page slot. Drive the active state off the current URL:

```tsx
import { usePage } from "@inertiajs/react";
import { Sidebar } from "@particle-academy/react-fancy";

function DocsSidebar({ sections }) {
  const { url } = usePage();
  return (
    <Sidebar>
      {sections.map((group) => (
        <Sidebar.Group key={group.label} label={group.label}>
          {group.pages.map((p) => (
            <Sidebar.Item key={p.slug} href={`/docs/${p.slug}`} active={url === `/docs/${p.slug}`}>
              {p.title}
            </Sidebar.Item>
          ))}
        </Sidebar.Group>
      ))}
    </Sidebar>
  );
}
```

Keep the sidebar **outside** the page-transition wrapper so it doesn't animate on every navigation — only the content pane should crossfade. (See [Page transitions](/docs/page-transitions) for where the boundary goes.)

## Multi-screen apps: `fancy-screens`

A layout shells one page. When your app is several *screens* a user (or an agent) moves between — a dashboard, an editor, a preview — reach for [`@particle-academy/fancy-screens`](/packages/fancy-screens). It gives you a `<ScreenSystem>` registry, `<Screen>` containers, and **cross-screen presence**: each screen carries an `agentActivity` field, so when an agent is working in one screen, the others can show it.

```tsx
import { ScreenSystem, Screen } from "@particle-academy/fancy-screens";

<ScreenSystem>
  <Screen id="editor"><Editor /></Screen>
  <Screen id="preview"><Preview /></Screen>
</ScreenSystem>
```

Consumers bring their own Zustand store and call `useRegisterStore(name, store)` — fancy-screens stays state-library-agnostic. If you're on Inertia, `<FancyAppRoot>` from `fancy-inertia` mounts the `ScreenSystem` provider for you (`withScreens`, on by default).

## The Human+ angle

A layout isn't just visual furniture — it's the frame an agent navigates too. Two things to keep in mind, both expanded in [Designing for Human+](/docs/designing-human-plus):

- **Stable routes and handles.** An agent that drives your app navigates by route and operates elements by `id`/`data-*`, never by scraping the DOM. A persistent layout with stable nav targets is what makes that reliable.
- **Presence lives in the shell.** The shell is the natural home for a presence indicator — who else (human or agent) is here, and what are they touching. `fancy-screens` surfaces this per-screen; wire it once in the layout and every page inherits it.

Next: animate the navigation you just built in [Page transitions](/docs/page-transitions).
