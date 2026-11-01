# Geist and Geist Mono (self-hosted web fonts)

The showcase's UI and code typefaces, served from this app's own origin as
Vite-built assets. They are never hot-linked from a font CDN; see the kit's
typography guide, `resources/docs/typography.md`.

| | |
|---|---|
| Family | Geist, Geist Mono |
| Copyright | Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font) |
| Licence | SIL Open Font License, Version 1.1 (`OFL.txt` in this directory, copied verbatim from the release) |
| Upstream | https://github.com/vercel/geist-font |
| Release | v1.9.0, published 2026-10-30T14:42:25Z |
| Source archive | https://github.com/vercel/geist-font/releases/download/v1.9.0/geist-font-v1.9.0.zip |
| Archive sha256 | `1f2dd9ea90e68d0358a1d234a5f156807b2c3e0e295d78d87980a6dbad1fa58c` (matches the digest GitHub publishes for the release asset) |
| Fetched | 2026-11-01 |
| Approval | The owner approved Google Fonts families as a source on 2026-10-26, provided the files are served same-origin. Geist is OFL; it is taken here from its authoritative upstream rather than from Google. Fonts are the relaxed third-party category in the envelope `RULES.md` (static data, not executing code). |

## Files

The font bytes are UNMODIFIED. Only the file names changed: the release's
`[wght]` brackets are awkward in URLs.

| File here | Path in the release archive | sha256 |
|---|---|---|
| `Geist-Variable.woff2` | `geist-font/Geist/webfonts/Geist[wght].woff2` | `5c5588027e59e74e205b9d6c7fd877b261091cee367f6bb3a8d505da14cae512` |
| `GeistMono-Variable.woff2` | `geist-font/GeistMono/webfonts/GeistMono[wght].woff2` | `cf5bf55f69e043b1ecf04b0719119b7298e94add67ebcaa709a925b945b46b25` |
| `OFL.txt` | `geist-font/OFL.txt` | `c683bfbcc7e087f5d37a54ef628f10387c451a83ddc459b151403a164ac46c90` |

Both faces are variable on the weight axis (100 to 900), upright only. The site
never loaded an italic face, so italics remain browser-synthesised, as before.

The static `Geist-*.ttf` files in the parent directory are a separate copy used
server-side by `App\Support\OgCardRenderer` to draw Open Graph cards; they are
not served to browsers.
