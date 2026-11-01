# Typography

How to handle fonts in a Fancy UI app: the default stacks, adding a custom or web font, Google Fonts, licensing, and what to do when layout has to come out identical on every machine.

Agents get the same guide from the install-MCP: call the `typography-guide` tool, optionally with a `topic` (`policy`, `defaults`, `custom`, `tailwind`, `google-fonts`, `licensing`, `deterministic`, `packages`). Both read this page, so they cannot disagree.

<!-- topic: policy -->
## The policy: self-host, serve from your own origin

Fonts in a Fancy app are **self-hosted** and served from the **same origin** as the app. They are never hot-linked from a font CDN: not fonts.googleapis.com, not fonts.bunny.net, not unpkg or jsdelivr. Fetching a family from a provider *at build time* and serving the files from your own build is fine; the rule is about what the visitor's browser contacts.

Why:

- **A strict CSP.** `font-src 'self'` is the policy to aim for. A hot-linked font is blocked by it, and loosening the policy to admit a third-party host widens what that host can serve into your pages.
- **Visitor privacy.** Every page view of a hot-linked font sends the visitor's IP address and the page URL to the font host. This is a known GDPR problem: in January 2022 the Munich Regional Court (LG München I, 3 O 17493/20) held that dynamically embedding Google Fonts without consent violated the GDPR and awarded the visitor damages.
- **Deterministic layout.** When a font fails to load, the browser silently falls back to whatever is installed. A different font has different advance widths, so line breaks move, a heading wraps, and a paged document changes its page count. Nothing reports it. Serving the exact file yourself removes the dependency on someone else's uptime and on the visitor's machine.
- **No performance cost.** The old argument for a shared CDN was a shared cache. Browsers now partition their HTTP cache per site, so a font cached on another site is not reused on yours, and a same-origin font avoids an extra connection.

<!-- topic: defaults -->
## What the kit uses by default

- **react-fancy ships no font.** It declares no `@font-face` and no font-family token. Its components use Tailwind's `font-sans` and `font-mono` utilities (mono for code, key hints and numbers), which read the `--font-sans` and `--font-mono` theme variables. Set those once in your `@theme` and every component follows. Left unset, they are Tailwind v4's default system stacks.
- **Tailwind v4 applies `--font-sans` to the whole page.** Its preflight sets the document font to `--font-sans` and `code`/`kbd`/`pre` to `--font-mono`, so the body text and react-fancy agree without extra wiring.
- **There is no display or heading token.** Add one yourself if your design has one (see the Tailwind section).
- **The Laravel starter kit** (`laravel new --using=particle-academy/fancy-starter-kit`) sets `--font-sans: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif, …` in `resources/css/app.css`, and declares the family in `vite.config.js` through laravel-vite-plugin's `fonts` option (`bunny('Instrument Sans', { weights: [400, 500, 600] })`). That option downloads the files at build time and emits them as your own assets, so visitors never contact the provider. The faces only reach the page through the `@fonts` Blade directive: check that `resources/views/app.blade.php` has `@fonts` before `@vite(...)`. Without it the family is named in your CSS but never loaded, and text silently renders in the system fallback.

<!-- topic: custom -->
## Adding a custom or web font (Laravel + Vite + Tailwind v4)

The file layout below matches the starter kit: `resources/css/app.css`, `vite.config.js`, `resources/views/app.blade.php`.

**1. Put the files in the app.** One directory per family, with its licence beside it:

```text
resources/fonts/inter/
  InterVariable.woff2
  InterVariable-Italic.woff2
  OFL.txt
  NOTICE
```

Prefer **woff2**: it is compressed and supported by every browser the kit supports. A **variable** font covers every weight in one file, which is usually smaller than three or four static weights.

**2a. Recommended on Laravel: declare it in `vite.config.js`.** laravel-vite-plugin has a `fonts` option (3.1.3 is the version the starter kit locks). Its `local()` provider takes files you committed, writes the `@font-face` rules (with `font-display: swap` by default), emits the files as hashed build assets, generates the preload links and a metric-matched fallback face to reduce layout shift.

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { local } from 'laravel-vite-plugin/fonts';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            fonts: [
                local('Inter', {
                    // A variable font needs explicit variants with a weight range.
                    variants: [
                        { src: 'resources/fonts/inter/InterVariable.woff2', weight: '100 900' },
                        { src: 'resources/fonts/inter/InterVariable-Italic.woff2', weight: '100 900', style: 'italic' },
                    ],
                    // Preload only the face the first screen uses.
                    preload: [{ weight: '100 900' }],
                }),
            ],
        }),
    ],
});
```

Then render it in the layout, **before** `@vite`:

```blade
<head>
    @fonts
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
```

`@fonts` prints the preload `<link>`s and an inline `<style>` holding the `@font-face` rules. Under a strict `style-src`, call `Vite::useCspNonce()` and both carry the nonce.

**2b. Any Vite app: plain `@font-face` in your CSS.** Vite rewrites the relative `url()` and emits the file as a same-origin asset:

```css
@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url('../fonts/inter/InterVariable.woff2') format('woff2');
}

@font-face {
    font-family: 'Inter';
    font-style: italic;
    font-weight: 100 900;
    font-display: swap;
    src: url('../fonts/inter/InterVariable-Italic.woff2') format('woff2');
}
```

`font-display: swap` paints text in the fallback immediately and swaps when the font arrives, so text is never invisible.

**3. Preload the critical face** (route 2b only; route 2a does it for you). Built files have hashed names, so let Laravel resolve the URL. Tell Vite about the files in `resources/js/app.tsx`:

```ts
import.meta.glob(['../fonts/**']);
```

and preload the one face above the fold:

```blade
<link rel="preload" href="{{ Vite::asset('resources/fonts/inter/InterVariable.woff2') }}" as="font" type="font/woff2" crossorigin>
```

`crossorigin` is required even on the same origin: fonts are fetched in CORS mode, and a preload without it is downloaded twice. Preload one or two faces at most; every preload competes with your CSS and JS.

**4. Wire the family into Tailwind** (next section).

**5. Subset if the files are large.** Families from Google Fonts often cover Latin, Cyrillic, Greek and Vietnamese in one file. If you serve one script, a subset is a fraction of the size. A common tool is fontTools' `pyftsubset`, which can also write woff2 (`--flavor=woff2`). Subsetting or converting creates a *modified* font: the OFL allows that, but if the font declares a Reserved Font Name the modified version may not use that name. Check the licence header first. The alternative is several files split by `unicode-range`, so the browser fetches only the scripts a page uses; laravel-vite-plugin's `google()` and `bunny()` providers do this with their `subsets` option.

<!-- topic: tailwind -->
## Wiring fonts into Tailwind v4

Tailwind v4 is configured in CSS. Set the theme variables in `resources/css/app.css`, after `@import 'tailwindcss'`:

```css
@import 'tailwindcss';

@theme {
    --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --font-heading: 'Fraunces', ui-serif, Georgia, serif;
}
```

- `--font-sans` is the page default and what react-fancy's `font-sans` reads. `--font-mono` drives react-fancy's code, key-hint and number surfaces.
- Every `--font-<name>` creates a `font-<name>` utility, so `--font-heading` gives you `class="font-heading"`. Prefer a name like `heading` over `display`, which reads like the CSS `font-display` descriptor.
- Keep a system stack after the family name. If the file ever fails to load, the fallback is chosen by you rather than by the browser.
- Font features belong next to the family: `--font-sans--font-feature-settings: 'cv11', 'ss01';` applies them wherever `--font-sans` is the default.
- The `@font-face` rules can live in the same file (route 2b) or come from `@fonts` (route 2a). Tailwind only needs the family *name*.

<!-- topic: google-fonts -->
## Google Fonts, self-hosted

Google Fonts are open-licensed, and nothing in their licences requires you to load them from Google. Self-host them like any other font.

**1. Get the files.** Either:

- from the family's page on fonts.google.com: **Get font**, then **Download all**. The zip holds the font files and the licence; or
- from the [google/fonts](https://github.com/google/fonts) repository on GitHub. The top-level directory tells you the licence: `ofl/` (SIL Open Font License), `apache/` (Apache 2.0) or `ufl/` (Ubuntu Font Licence). Inter, for example, is `ofl/inter/`: `Inter[opsz,wght].ttf`, `Inter-Italic[opsz,wght].ttf` and `OFL.txt`.

Those files are TTF. Convert them to woff2 (see subsetting in the custom-font section), or use the woff2 files the font's own project publishes where it has them: Inter's upstream releases ship `InterVariable.woff2`.

**2. Self-host them** exactly as in the custom-font section: `resources/fonts/inter/`, `local()` or `@font-face`, `font-display: swap`, preload the first face, `--font-sans` in `@theme`.

**3. Keep the licence beside the files**: `OFL.txt` (or the Apache or UFL licence from the same directory) plus a NOTICE saying which family, version and source.

**4. Never paste Google's embed code.** Do not add the fonts.googleapis.com stylesheet `<link>`, an `@import` of it, or a preconnect to fonts.gstatic.com. That is the hot-link the policy exists to stop, and a strict `font-src 'self'` blocks it anyway.

**Shortcut on Laravel:** laravel-vite-plugin's `google()` provider downloads the family when you build and emits the files as your own assets. The visitor's browser never contacts Google, so it meets the policy:

```js
import { google } from 'laravel-vite-plugin/fonts';

// inside laravel({ ... })
fonts: [google('Inter', { weights: [400, 600], subsets: ['latin'] })],
```

with `@fonts` in the layout. The trade-offs: the build needs network access, the licence file is not downloaded for you (keep it in the repo yourself), and Google can update a family between two builds. Where exact metrics matter, commit the files and use `local()` instead.

<!-- topic: licensing -->
## Licences and approval

- **Ship every font with its licence.** Keep the licence file (`OFL.txt`, the Apache licence, `UFL.txt`, or the vendor's EULA) and a short `NOTICE` (family, version, where it came from) in the same directory as the font files. That is what the kit's own packages do: fancy-cms ships `fonts/inter-4.1/` with `OFL.txt`, `NOTICE` and a hash manifest, and last-word-ui ships `fonts/OFL.txt` and `fonts/NOTICE` beside Carlito.
- **Your app's licence does not replace the font's.** An MIT project still distributes an OFL font under the OFL.
- **Prefer unmodified files.** Ship the files as the foundry published them where you can. Converting or subsetting is a modification (see the custom-font section for the Reserved Font Name caveat).
- **Commercial fonts** usually come with a web licence that limits self-hosting, page views or domains. Read it before you put the files in a public build.

**A note on the Fancy estate's own repos:** every third-party font needs the owner's approval before it lands, and ships unmodified with its licence and a NOTICE. Fonts are exempt from the estate's three-month freshness bar for dependencies, because a font is static data rather than code. Your project follows its own policy; the rest of this section is ordinary best practice.

<!-- topic: deterministic -->
## Deterministic layout: bundle the exact font

Most pages tolerate a fallback font. Some do not: **paged documents** (a page count), **canvas text**, **PDF or image capture**, and **layout tests** that run on more than one machine. There a fallback is not cosmetic. Different advance widths move every line break, and the result differs by machine with no error anywhere.

- **Bundle the exact font**, served same-origin. Do not depend on a font being installed, and avoid `local()` sources in `@font-face`, which pick up whatever version the machine has.
- **A metric-compatible substitute works when the original cannot ship.** `@particle-academy/last-word-ui` 0.3.0 bundles **Carlito** (SIL OFL 1.1), which is metric-compatible with Calibri: every printable ASCII and Latin-1 advance is identical in all four styles. Calibri and default text draw in the bundled Carlito with kerning and ligatures off, so a document paginates the same on a machine with Calibri, with only Arial, or with neither, and the count agrees with the PHP `last-word` package's `Agent::layout()`.
- **Measure after the font has loaded.** `font-display: swap` means the first layout uses the fallback. `document.fonts.ready` alone does not prove your font loaded: it settles when pending loads finish, and a face nothing has requested yet is not pending. Load the faces you measure explicitly, then check them:

```ts
await Promise.all([
    document.fonts.load('400 16px "Inter"'),
    document.fonts.load('700 16px "Inter"'),
]);

if (!document.fonts.check('400 16px "Inter"')) {
    // Still the fallback: report it rather than trusting the measurement.
}
```

last-word-ui works this way: it loads each face the document uses before it measures, gives up after 3 seconds, and reports `font: "carlito"` or `"fallback"` in `onLayout` (and `data-lw-font` on the root) so a caller can tell a deterministic count from a machine-dependent one.

- **Canvas draws with whatever is loaded at that moment.** Load the face before drawing text, and redraw if it arrives later.
- **Captures should block, not swap.** For a screenshot or PDF, `font-display: block` avoids capturing the fallback. fancy-cms takes `fontDisplay: 'block'` for exactly this.

<!-- topic: packages -->
## Font hooks in Fancy packages

**`@particle-academy/react-fancy`** has no font prop. It inherits `--font-sans` and `--font-mono` from your Tailwind theme, so theming the font is the `@theme` block above.

**`particle-academy/fancy-cms` (0.8.0+) and `@particle-academy/fancy-cms-ui` (0.13.0+)** take structured font references in the document theme, resolved by **your** `fontResolver`. The renderer never fetches fonts and never contacts Google; it emits `@font-face` rules for the same-origin WOFF2 URLs your resolver returns.

```json
{"theme": {"font": {"body": {"family": "Inter", "source": "bundled", "weights": [400, 600, 700], "styles": ["normal"]}}}}
```

Sources are `bundled` or `google`; for `google` you import and publish the files yourself. Node styles use `fontFamily: "var(--cms-font-body)"`. Both packages ship unmodified Inter 4.1 (OFL 1.1, with NOTICE and a hash manifest) that you can publish: in PHP, `BundledFonts::interFiles()` lists the files and `BundledFonts::interAsset()` maps the URLs you published them at; on npm they are at `@particle-academy/fancy-cms-ui/fonts/inter/*`.

```php
use FancyCms\Render\BundledFonts;
use FancyCms\Render\PageRenderer;

// Publish BundledFonts::interFiles() to a same-origin route first.
$inter = BundledFonts::interAsset(fn (array $file) => '/site-fonts/'.$file['sha256'].'.woff2');
$resolve = fn (array $ref) => $ref['source'] === 'bundled' && $ref['family'] === 'Inter' ? $inter : null;

$page = PageRenderer::render($doc, fontResolver: $resolve, fontDisplay: 'swap');
```

In React, pass the same `fontResolver` and `fontDisplay` to `CmsPage`, `CmsRegion`, `Editor`, `Canvas`, `EditablePage` or `emitDocCss`. Use `swap` for live pages and `block` for captures. A missing or invalid font throws `FontResolutionException` with a constant `reason` rather than falling back silently. The full contract is `agent-guide/fonts.md` in the fancy-cms package.

**`@particle-academy/last-word-ui` (0.3.0+)** bundles Carlito (above). By default (`injectStyles`) it renders its CSS, including the `@font-face` rules, as a hoisted `<style>`. Under a CSP without `'unsafe-inline'` styles, pass `injectStyles={false}` and import the same rules, which also declare the bundled font:

```ts
import '@particle-academy/last-word-ui/styles.css';
```

Your bundler emits the font files from that import; allow them in `font-src` (`'self'` covers it when you serve them yourself). On the CommonJS build, import `styles.css` too, or the viewer reports `font: "fallback"`.
