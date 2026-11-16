A Fancy UI app is an Inertia + React SPA — by default the browser renders it *after* the JavaScript loads. That's great for humans, but a search crawler, a social-card scraper, or an LLM that fetches your URL sees an empty shell on the first byte. Fancy closes that gap with two pieces that work together: **server-side rendering** (real HTML in the first byte) and a **server-rendered SEO baseline** (complete `<title>`, meta, Open Graph, and structured data before any JS runs). The result is a site that's fully crawlable, shares with rich cards, and is legible to LLMs — without giving up the SPA experience.

Two packages provide it:

- **`@particle-academy/fancy-inertia`** — the SSR server entry + a per-page `<Seo>` head helper (`/server` and `/seo` subpaths).
- **`particle-academy/fancy-seo`** — the Laravel side: the server-rendered head baseline plus `sitemap.xml` / `robots.txt` / `llms.txt` and per-page Markdown.

## Server-side rendering

Inertia ships SSR; `fancy-inertia` makes wiring it a couple of lines, and keeps the **server and client render the exact same tree** so hydration is clean.

**The SSR entry** — `resources/js/ssr.tsx`:

```tsx
import { createFancyServer } from "@particle-academy/fancy-inertia/server";
import { FancyDataRoot } from "@particle-academy/fancy-query";

createFancyServer({
  resolve: (name) => {
    const pages = import.meta.glob("./Pages/**/*.tsx");
    return pages[`./Pages/${name}.tsx`]().then((m) => m.default);
  },
  providers: (outlet) => <FancyDataRoot echo={null}>{outlet}</FancyDataRoot>,
});
```

**The client entry** — swap the mount for `setupFancyApp`, which auto-picks
`hydrateRoot` (when SSR is on) vs `createRoot` (when it isn't), so turning SSR
on or off is a config change, not a code change:

```tsx
import { createInertiaApp } from "@inertiajs/react";
import { setupFancyApp } from "@particle-academy/fancy-inertia";
import { FancyDataRoot } from "@particle-academy/fancy-query";

createInertiaApp({
  resolve,
  setup: ({ App, props, el }) =>
    setupFancyApp({
      el, App, props,
      providers: (outlet) => <FancyDataRoot echo={null}>{outlet}</FancyDataRoot>,
    }),
});
```

**Build + run** — add the SSR bundle to your Vite config and start the renderer:

```js
// vite.config.js — inside laravel({ ... })
ssr: "resources/js/ssr.tsx",
```

```bash
vite build && vite build --ssr      # emits bootstrap/ssr/ssr.js
php artisan inertia:start-ssr        # the SSR renderer (run under supervisor in prod)
```

Set `INERTIA_SSR_ENABLED=true`. If the renderer is down, Inertia falls back to
client rendering automatically — SSR is purely additive, never a hard dependency.

### Keeping components SSR-safe

Most react-fancy components render fine on the server. Anything that needs the
browser — a canvas chart (`fancy-echarts`), WebGL (`fancy-3d`), a code editor,
an `IntersectionObserver` — wrap in `<FancyClientOnly>` so it renders a fallback
on the server and mounts on the client:

```tsx
import { FancyClientOnly } from "@particle-academy/fancy-inertia";

<FancyClientOnly fallback={<div className="h-96 animate-pulse rounded bg-zinc-100" />}>
  <EChart option={option} />
</FancyClientOnly>
```

The static parts of the page — headings, copy, tables — render on the server and
appear in the first byte; only the interactive widget hydrates. See the
[SSR matrix](https://github.com/Particle-Academy/fancy-inertia/blob/main/docs/SSR.md)
for which components need a wrapper.

## Per-page SEO with `<Seo>`

`@particle-academy/fancy-inertia/seo` turns per-page SEO into one component. It
renders into Inertia's `<Head>` with `head-key` dedupe, so it cleanly overrides
the server baseline on SPA navigation:

```tsx
import { Seo, softwareSourceCode, breadcrumbList } from "@particle-academy/fancy-inertia/seo";

export default function PackagePage({ pkg }) {
  return (
    <>
      <Seo
        title={`${pkg.name} — Fancy UI`}
        description={pkg.tagline}
        canonical={pkg.url}
        image={pkg.ogImage}
        jsonLd={[
          softwareSourceCode({ name: pkg.name, url: pkg.url, codeRepository: pkg.repo, programmingLanguage: "TypeScript" }),
          breadcrumbList([{ name: "Packages", url: "/packages" }, { name: pkg.name, url: pkg.url }]),
        ]}
      />
      {/* page… */}
    </>
  );
}
```

It emits `<title>`, the meta description, canonical link, robots, the full Open
Graph + Twitter card set, and one `<script type="application/ld+json">` per
JSON-LD node. The builders (`website`, `organization`, `softwareApplication`,
`softwareSourceCode`, `article`, `breadcrumbList`, `faqPage`, `collectionPage`,
`product`) are dependency-free and return plain schema.org objects. Set
`noindex` on admin / auth pages.

## The server baseline: `fancy-seo`

`<Seo>` is the *client* layer. For the **first byte** — what a crawler sees
before any JS — the `particle-academy/fancy-seo` Laravel package renders the
default head on the server.

```bash
composer require particle-academy/fancy-seo
```

Drop one tag in your root Blade template's `<head>`:

```blade
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <x-fancy-seo::head />

  @vite(['resources/js/app.tsx'])
  @inertiaHead
</head>
```

Register defaults and per-route SEO from a service provider — `jsonLd`
accumulates across layers, everything else overrides (`defaults()` → per-route →
`for()`):

```php
use FancySeo\Facades\FancySeo;
use FancySeo\JsonLd;

FancySeo::defaults([
    'site_name' => 'Fancy UI',
    'image' => '/og/default.png',
    'jsonLd' => [JsonLd::website('Fancy UI', url('/'))],
]);

FancySeo::route('packages.show', fn (array $p) => [
    'title' => "{$p['package']} — Fancy UI",
    'jsonLd' => [JsonLd::softwareSourceCode($p['package'], url("/packages/{$p['package']}"), "https://github.com/Particle-Academy/{$p['package']}")],
]);

FancySeo::noindexRoutes(['admin.*', 'auth.*']);
```

A controller can also set the payload for the current request:
`FancySeo::for(['title' => $post->title, 'type' => 'article'])`.

### Crawl surfaces — sitemap, robots, llms.txt

`fancy-seo` auto-registers the discovery endpoints (toggle each in
`config/fancy-seo.php`):

| Route | Purpose |
|---|---|
| `/sitemap.xml` | every URL you register via `FancySeo::sitemap(...)` |
| `/robots.txt` | crawl policy — welcomes LLM bots, references the sitemap |
| `/llms.txt`, `/llms-full.txt` | a Markdown index for LLMs ([llmstxt.org](https://llmstxt.org)) |
| `/{path}.md` | per-page raw Markdown (opt-in) |
| `/.well-known/security.txt`, `/humans.txt` | the usual well-knowns |

```php
FancySeo::sitemap(function ($map) {
    $map->add('/', '1.0', 'daily');
    foreach (Package::all() as $p) {
        $map->add("packages/{$p->slug}", '0.8');
    }
});

FancySeo::llms(fn ($seo) => view('seo.llms')->render());
FancySeo::markdownUsing(fn (string $path) => MarkdownContent::for($path)); // null → 404
```

## How the two layers fit

- **`fancy-seo` (server)** renders the *default* head into the first byte, so a
  crawler with no JavaScript gets a correct title, description, canonical, Open
  Graph card, and JSON-LD on every URL.
- **`<Seo>` (client)** overrides it per page using matching `head-key`s, so SPA
  navigations and page-specific structured data stay current after hydration.

Use both: the server baseline for crawlers and social/LLM scrapers, `<Seo>` for
per-page detail. They never fight — the `head-key`s dedupe.

## Built to be read by machines

The same content that makes you rank also makes your app legible to agents. With
SSR on, an LLM that fetches a page gets the real rendered content; `/llms.txt`
gives it a curated index; per-page `.md` gives it clean Markdown instead of
parsed HTML. That's the same Human+ principle the rest of the kit follows — the
surface is built for humans *and* machines from the first byte.
