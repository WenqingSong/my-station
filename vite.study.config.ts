import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Independent build: do not add the study to the production entry points.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-study',
    emptyOutDir: true,
    rollupOptions: { input: 'visual-study/index.html' },
  },
});
