import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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
        react(),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@particle-academy/react-fancy': path.resolve(__dirname, 'packages/react-fancy/src'),
            '@particle-academy/react-echarts': path.resolve(__dirname, 'packages/react-echarts/src'),
            '@particle-academy/fancy-code': path.resolve(__dirname, 'packages/fancy-code/src'),
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
