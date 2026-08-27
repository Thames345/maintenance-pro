import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': import.meta.dirname,
      'lucide-react': `${import.meta.dirname}/src/icons.tsx`,
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
