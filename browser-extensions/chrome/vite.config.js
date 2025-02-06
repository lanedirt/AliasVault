import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import dictionaryLoader from './vite-plugins/dictionary-loader';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    dictionaryLoader(),
    webExtension({
      manifest: 'manifest.json',
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/*',
          dest: 'assets'
        },
        {
          src: 'node_modules/argon2-browser/dist/argon2.wasm',
          dest: 'src'
        },
        {
          src: 'node_modules/sql.js/dist/sql-wasm.wasm',
          dest: 'src'
        }
      ]
    })
  ],
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    watch: {
      include: ['src/**', 'manifest.json'],
    }
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100,
      ignored: ['!**/node_modules/**', '**/dist/**'],
    }
  }
});
