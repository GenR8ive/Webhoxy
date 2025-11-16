import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: parseInt(process.env.VITE_WEB_PORT || '3000'),
    // proxy: {
    //   '/api': {
    //     target: process.env.VITE_API_URL || 'http://localhost:8080',
    //     changeOrigin: true,
    //   },
    // },
  },
  build: {
    target: 'esnext',
  },
});
