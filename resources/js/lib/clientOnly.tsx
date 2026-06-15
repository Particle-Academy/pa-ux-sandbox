import { useEffect, useState, type ComponentType } from "react";

/**
 * Defer a component to the CLIENT via dynamic import — no SSR import, no Suspense.
 *
 * Unlike `FancyClientOnly` (which only gates RENDER but still imports the module),
 * this defers the IMPORT itself: the loaded module lands in its own chunk that is
 * fetched only in the browser. Use it for demo/widget sub-trees that pull
 * browser-only libs (xterm, CodeMirror, Babylon, ECharts) which would otherwise
 * crash the synchronous SSR render (Inertia v3 renders with `renderToString`,
 * which can't use React.lazy/Suspense).
 *
 * SSR + first client paint render `fallback` (so server and client markup match —
 * no hydration mismatch); the real component swaps in after `useEffect` resolves.
 *
 *   const ComponentDemo = clientOnly(() => import("./ComponentDemo").then((m) => ({ default: m.ComponentDemo })));
 */
export function clientOnly<P extends object>(
    loader: () => Promise<{ default: ComponentType<P> }>,
    fallback: ComponentType<P> | null = null,
): ComponentType<P> {
    function ClientOnly(props: P) {
        const [Loaded, setLoaded] = useState<ComponentType<P> | null>(null);
        useEffect(() => {
            let active = true;
            void loader().then((m) => {
                if (active) {
                    setLoaded(() => m.default);
                }
            });
            return () => {
                active = false;
            };
        }, []);
        if (Loaded) {
            return <Loaded {...props} />;
        }
        const Fallback = fallback;
        return Fallback ? <Fallback {...props} /> : null;
    }
    ClientOnly.displayName = "ClientOnly";

    return ClientOnly;
}
