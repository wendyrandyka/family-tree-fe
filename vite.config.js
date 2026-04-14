import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const BACKEND =
    env.VITE_BACKEND_URL || 'https://family-tree-be-vytm.onrender.com';

  console.log('BACKEND:', BACKEND); // debug

  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      allowedHosts: 'all', // ✅ TAMBAH INI
      proxy: {
      proxy: {
        '/persons': {
          target: BACKEND,
          changeOrigin: true,
        },
      },
    },
  };
});