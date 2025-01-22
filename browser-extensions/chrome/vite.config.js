import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
        targets: [
        {
            src: 'src/manifest.json',
            dest: '.' // Copy to the root of the dist folder
        },
        {
            src: 'src/images/*',
            dest: 'images'
        }
        ]
    }),
  ],
  resolve: {
    alias: {
      '@': '/src', // Optional alias for cleaner imports
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: './src/popup.html',
      },
    },
    outDir: 'dist',
  },
});
