import { createFancyServer } from "@particle-academy/fancy-inertia/server";
import { SeoProvider, defineSeo } from "@particle-academy/fancy-inertia/seo";
import type { ReactNode } from "react";
import { Toast } from "@particle-academy/react-fancy";
import { ScreenSystem } from "@particle-academy/fancy-screens";
import { FancyDataRoot } from "@particle-academy/fancy-query";
import { CoBrowseProvider } from "./agent/CoBrowseProvider";

// Server-side SEO defaults. Mirrors resources/js/showcase-app.tsx; `siteUrl` is
// omitted server-side (no window) — the particle-academy/fancy-seo Blade
// baseline already emits the canonical/OG/JSON-LD on the first byte, and the
// client <Seo> auto-canonical kicks in after hydration.
const seoDefaults = defineSeo({
    siteName: "Fancy UI",
    titleTemplate: "%s — Fancy UI",
    defaultTitle: "Fancy UI for React, Inertia, and Laravel | Human-Agent UI",
    defaultDescription: "Components for the surfaces where humans and agents work together.",
    defaultImage: "/showcase-assets/fancy-ui-logo.jpg",
    locale: "en_US",
});

// MUST match the client provider tree in showcase-app.tsx EXACTLY (same shape,
// eager — no Suspense) so SSR markup and the hydrated client tree are identical
// and renderToString doesn't abort. `appRoot: false` omits FancyAppRoot (whose
// default withScreens wraps children in <Suspense>); we mount ScreenSystem etc.
// eagerly here instead.
const providers = (outlet: ReactNode): ReactNode => (
    <Toast.Provider position="bottom-right">
        <ScreenSystem>
            <FancyDataRoot echo={null}>
                <SeoProvider value={seoDefaults}>
                    <CoBrowseProvider>{outlet}</CoBrowseProvider>
                </SeoProvider>
            </FancyDataRoot>
        </ScreenSystem>
    </Toast.Provider>
);

// Non-standard SSR port (Inertia's default 13714 collides when a server runs
// several Inertia sites). Read from the env so each site/deploy can set its own;
// MUST match config('inertia.ssr.url') in config/inertia.php. The daemon
// (`php artisan inertia:start-ssr` → `node bootstrap/ssr/ssr.js`) inherits this
// process's env, so set INERTIA_SSR_PORT on the daemon to override the default.
const ssrPort = Number(process.env.INERTIA_SSR_PORT) || 13731;

createFancyServer({
    port: ssrPort,
    // LAZY resolve (not eager) so booting the SSR process does NOT import every
    // page — only the page being rendered is imported per request. This keeps the
    // node process alive even though many demo pages statically import
    // browser-only widget libs (xterm, Babylon, CodeMirror, …): a widget-heavy
    // page that errors during SSR render simply falls back to client rendering
    // (Inertia's graceful degradation), while text/content pages render into the
    // first byte.
    resolve: (name) => {
        const pages = import.meta.glob<{ default: unknown }>("./Pages/**/*.tsx", { eager: false });
        const importer = pages[`./Pages/${name}.tsx`];
        if (!importer) {
            return Promise.reject(new Error(`Inertia page not found: ${name}`));
        }
        return importer().then((m) => m.default);
    },
    providers,
    appRoot: false,
});
