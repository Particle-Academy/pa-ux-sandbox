import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { FancyAppRoot } from "@particle-academy/fancy-inertia";
import { mountPixel } from "@particle-academy/fancy-pixel";
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
            <FancyAppRoot>
                <App {...props} />
            </FancyAppRoot>,
        );

        // Dogfood: the showcase is itself a Fancy UI site, so it wears its own
        // Fancy Pixel. One all-in-one embed — the floating "Powered by Fancy UI"
        // badge AND first-party interaction analytics streamed to our own
        // /heuristics endpoint (keyed by this site_key). Mounted here, once,
        // outside Inertia's page swaps so it persists across navigation.
        mountPixel({
            style: "badge",
            mode: "floating",
            siteKey: "fancy-ui-showcase",
            endpoint: "/heuristics",
        });
    },
});
