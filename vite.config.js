import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        base: env.BASE_URI,
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