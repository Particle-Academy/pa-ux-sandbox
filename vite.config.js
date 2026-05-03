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
            '@particle-academy/react-fancy': path.resolve(__dirname, 'packages/react-fancy/src'),
            '@particle-academy/fancy-echarts': path.resolve(__dirname, 'packages/fancy-echarts/src'),
            '@particle-academy/fancy-code': path.resolve(__dirname, 'packages/fancy-code/src'),
            '@particle-academy/fancy-sheets': path.resolve(__dirname, 'packages/fancy-sheets/src'),
            '@particle-academy/fancy-3d/babylon': path.resolve(__dirname, 'packages/fancy-3d/src/babylon.ts'),
            '@particle-academy/fancy-3d/dom': path.resolve(__dirname, 'packages/fancy-3d/src/dom.tsx'),
            '@particle-academy/fancy-3d/react': path.resolve(__dirname, 'packages/fancy-3d/src/react.tsx'),
            '@particle-academy/fancy-3d': path.resolve(__dirname, 'packages/fancy-3d/src'),
            '@particle-academy/fancy-tsrx': path.resolve(__dirname, 'packages/fancy-tsrx/src'),
            '@particle-academy/fancy-screens': path.resolve(__dirname, 'packages/fancy-screens/src'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1100,
    },
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
