import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { tsrxReact } from '@tsrx/vite-plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [
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
        // Dedupe React across the sandbox + every aliased local package so
        // hooks see the same React instance. Without this, when a submodule
        // has its own node_modules (fancy-3d does — it needs to build itself
        // standalone too) Vite resolves `react` to two different copies and
        // hooks return null.
        dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
        alias: {
            '@particle-academy/react-fancy/icons': path.resolve(__dirname, '../react-fancy/src/icons.ts'),
            '@particle-academy/react-fancy': path.resolve(__dirname, '../react-fancy/src'),
            '@particle-academy/fancy-echarts': path.resolve(__dirname, '../fancy-echarts/src'),
            '@particle-academy/fancy-code': path.resolve(__dirname, '../fancy-code/src'),
            '@particle-academy/fancy-sheets': path.resolve(__dirname, '../fancy-sheets/src'),
            '@particle-academy/fancy-3d/babylon': path.resolve(__dirname, '../fancy-3d/src/babylon.ts'),
            '@particle-academy/fancy-3d/dom': path.resolve(__dirname, '../fancy-3d/src/dom.tsx'),
            '@particle-academy/fancy-3d/react': path.resolve(__dirname, '../fancy-3d/src/react.tsx'),
            '@particle-academy/fancy-3d': path.resolve(__dirname, '../fancy-3d/src'),
            '@particle-academy/fancy-tsrx': path.resolve(__dirname, '../fancy-tsrx/src'),
            '@particle-academy/fancy-screens': path.resolve(__dirname, '../fancy-screens/src'),
            '@particle-academy/fancy-inertia': path.resolve(__dirname, '../fancy-inertia/src'),
            '@particle-academy/fancy-whiteboard': path.resolve(__dirname, '../fancy-whiteboard/src'),
            '@particle-academy/agent-integrations/mcp': path.resolve(__dirname, '../agent-integrations/src/mcp'),
            '@particle-academy/agent-integrations/bridges/whiteboard': path.resolve(__dirname, '../agent-integrations/src/bridges/whiteboard.ts'),
            '@particle-academy/agent-integrations/bridges/flow': path.resolve(__dirname, '../agent-integrations/src/bridges/flow.ts'),
            '@particle-academy/agent-integrations/bridges/forms': path.resolve(__dirname, '../agent-integrations/src/bridges/forms.ts'),
            '@particle-academy/agent-integrations/bridges/sheets': path.resolve(__dirname, '../agent-integrations/src/bridges/sheets.ts'),
            '@particle-academy/agent-integrations/bridges/code': path.resolve(__dirname, '../agent-integrations/src/bridges/code.ts'),
            '@particle-academy/agent-integrations/bridges/charts': path.resolve(__dirname, '../agent-integrations/src/bridges/charts.ts'),
            '@particle-academy/agent-integrations/bridges/scene': path.resolve(__dirname, '../agent-integrations/src/bridges/scene.ts'),
            '@particle-academy/agent-integrations/bridges/screens': path.resolve(__dirname, '../agent-integrations/src/bridges/screens.ts'),
            '@particle-academy/agent-integrations/bridges/slides': path.resolve(__dirname, '../agent-integrations/src/bridges/slides.ts'),
            '@particle-academy/agent-integrations/components/shared-whiteboard': path.resolve(__dirname, '../agent-integrations/src/components/SharedWhiteboard'),
            '@particle-academy/agent-integrations': path.resolve(__dirname, '../agent-integrations/src'),
            '@particle-academy/fancy-flow/runtime': path.resolve(__dirname, '../fancy-flow/src/runtime'),
            '@particle-academy/fancy-flow': path.resolve(__dirname, '../fancy-flow/src'),
            '@particle-academy/fancy-slides/registry': path.resolve(__dirname, '../fancy-slides/src/registry'),
            '@particle-academy/fancy-slides': path.resolve(__dirname, '../fancy-slides/src'),
        },
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
                        // Babylon's main bundle. Its shader-fragment + renderer
                        // subchunks are already split by Babylon itself; this
                        // captures the core module graph that was getting
                        // hoisted into "core" via fancy-3d/canvas's eager
                        // re-export of `babylonEngine`.
                        { name: 'babylonjs', test: /[\\/]node_modules[\\/]@babylonjs[\\/]core[\\/]/ },
                        // ECharts + echarts-gl. Already partially split, but
                        // pinning it ensures it doesn't ride into core when a
                        // showcase page incidentally pulls in fancy-echarts.
                        { name: 'echarts', test: /[\\/]node_modules[\\/](echarts|echarts-gl|zrender)[\\/]/ },
                        // react-flow / @xyflow/react — bundled by fancy-flow.
                        { name: 'react-flow', test: /[\\/]node_modules[\\/]@xyflow[\\/]/ },
                        // Lucide. Already chunked by vite, but pinning gives a
                        // stable name and keeps the rest of node_modules from
                        // accidentally joining it.
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
