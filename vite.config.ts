import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy Mercury API calls to bypass CORS
          '/api/mercury': {
            target: 'https://api.mercury.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/mercury/, '/api/v1'),
            secure: false, // Set to false for better local development compatibility
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.MERCURY_API_KEY': JSON.stringify(env.MERCURY_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
