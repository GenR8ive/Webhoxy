import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [devtools(), solidPlugin(), tailwindcss()],
    server: {
      port: parseInt(env.VITE_WEB_PORT || '3000')
    },
    build: {
      target: 'esnext',
    },
  };
});
