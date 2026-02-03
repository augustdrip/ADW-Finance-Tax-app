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
            secure: false,
          },
          // Proxy Plaid API calls to local API server
          '/api/plaid': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      // NOTE: API keys are handled securely:
      // - Mercury: Uses external proxy (mercury-proxy on Render)
      // - Gemini: User enters key manually in UI (stored in localStorage)
      // - Never expose secret keys in frontend bundle!
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
