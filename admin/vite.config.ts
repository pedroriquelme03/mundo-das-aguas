import { defineConfig } from 'vite';

// base '/admin/' — assets absolutos corretos no Vercel (mundo-das-aguas.vercel.app/admin/)
export default defineConfig({
  base: '/admin/',
  server: { port: 5174, open: true },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets'
  }
});
