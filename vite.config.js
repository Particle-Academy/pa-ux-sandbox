import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tsrxReact } from '@tsrx/vite-plugin-react';
import { fancyPwa } from '@particle-academy/fancy-pwa/vite';

const withSelectorShim = fileURLToPath(
    new URL('./resources/js/shims/use-sync-external-store-with-selector.js', import.meta.url),
);

const emptyShim = fileURLToPath(new URL('./resources/js/shims/empty.js', import.meta.url));

/**
 * Resolve Node built-ins to an empty module in the BROWSER build only. Isomorphic
 * deps (e.g. @particle-academy/dark-slide) dynamically `import('fs')` in a
 * Node-only branch that never runs in the browser — without this, the client
 * build prints "Module 'fs' has been externalized for browser compatibility".
 * Gated on `!options.ssr` so the SSR build keeps real `fs`.
 */
const nodeBuiltinBrowserShim = {
    name: 'shim-node-builtins-browser',
    enforce: 'pre',
    resolveId(id, _importer, options) {
        if (! options?.ssr && (id === 'fs' || id === 'node:fs')) {
            return emptyShim;
        }
        return null;
    },
};

/**
 * Redirects zustand v4's import of the CJS-only
 * `use-sync-external-store/shim/with-selector.js` to a local ESM polyfill.
 *
 * `resolve.alias` doesn't catch this under rolldown-vite — the deep
 * subpath resolves through the package `exports` map before alias runs.
 * A `resolveId` hook with `enforce: 'pre'` intercepts the bare specifier
 * first. React 19 has useSyncExternalStore natively, so the polyfill only
 * re-implements the selector memoization layer. Without this, the broken
 * `require("react")` lands in the lazy component-preview chunk and throws
 * "Calling require for react" at runtime.
 */
const useSyncExternalStoreShim = {
    name: 'shim-use-sync-external-store-with-selector',
    enforce: 'pre',
    resolveId(id) {
        // Match both the bare specifier (main graph) and the resolved
        // absolute path (dep-optimizer/vendor graph), with Windows
        // backslashes normalized.
        const norm = id.replace(/\\/g, '/');
        if (
            norm.endsWith('use-sync-external-store/shim/with-selector.js') ||
            norm.endsWith('use-sync-external-store/shim/with-selector')
        ) {
            return withSelectorShim;
        }
        return null;
    },
};

export default defineConfig({
    plugins: [
        useSyncExternalStoreShim,
        nodeBuiltinBrowserShim,
        // Emits public/build/{manifest.webmanifest,sw.js} on `vite build`. Placed
        // immediately before laravel() so the Laravel plugin sees the emitted
        // assets. registerSw:false — the blade injects the registration manually
        // (no index.html in a Laravel host). The plugin is base-aware, so the
        // precache list is rewritten to the resolved /build/ base.
        fancyPwa({
            sw: 'resources/js/sw.ts',
            swDest: 'sw.js',
            manifestDest: 'manifest.webmanifest',
            registerSw: false,
            manifest: {
                name: 'Fancy UI Showcase',
                short_name: 'Fancy UI',
                description: 'Components for the surfaces where humans and agents work together.',
                start_url: '/',
                scope: '/',
                display: 'standalone',
                theme_color: '#0b0b0f',
                background_color: '#0b0b0f',
                icons: [
                    { src: '/showcase-assets/fancy-ui-logo.jpg', sizes: '192x192 512x512', type: 'image/jpeg', purpose: 'any' },
                ],
            },
        }),
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/react-demos.css',
                'resources/js/react-demos.tsx',
                'resources/css/showcase.css',
                'resources/js/showcase-app.tsx',
            ],
            // SSR entry — `vite build --ssr` bundles this to bootstrap/ssr so the
            // Inertia SSR node process (createFancyServer) renders the showcase's
            // content into the first byte. See resources/js/ssr.tsx.
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        tsrxReact(),
        react(),
        tailwindcss(),
    ],
    resolve: {
        // Dedupe React so every dep tree (some `@particle-academy/*` packages
        // ship their own React in devDependencies for standalone builds) lands
        // on the sandbox's single React instance. Without this, hooks called
        // from inside an installed package would return null.
        dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
    optimizeDeps: {
        // Exclude the zustand consumers from dep pre-bundling so their
        // transitive import of `use-sync-external-store/shim/with-selector.js`
        // flows through the main resolve pipeline — where the
        // `shim-use-sync-external-store` plugin above redirects it to the ESM
        // polyfill. Pre-bundled, the optimizer resolves that import
        // internally and the broken CJS `require("react")` survives into a
        // lazy chunk. (@xyflow/react hard-pins zustand ^4.4, which still uses
        // the CJS shim on its createWithEqualityFn path.)
        exclude: ['zustand', '@xyflow/react'],
    },
    build: {
        // Keep peak build memory down so the production build isn't OOM-killed
        // on the RAM-limited Forge box during "rendering chunks".
        // `reportCompressedSize` gzip/brotli-compresses every emitted chunk just
        // to print sizes — for the ~13MB Babylon barrel that's a large transient
        // buffer we don't need. Sourcemaps roughly double the in-memory output.
        // Pair with swap on the server (the durable fix); see deploy notes.
        reportCompressedSize: false,
        sourcemap: false,
        // No manual codeSplitting `groups`. They were COUNTERPRODUCTIVE: a
        // rolldown group hoists every matching module into one named chunk that
        // the entry statically imports — so Babylon (~1.6MB) and the lucide
        // barrel (~560KB) were being downloaded EAGERLY on the home page even
        // though only lazy routes use them. Letting rolldown split at the
        // natural dynamic-import boundaries instead keeps them in their own lazy
        // chunks: the 3D demos pull Babylon only when visited, and react-fancy's
        // <Icon name> auto-fallback dynamic-imports lucide only on pages that
        // use it (e.g. admin). ECharts stays eager — showcase-app calls
        // registerEChartsAll() synchronously for first-frame hero previews — so
        // it lands in the shared entry chunk by design.
        //
        // Babylon also gets granular @babylonjs/core imports (in the
        // fancy-3d-babylon package + the sandbox demos) so the lazy 3D chunk is
        // ~1.6MB, not the whole ~6MB engine barrel.
        chunkSizeWarningLimit: 3000,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
