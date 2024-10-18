import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        base: env.BASE_URI,
        define: {
            'process.env.NODE_ENV': JSON.stringify(mode),
            VITE_APP_DOMAIN: JSON.stringify(env.APP_URL),
            VITE_APP_URL: JSON.stringify(`${env.APP_URL}${env.BASE_URI_API}`),
            VITE_CDN_URL: JSON.stringify(`${env.APP_CDN_URL}${env.BASE_URI}`),
            VITE_BASE_URI: JSON.stringify(env.BASE_URI),
            VITE_BASE_URI_API: JSON.stringify(env.BASE_URI_API),
            VITE_APP_SEARCH_URL: JSON.stringify(`${env.APP_URL}${env.BASE_URI_SEARCH}`),
            VITE_APP_CUSTOMER_URL: JSON.stringify(`${env.APP_URL}${env.BASE_URI_CUSTOMER}`),
            VITE_APP_LOGIN_URL: JSON.stringify(`${env.APP_URL}${env.BASE_URI_LOGIN}`),
            VITE_TINY_MCE_API_KEY: JSON.stringify(env.TINY_MCE_API_KEY),
        },
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 5173,
            hmr: {
                usePolling: true,
                followSymlinks: false,
            },
            watch: {
                usePolling: true,
                interval: 100
            }
        }
    }
})