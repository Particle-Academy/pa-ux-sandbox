import type { ComponentDoc } from "./types";
import {
    InstallBanner,
    OfflineBanner,
    useInstallPrompt,
    useOnline,
} from "@particle-academy/fancy-pwa";
import "@particle-academy/fancy-pwa/styles.css";

/**
 * Contained, SEO-safe fancy-pwa demo.
 *
 * The showcase itself is intentionally NOT a service-worker PWA — it serves
 * dynamic / SSR content, and a precaching SW broke production by serving its
 * offline page to online users. So this page demos ONLY the SW-free surface of
 * @particle-academy/fancy-pwa: the hooks and banners that work standalone,
 * without mounting <FancyPwaProvider>, calling registerFancyPwa(), or shipping a
 * manifest. Nothing here registers a service worker.
 *
 * The parts that DO need a build step (the fancyPwa() Vite plugin + the /sw
 * toolkit) are shown as static code examples, not live.
 */

/** Live navigator.onLine indicator — flips when you toggle DevTools offline. */
function OnlineIndicator() {
    const online = useOnline();
    return (
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-800 dark:bg-zinc-900">
            <span
                className={`size-2.5 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`}
                aria-hidden
            />
            {online ? "Online" : "Offline"}
        </div>
    );
}

/** Reads useInstallPrompt() and surfaces its { canInstall, installed } state. */
function InstallState() {
    const { canInstall, installed } = useInstallPrompt();
    return (
        <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
                canInstall: <code>{String(canInstall)}</code>
            </span>
            <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-800 dark:bg-zinc-900">
                installed: <code>{String(installed)}</code>
            </span>
        </div>
    );
}

export const pwaDoc: ComponentDoc = {
    intro: (
        <div className="space-y-2">
            <p>
                Lean, framework-agnostic, SSR-safe PWA layer — an install prompt, online/offline
                hooks, a Workbox-free service-worker toolkit, a <code>fancyPwa()</code> Vite plugin,
                and update detection composed on <code>fancy-app-update</code>.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Note: this showcase is intentionally <strong>not</strong> a service-worker PWA — it
                serves dynamic / SSR content. The demos below use only the SW-free surface
                (hooks + banners that work standalone), so this page registers{" "}
                <strong>no service worker</strong> and adds <strong>no manifest</strong>. The
                build-step pieces (Vite plugin + <code>sw.ts</code>) are shown as static code.
            </p>
        </div>
    ),
    examples: [
        {
            name: "useOnline() — live indicator",
            description:
                "Reactive navigator.onLine. Toggle DevTools → Network → Offline and watch it flip. SSR-safe (returns true on the server).",
            render: () => <OnlineIndicator />,
            code: `import { useOnline } from "@particle-academy/fancy-pwa";

function OnlineIndicator() {
    const online = useOnline();
    return <span>{online ? "Online" : "Offline"}</span>;
}`,
        },
        {
            name: "<OfflineBanner />",
            description:
                "A persistent, accessible (aria-live) offline notice. It renders nothing while you're online — so it's blank here unless you go offline. Safe to always mount.",
            render: () => (
                <div className="w-full">
                    <OfflineBanner />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        (Nothing shows above until the browser reports offline.)
                    </p>
                </div>
            ),
            code: `import { OfflineBanner } from "@particle-academy/fancy-pwa";

// Renders only while navigator.onLine is false.
<OfflineBanner />`,
        },
        {
            name: "<InstallBanner />",
            description:
                "A dismissible install nudge on react-fancy Callout + Button. It appears only when the browser has offered an install prompt and the app isn't already installed — which won't happen here, because the showcase ships no site service worker. That's intentional.",
            render: () => (
                <div className="w-full">
                    <InstallBanner />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        (Stays hidden here — no installable SW/manifest is shipped by the showcase.)
                    </p>
                </div>
            ),
            code: `import { InstallBanner } from "@particle-academy/fancy-pwa";

// Renders only when the browser deems the app installable.
<InstallBanner />`,
        },
        {
            name: "useInstallPrompt() — state",
            description:
                "Capture the browser's install prompt and expose a one-call installer. Here we show its { canInstall, installed } state. SSR-safe (inert defaults on the server).",
            render: () => <InstallState />,
            code: `import { useInstallPrompt } from "@particle-academy/fancy-pwa";

function InstallButton() {
    const { canInstall, installed, promptInstall } = useInstallPrompt();
    if (installed || !canInstall) return null;
    return <button onClick={promptInstall}>Install app</button>;
}`,
        },
        {
            name: "Build-step: the fancyPwa() Vite plugin",
            description:
                "Turning an app into a real SW-PWA needs a build step. The Vite plugin emits the manifest + a precaching service worker. (Shown as code — NOT run here, so nothing registers a SW.)",
            render: () => (
                <pre className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                    {`// vite.config.ts
import { fancyPwa } from "@particle-academy/fancy-pwa/vite";

export default defineConfig({
    plugins: [
        fancyPwa({
            sw: "src/sw.ts",            // your service-worker entry
            swDest: "sw.js",
            manifestDest: "manifest.webmanifest",
            manifest: {
                name: "My App",
                short_name: "My App",
                start_url: "/",
                display: "standalone",
                theme_color: "#0b0b0f",
            },
        }),
    ],
});`}
                </pre>
            ),
            code: `import { fancyPwa } from "@particle-academy/fancy-pwa/vite";

fancyPwa({
    sw: "src/sw.ts",
    swDest: "sw.js",
    manifestDest: "manifest.webmanifest",
    manifest: { name: "My App", start_url: "/", display: "standalone" },
});`,
        },
        {
            name: "Build-step: the /sw service-worker toolkit",
            description:
                "Your sw.ts composes the Workbox-free toolkit — precache + routing strategies + an offline fallback. (Shown as code only — this page never installs a worker.)",
            render: () => (
                <pre className="w-full overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed dark:border-zinc-800 dark:bg-zinc-900">
                    {`// src/sw.ts
import {
    precache,
    registerRoute,
    cacheFirst,
    networkFirst,
    staleWhileRevalidate,
    offlineFallback,
} from "@particle-academy/fancy-pwa/sw";

precache(globalThis.__FANCY_PRECACHE || []);
registerRoute((req) => new URL(req.url).pathname.startsWith("/build/"), cacheFirst());
registerRoute((req) => req.mode === "navigate", staleWhileRevalidate());
offlineFallback("/offline");`}
                </pre>
            ),
            code: `import { precache, registerRoute, cacheFirst, offlineFallback } from "@particle-academy/fancy-pwa/sw";

precache(globalThis.__FANCY_PRECACHE || []);
registerRoute((req) => req.mode === "navigate", cacheFirst());
offlineFallback("/offline");`,
        },
    ],
    props: [
        {
            name: "useOnline()",
            type: `() => boolean`,
            default: "—",
            description: "Reactive navigator.onLine. SSR-safe — true on the server.",
        },
        {
            name: "useInstallPrompt()",
            type: `() => { canInstall, installed, promptInstall, dismissed, dismiss }`,
            default: "—",
            description: "Captures the browser install prompt + a one-call installer. SSR-safe.",
        },
        {
            name: "<OfflineBanner color? children? />",
            type: `(props) => JSX | null`,
            default: "—",
            description: "Callout-based offline notice. Renders null while online.",
        },
        {
            name: "<InstallBanner color? title? installLabel? />",
            type: `(props) => JSX | null`,
            default: "—",
            description: "Dismissible install nudge. Renders null unless the app is installable.",
        },
        {
            name: "fancyPwa(options)",
            type: `VitePlugin`,
            default: "—",
            description: "Vite plugin — emits the manifest + service worker at build time.",
        },
    ],
    notes: (
        <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
            <p>
                <strong>SW-free here by design.</strong> This page mounts no{" "}
                <code>&lt;FancyPwaProvider&gt;</code> and never calls{" "}
                <code>registerFancyPwa()</code> — the hooks + banners above all work standalone, so
                no service worker is registered and no manifest is added.
            </p>
            <p>
                <strong>To make a real PWA</strong> in your own app: add the{" "}
                <code>fancyPwa()</code> Vite plugin, ship the emitted{" "}
                <code>manifest.webmanifest</code>, register the worker, and (optionally) mount{" "}
                <code>&lt;FancyPwaProvider&gt;</code> + <code>&lt;UpdateToast /&gt;</code> for
                propose-then-confirm update prompts.
            </p>
        </div>
    ),
};
