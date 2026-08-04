import { defineConfig } from 'vite';

// base './' permite hospedar o painel em uma subpasta (ex.: /admin/).
export default defineConfig({
  base: './',
  server: { port: 5174, open: true }
});
