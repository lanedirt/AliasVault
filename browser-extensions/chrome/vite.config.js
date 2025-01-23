import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

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
        },
        {
            src: 'node_modules/argon2-browser/dist/argon2.wasm',
            dest: 'src' // Copy to the root of the dist folder
        }
        ]
    }),
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
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
  server: {
    open: '/src/popup.html'
  },
});
