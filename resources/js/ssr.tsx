import { createFancyServer } from "@particle-academy/fancy-inertia/server";
import { SeoProvider, defineSeo } from "@particle-academy/fancy-inertia/seo";
import type { ReactNode } from "react";
import { FancyDataRoot } from "@particle-academy/fancy-query";

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

// MUST match the client provider tree in showcase-app.tsx so SSR markup and the
// hydrated client tree are identical.
const providers = (outlet: ReactNode): ReactNode => (
    <FancyDataRoot echo={null}>
        <SeoProvider value={seoDefaults}>{outlet}</SeoProvider>
    </FancyDataRoot>
);

createFancyServer({
    // LAZY resolve (not eager) so booting the SSR process does NOT import every
    // page — only the page being rendered is imported per request. This keeps the
    // node process alive even though many demo pages statically import
    // browser-only widget libs (xterm, Babylon, CodeMirror, …): a widget-heavy
    // page that errors during SSR render simply falls back to client rendering
    // (Inertia's graceful degradation), while text/content pages render into the
    // first byte. createInertiaApp awaits the returned promise before rendering.
    resolve: (name) => {
        const pages = import.meta.glob<{ default: unknown }>("./Pages/**/*.tsx", { eager: false });
        const importer = pages[`./Pages/${name}.tsx`];
        if (!importer) {
            return Promise.reject(new Error(`Inertia page not found: ${name}`));
        }
        return importer().then((m) => m.default);
    },
    providers,
});
