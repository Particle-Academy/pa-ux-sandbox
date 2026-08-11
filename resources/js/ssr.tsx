import { createFancyServer } from "@particle-academy/fancy-inertia/server";
import type { ComponentType } from "react";
import { SeoProvider, defineSeo } from "@particle-academy/fancy-inertia/seo";
import type { ReactNode } from "react";
import { Toast } from "@particle-academy/react-fancy";
import { ScreenSystem } from "@particle-academy/fancy-screens";
import { FancyDataRoot } from "@particle-academy/fancy-query";
import { registerAll as registerEChartsAll, registerBuiltinThemes } from "@particle-academy/fancy-echarts";
import { registerBrandIcons } from "@particle-academy/fancy-brand-icons";
import { CoBrowseProvider } from "./agent/CoBrowseProvider";

// MUST mirror resources/js/showcase-app.tsx EXACTLY. These are pure, SSR-safe
// registrations (icon defs, echarts modules + themes) that change what
// components RENDER — e.g. <Icon name="github"> resolves the brand mark only
// after registerBrandIcons(). Calling them on the client but NOT here made the
// server render different icon SVGs than the client → React #418 hydration
// mismatch (the <span> inside a react-fancy <Button icon>). Register on both.
registerEChartsAll();
registerBuiltinThemes();
registerBrandIcons();

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
    // Client-only <Seo> — the fancy-seo Blade baseline owns the SSR head; without
    // this both emit it and every tag duplicates in the first byte (two <title>s).
    // MUST match showcase-app.tsx.
    clientOnly: true,
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
// several Inertia sites). HARDCODED to match config('inertia.ssr.url') in
// config/inertia.php (13733) — NOT read from env. The daemon
// (`php artisan inertia:start-ssr` → `node bootstrap/ssr/ssr.js`) runs with
// config cached, so it never loads .env; an env read here would fall back to a
// default that mismatches PHP's cached config → "can't connect". A literal on
// both sides is the only thing that can't drift. Change BOTH if you move ports.
const ssrPort = 13733;

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
        const pages = import.meta.glob<{ default: ComponentType }>("./Pages/**/*.tsx", { eager: false });
        const importer = pages[`./Pages/${name}.tsx`];
        if (!importer) {
            return Promise.reject(new Error(`Inertia page not found: ${name}`));
        }
        return importer().then((m) => m.default);
    },
    providers,
    appRoot: false,
});
