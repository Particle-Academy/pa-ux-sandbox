import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tsrxReact } from '@tsrx/vite-plugin-react';

const withSelectorShim = fileURLToPath(
    new URL('./resources/js/shims/use-sync-external-store-with-selector.js', import.meta.url),
);

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
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/react-demos.css',
                'resources/js/react-demos.tsx',
                'resources/css/showcase.css',
                'resources/js/showcase-app.tsx',
            ],
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
        // Vendor-chunk the heavy libraries. Without this, every entry's
        // shared-chunk graph promotes them into the "core" bundle, which
        // produced two ~4MB core-*.js files (one per entry: showcase-app +
        // react-demos). Splitting them out shrinks the eagerly-loaded core
        // dramatically — Babylon (~4MB), ECharts (~500KB), react-flow,
        // and lucide-react each live in their own chunk that's only
        // downloaded when a route actually uses it.
        rolldownOptions: {
            output: {
                advancedChunks: {
                    groups: [
                        { name: 'babylonjs', test: /[\\/]node_modules[\\/]@babylonjs[\\/]core[\\/]/ },
                        { name: 'echarts', test: /[\\/]node_modules[\\/](echarts|echarts-gl|zrender)[\\/]/ },
                        { name: 'react-flow', test: /[\\/]node_modules[\\/]@xyflow[\\/]/ },
                        { name: 'lucide-react', test: /[\\/]node_modules[\\/]lucide-react[\\/]/ },
                    ],
                },
            },
        },
        // Two vendor chunks exceed the default 500KB heuristic by design:
        // babylonjs (~13MB — @babylonjs/core ships as a tree-shake-hostile
        // barrel) and echarts (~1.5MB — combined echarts + echarts-gl +
        // zrender). Both are split out as separate vendor chunks above,
        // only fetched by routes that actually use them. The size limit
        // is bumped past the larger of the two so the warning stops
        // firing on intentional vendor splits — anything new above 1.5MB
        // is still flagged.
        chunkSizeWarningLimit: 15000,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
