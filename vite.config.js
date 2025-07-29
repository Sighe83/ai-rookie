import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    allowedHosts: true // allows any hostname 	
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});