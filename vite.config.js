import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import path from 'path'

export default defineConfig(({ mode }) => {
    const prod = mode === 'production';
    const env = loadEnv(mode, process.cwd(), '');
    const base = env.BASE_URI || '/';
    let outDir =`static/${prod ? 'prod' : 'dev'}`;
    return {
        define: {
            'process.env.NODE_ENV': prod,
            VITE_APP_DOMAIN: JSON.stringify(env.APP_URL),
            VITE_APP_URL: JSON.stringify(`${env.APP_URL}${env.BASE_URI_API}`),
            VITE_CDN_URL: JSON.stringify(`${env.APP_CDN_URL}${env.BASE_URI}`),
            VITE_BASE_URI: JSON.stringify(env.BASE_URI),
            VITE_BASE_URI_API: JSON.stringify(env.BASE_URI_API),
        },
        mode: mode === 'dist' ? 'development' : 'production',
        base,
        publicDir: false,
        plugins: [
            react(),
            createHtmlPlugin({
                minify: prod,
                inject: {
                    data: {
                        title: prod ? 'UpForm - Contact Form Builder' : 'UpForm - Development',
                    },
                },
            })
        ],
        build: {
            outDir: outDir,
            emptyOutDir: true,
            rollupOptions:{
                input: {
                    main: 'index.html',
                }
            },
            sourcemap: !prod,
            chunkSizeWarningLimit: 300,
            minify: prod ? 'terser' : false,
            terserOptions: prod ? {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                    pure_funcs: ['console.log'],
                },
            } : undefined,
            reportCompressedSize: prod,
        },
        resolve: {
            alias: {
                '@': '/resources/js',
                '@images': path.resolve(__dirname, `public/images`),
            },
        },
    }
});
