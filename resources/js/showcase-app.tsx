import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { FancyAppRoot } from "@particle-academy/fancy-inertia";
import "./showcase-theme";
import "@particle-academy/react-fancy/styles.css";

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
    },
});
