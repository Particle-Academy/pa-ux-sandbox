import { createInertiaApp } from "@inertiajs/react";
import { setupFancyApp } from "@particle-academy/fancy-inertia";
import { SeoProvider, defineSeo } from "@particle-academy/fancy-inertia/seo";
import type { ReactNode } from "react";
import { Toast } from "@particle-academy/react-fancy";
import { ScreenSystem } from "@particle-academy/fancy-screens";
import { FancyDataRoot } from "@particle-academy/fancy-query";
import { registerAll as registerEChartsAll, registerBuiltinThemes } from "@particle-academy/fancy-echarts";
import { CoBrowseProvider } from "./agent/CoBrowseProvider";
import { getEcho } from "./lib/echo";
import "./showcase-theme";
import "@particle-academy/react-fancy/styles.css";
import "@particle-academy/fancy-code/styles.css";

// Register echarts modules synchronously before any component can render.
// FancyAppRoot does this in useEffect, but useEffect runs AFTER first render
// — so EChart components in the first paint would otherwise throw. We need
// this synchronous boot because the home page + every package detail page
// contains EChart-based previews that render in the first frame.
registerEChartsAll();
registerBuiltinThemes();

// Site-wide SEO defaults for the client <Seo> layer. Mirrors the
// particle-academy/fancy-seo server baseline (config/fancy-seo.php +
// SeoServiceProvider) so per-page <Seo> stays terse and SPA navigation keeps
// title/description in sync. `siteUrl` is window-guarded (SSR-safe).
const seoDefaults = defineSeo({
    siteName: "Fancy UI",
    titleTemplate: "%s — Fancy UI",
    defaultTitle: "Fancy UI for React, Inertia, and Laravel | Human-Agent UI",
    defaultDescription: "Components for the surfaces where humans and agents work together.",
    defaultImage: "/showcase-assets/fancy-ui-logo.jpg",
    locale: "en_US",
    siteUrl: typeof window !== "undefined" ? window.location.origin : undefined,
    // The fancy-seo Blade <x-fancy-seo::head> baseline owns the server head, so
    // <Seo> is client-only — otherwise, with SSR on, BOTH emit the head and every
    // tag duplicates in the first byte (two <title>s). See fancy-inertia SeoDefaults.
    clientOnly: true,
});

// The shared provider tree. Providers are mounted EAGERLY (no React.lazy /
// Suspense) so the tree renders synchronously under Inertia v3's `renderToString`
// SSR — FancyAppRoot's default `withScreens` would otherwise wrap children in
// <Suspense> and abort SSR to client rendering. We therefore pass `appRoot:
// false` and supply Toast + ScreenSystem + FancyDataRoot + SeoProvider here.
// MUST match resources/js/ssr.tsx EXACTLY (tree shape) for clean hydration.
const providers = (outlet: ReactNode): ReactNode => (
    <Toast.Provider position="bottom-right">
        <ScreenSystem>
            <FancyDataRoot echo={getEcho()}>
                <SeoProvider value={seoDefaults}>
                    <CoBrowseProvider>{outlet}</CoBrowseProvider>
                </SeoProvider>
            </FancyDataRoot>
        </ScreenSystem>
    </Toast.Provider>
);

createInertiaApp({
    resolve: (name) => {
        const pages = import.meta.glob<{ default: any }>("./Pages/**/*.tsx", { eager: false });
        const key = `./Pages/${name}.tsx`;
        const importer = pages[key];
        if (!importer) {
            return Promise.reject(new Error(`Inertia page not found: ${name}`));
        }
        return importer().then((m) => m.default);
    },
    // setupFancyApp builds the same providers → transition → page tree as
    // createFancyServer (resources/js/ssr.tsx) and auto-detects hydrateRoot vs
    // createRoot, so flipping Inertia SSR on/off is a no-op here.
    setup: ({ App, props, el }) => setupFancyApp({ el, App, props, providers, appRoot: false }),
});

// The showcase dogfoods its own Fancy Pixel through the *real* flow: register
// the site in /showcase, then paste the generated tracker snippet into
// Admin → Settings. It's injected server-side into the page (see the tracker
// view-composer) exactly like any external consumer — no hardcoded mount here.
