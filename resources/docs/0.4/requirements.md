Fancy UI targets modern browsers. Nothing here is a policy we picked in the abstract — each number below is set by a specific thing the kit is built on, and this page says which, so you can tell what you'd have to give up to go lower.

## Supported browsers

| Browser | Minimum | Released | What sets it |
|---|---|---|---|
| **Chrome** | 111 | Mar 2023 | CSS `color-mix()` |
| **Edge** | 111 | Mar 2023 | Chromium — tracks Chrome |
| **Safari** (macOS) | 16.4 | Mar 2023 | CSS `@property` |
| **Safari** (iOS / iPadOS) | 16.4 | Mar 2023 | CSS `@property` |
| **Firefox** | 128 | Jul 2024 | CSS `@property` |

**Chromium-based browsers** — Brave, Arc, Opera, Vivaldi, Samsung Internet — are supported at whatever release tracks Chrome 111 or newer. Android WebView follows the same floor as Chrome.

**On iOS and iPadOS every browser is WebKit**, including Chrome and Firefox. The iOS *version* is what decides support there, not which browser app you open.

## Where those numbers come from

Two layers set a floor, and the higher one wins:

| Layer | Chrome / Edge | Safari / iOS | Firefox |
|---|---|---|---|
| **JavaScript** — the build target | 111 | 16.4 | 114 |
| **CSS** — Tailwind CSS v4 | 111 | 16.4 | 128 |
| **Effective minimum** | **111** | **16.4** | **128** |

The JS floor is Vite's default `baseline-widely-available` target, which is what compiled output is downlevelled to. The CSS floor is [Tailwind CSS v4's own support target](https://tailwindcss.com/docs/compatibility) — the whole UI layer is built on it, so it is not something an app can opt out of.

Firefox is the only browser where the two disagree, and CSS is why: `@property` (used for animatable custom properties) did not land in Firefox until 128, fourteen releases after the JS target was met.

## Below the minimum

**A page still returns real content.** Every showcase route is server-rendered, so an unsupported browser — or one with JavaScript off entirely — receives complete HTML rather than a blank shell. Search engines and agents see the same.

**It will not look right, and it is not tested.** Below the floor, `color-mix()` and `@property` declarations are dropped rather than approximated, which takes most colours and several spacing tokens with them. Expect visible breakage, not a graceful downgrade. We do not test below these versions and do not ship fixes for them.

Not supported at all: Internet Explorer, and Edge 18 and earlier (pre-Chromium).

## Requirements beyond the browser version

### Secure context — HTTPS or `localhost`

Three capabilities are restricted by browsers to secure contexts, and will not work over plain HTTP on a non-local host:

- **Passkeys** (`fancy-passkeys-ui`) — WebAuthn refuses to run otherwise.
- **PWA / offline** (`fancy-pwa`) — service workers cannot be registered.
- **Copy to clipboard** — `navigator.clipboard` is unavailable.

`localhost` counts as secure, so local development is unaffected. A staging box on bare HTTP is not, and this is the usual cause of "it works locally".

### Per-feature notes

| Feature | Needs | Notes |
|---|---|---|
| **3D** — `fancy-3d-three`, `fancy-3d-babylon` | WebGL 2 | Supported well below the baseline, but requires hardware acceleration to be enabled. `fancy-3d` on its own renders via DOM/CSS 3D and needs no WebGL at all. |
| **Passkeys** — `fancy-passkeys-ui` | WebAuthn + a platform authenticator | Every supported browser can complete a passkey ceremony. Autofill ("conditional UI") and cross-device sign-in vary by browser and OS; treat both as progressive enhancement and keep a fallback. |
| **Install to home screen** — `fancy-pwa` | Service worker | The install *prompt* is Chromium-only. On iOS, install is a manual Share → Add to Home Screen; there is no prompt to trigger. |
| **Live agent co-driving** — `agent-integrations` | `EventSource` or WebSocket | Supported everywhere above the baseline. Corporate proxies that buffer streaming responses are the usual failure, not the browser. |
| **Terminal** — `fancy-term` | Canvas | No extra floor. |

### Screen size

There is no minimum. Components are responsive from 320 px up, and the docs and showcase are exercised at that width. Editor surfaces — the flow editor, whiteboard, artboard and spreadsheet — are usable on a phone but are designed for a pointer and a larger canvas.

## Server requirements

The PHP packages and the starter kit have different floors, because the kit pins a tested stack while the packages stay installable in older apps.

| | Individual packages | Laravel starter kit |
|---|---|---|
| **PHP** | 8.2 | 8.3 |
| **Laravel** | 11, 12 or 13 | 13 |

`fancy-flow-php` is the one exception on the package side: it requires PHP 8.3, matching the kit.

### Node

| | Minimum |
|---|---|
| **Build** (Vite) | 20.19, or 22.12+ |
| **Node packages at runtime** — `holy-sheet-js`, `last-word-js`, `fancy-term-host`, … | 18 |

Node is a build-time requirement. Serving a built Laravel app needs no Node at all unless you run the Inertia SSR daemon, which does.

## Which version this page describes

This page describes **kit v0.4**, shown in the footer of every page alongside the `react-fancy` release the site is built with. Individual packages carry their own version numbers; the kit tag is the set of them that were released and tested together.
