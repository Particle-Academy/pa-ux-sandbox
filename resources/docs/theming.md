Fancy UI is **Tailwind v4 native**. Every primitive consumes Tailwind utility classes directly and the design tokens live in your `@theme` block, not in a separate JSON file. This makes the theme readable, debuggable, and editable in one place.

## Importing Tailwind

In your global stylesheet (typically `resources/css/app.css` or `src/index.css`):

```css
@import "tailwindcss";
```

Note: this is the v4 syntax. **Don't use** the legacy `@tailwind base; @tailwind components; @tailwind utilities;` directives. They still work but they short-circuit a lot of v4's improvements.

## The default token set

Fancy UI doesn't ship a custom token file — it uses Tailwind's defaults (zinc as the gray scale, violet as the brand accent) with no shadowing. That means:

- Light mode neutrals: `zinc-50` → `zinc-950`
- Dark mode neutrals: same scale, reversed
- Primary accent: `violet-600` (light) / `violet-300` (dark)
- Status colors: `red`, `amber`, `emerald`, `sky`, `indigo`

If you want to override these, define your own in a `@theme` block:

```css
@import "tailwindcss";

@theme {
  --color-brand-50:  #f5f3ff;
  --color-brand-500: #8b5cf6;
  --color-brand-900: #4c1d95;
}
```

Every Fancy UI component that takes a `color` prop accepts one of: `zinc`, `red`, `orange`, `amber`, `emerald`, `sky`, `indigo`, `violet`, `rose`. If you want to add custom colors, register them in `@theme` *and* in the component's `color` prop union (or use `className` overrides for one-offs).

## Semantic tokens

Since react-fancy 5.52.0 the kit's neutral chrome -- surfaces, outlines, text, form fields and focus rings -- reads twelve **semantic tokens** (ten since 5.52.0, two more in 5.53.1). Map your palette onto them and every Card, menu, modal, table, tab and form control follows, light and dark, without redefining `zinc`.

Each role is two CSS variables, one per mode:

| Role | Light | Dark | Default (light / dark) | Used for |
|---|---|---|---|---|
| `surface` | `--fancy-surface` | `--fancy-surface-dark` | white / zinc-900 | cards, overlays, sidebars, navbars |
| `surface-muted` | `--fancy-surface-muted` | `--fancy-surface-muted-dark` | zinc-100 / zinc-800 | hover + selected rows, chips, wells |
| `border` | `--fancy-border` | `--fancy-border-dark` | zinc-200 / zinc-700 | outlines, dividers, tracks |
| `border-strong` | `--fancy-border-strong` | `--fancy-border-strong-dark` | zinc-300 / zinc-700 | form-control outlines, keycaps |
| `input` | `--fancy-input` | `--fancy-input-dark` | white / `#1e1e24` | text inputs, checkboxes, radios, OTP cells |
| `text` | `--fancy-text` | `--fancy-text-dark` | zinc-900 / zinc-100 | headings, values, active items |
| `text-soft` | `--fancy-text-soft` | `--fancy-text-soft-dark` | zinc-700 / zinc-300 | body copy, menu items |
| `text-muted` | `--fancy-text-muted` | `--fancy-text-muted-dark` | zinc-500 / zinc-400 | descriptions, captions |
| `text-faint` | `--fancy-text-faint` | `--fancy-text-faint-dark` | zinc-400 / zinc-500 | placeholders, decorative icons |
| `focus` | `--fancy-focus` | `--fancy-focus-dark` | blue-500 / blue-400 | focus border + ring on fields |
| `text-subtle` | `--fancy-text-subtle` | `--fancy-text-subtle-dark` | zinc-600 / zinc-400 | inactive nav labels (Sidebar, Menu, Navbar, MultiSwitch) |
| `surface-hover` | `--fancy-surface-hover` | `--fancy-surface-hover-dark` | zinc-50 / zinc-800 at 50% | hover fill on nav items, options, rows |

```css
/* A cream/terracotta light theme with a blue-grey dark one. */
:root {
  --fancy-surface: #fbf6ee;        --fancy-surface-dark: #1f2833;
  --fancy-surface-muted: #f1e6d6;  --fancy-surface-muted-dark: #2a3542;
  --fancy-border: #e4d3bd;         --fancy-border-dark: #3a4757;
  --fancy-input: #fffdf9;          --fancy-input-dark: #18202a;
  --fancy-text: #3b2a1e;           --fancy-text-dark: #e6edf5;
  --fancy-text-muted: #8a6e58;     --fancy-text-muted-dark: #93a3b5;
  --fancy-focus: #c2603d;          --fancy-focus-dark: #7fb0e0;

  /* The accent is the brand trio, documented in react-fancy's README. */
  --color-brand: #c2603d;
  --color-brand-contrast: #fffdf9;
  --color-brand-hover: #a34c2d;
}
```

- **Set nothing and nothing changes.** Every component reads its token through a `var()` fallback that is the colour it used before, so an unset token renders the old value exactly.
- **Set them anywhere the variable is in scope** -- `:root`, `body`, or a wrapper element to theme one region. There is no selector or specificity to win.
- **State both modes.** The dark value is its own variable; which one applies is decided by your `dark:` variant (next section).
- The table is exported from react-fancy as `THEME_TOKENS`, for tooling.
- **Not covered, on purpose:** colours that encode data -- chart series, file-type marks, mood and confidence scales, event kinds -- and the hues you choose with a `color` prop. A few neutral pairs that no single token reproduces exactly in both modes still use zinc; react-fancy's CHANGELOG (5.52.0) lists them.

## Dark mode

Dark mode follows **`.dark` or `[data-theme="dark"]`** -- on `<html>` or on any ancestor. react-fancy's `initTheme()` sets both, follows the OS until the user picks, and remembers the choice:

```tsx
import { initTheme } from "@particle-academy/react-fancy";

initTheme(); // once, as early as possible
```

The components' `dark:` classes are compiled in *your* build, with *your* `dark` variant, so tell Tailwind which hooks to follow. react-fancy ships the line (5.53.0+):

```css
@import "tailwindcss";
@import "@particle-academy/react-fancy/dark-variant.css";
@import "@particle-academy/react-fancy/styles.css";
```

It is a single `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));` -- if you already declare your own `@custom-variant dark`, add the attribute to it instead. `styles.css` follows both hooks on its own; a custom variant cannot reach the plain selectors in it, which is why binding the variant to the attribute was not enough before 5.53.0.

A hand-rolled toggle, if you are not using `initTheme()`:

```tsx
import { Button } from "@particle-academy/react-fancy";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const toggle = () => document.documentElement.classList.toggle("dark");
  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
```

For persistence (and to avoid flicker on initial load), set the class before React mounts:

```html
<script>
  const stored = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (stored === "dark" || (!stored && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
</script>
```

## Overriding specific component tokens

Most surfaces accept a `className` prop for one-off overrides. Use this sparingly — if you find yourself overriding the same way in five places, consider [vendoring the component](/docs/cli) and editing the source.

```tsx
<Card className="border-amber-300/40 bg-amber-50/40">
  <Card.Body>Warning tone.</Card.Body>
</Card>
```

## Designing your own palette

Start with the [semantic tokens](#semantic-tokens) and the brand trio: together they repaint the kit's chrome and accent without touching a component. If you need to go further than they reach, vendor `react-fancy` via the CLI:

```bash
npx fancy-cli@latest add card action tabs ...
```

Then edit the `cn()` helper and each variant's class strings to match your tokens. Because everything is Tailwind utility classes inline (no styled-components, no CSS-in-JS, no theme provider), the audit and the changes are local and obvious.

## Tailwind v4 gotchas

- Use `size-4` instead of `h-4 w-4` where possible.
- `opacity-50` shorthand on color utilities is gone; use `bg-violet-600/50` instead of `bg-violet-600 opacity-50`.
- `text-base/7` is the v4 way to set line-height; the deprecated `leading-7` still works.
- `data-[...]` and `aria-[...]` variants are first-class.

Refer to [Tailwind CSS v4 docs](https://tailwindcss.com/docs) for the full upgrade story if you're coming from v3.
