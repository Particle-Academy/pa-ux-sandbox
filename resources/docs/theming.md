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

## Dark mode

Dark mode is class-based. Add the `dark` class to `<html>` (or any ancestor) and every Fancy UI component flips its zinc/violet variants automatically. We use the `dark:` variant throughout.

A typical toggle:

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

If your brand needs a custom palette across the board, the cleanest path is to vendor `react-fancy` via the CLI:

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
