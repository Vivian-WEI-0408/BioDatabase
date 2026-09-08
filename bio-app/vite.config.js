import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_PROXY_TARGET = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:9092/'
  const TPRO_API_PROXY_TARGET = env.VITE_TPRO_API_PROXY_TARGET || 'http://127.0.0.1:8004/'
  const TPRO_LEGACY_PROXY_TARGET = env.VITE_TPRO_LEGACY_PROXY_TARGET || TPRO_API_PROXY_TARGET
  const STATIC_PROXY_TARGET = env.VITE_STATIC_PROXY_TARGET || API_PROXY_TARGET
  const LABDB_PROXY_TARGET = env.VITE_LABDB_PROXY_TARGET || 'http://127.0.0.1:8000/'
  const WEBDB_PROXY_TARGET = env.VITE_WEBDB_PROXY_TARGET || API_PROXY_TARGET
  const TPLOT_API_PROXY_TARGET = env.VITE_TPLOT_API_PROXY_TARGET || 'http://127.0.0.1:8101/'

  return {
    server: {
      host: '0.0.0.0',
      port: 8090,
      proxy: {
        '/api': {
          target: API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/t-pro-api': {
          target: TPRO_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/t-pro-api/, ''),
        },
        '/t-pro': {
          target: TPRO_LEGACY_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/t-pro/, ''),
        },
        '/LabDatabase': {
          target: LABDB_PROXY_TARGET,
          changeOrigin: true,
        },
        '/WebDatabase': {
          target: WEBDB_PROXY_TARGET,
          changeOrigin: true,
        },
        '/tplot-api': {
          target: TPLOT_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/tplot-api/, ''),
        },
        '/static': {
          target: STATIC_PROXY_TARGET,
          changeOrigin: true,
        },
        '/res': {
          target: API_PROXY_TARGET,
          changeOrigin: true,
        },
      },
    },
    plugins: [vue()],
  }
})
