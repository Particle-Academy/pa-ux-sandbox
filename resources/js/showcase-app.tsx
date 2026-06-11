import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { FancyAppRoot, FancyTransitionProvider, FancyPageTransition } from "@particle-academy/fancy-inertia";
import type { ComponentType, ReactNode } from "react";
import { FancyDataRoot } from "@particle-academy/fancy-query";
import { registerAll as registerEChartsAll, registerBuiltinThemes } from "@particle-academy/fancy-echarts";
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
    setup({ App, props, el }) {
        createRoot(el).render(
            // FancyDataRoot provides the one shared QueryClient (+ Echo when a
            // consumer wires Reverb) so fancy-query hooks work app-wide. The
            // showcase dogfoods it on the Leaderboard (cached scope switching).
            <FancyAppRoot>
                <FancyDataRoot echo={null}>
                    {/* Page transitions: one persistent <FancyPageTransition> at
                        the App root crossfades every navigation (it lives ABOVE the
                        page so it survives the swap, even on pages that render
                        <Layout> inline). It applies each page's persistent `.layout`
                        itself, then reads the active transition from the provider so
                        the nav switcher re-scopes every nav. */}
                    <FancyTransitionProvider defaultTransition="fade">
                        <App {...props}>
                            {({ Component, key, props: pageProps }) => {
                                const Page = Component as ComponentType<Record<string, unknown>> & {
                                    layout?: (page: ReactNode) => ReactNode;
                                };
                                const child = <Page {...pageProps} />;
                                const rendered = Page.layout ? Page.layout(child) : child;
                                return <FancyPageTransition pageKey={key ?? ""}>{rendered}</FancyPageTransition>;
                            }}
                        </App>
                    </FancyTransitionProvider>
                </FancyDataRoot>
            </FancyAppRoot>,
        );
        // The showcase dogfoods its own Fancy Pixel through the *real* flow:
        // register the site in /showcase, then paste the generated tracker
        // snippet into Admin → Settings. It's injected server-side into the page
        // (see the tracker view-composer) exactly like any external consumer —
        // no hardcoded mount here.
    },
});
