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
            src: 'assets/*',
            dest: 'assets'
        },
        {
            src: 'node_modules/argon2-browser/dist/argon2.wasm',
            dest: 'src'
        },
        {
          src: 'src/styles/contentScript.css',
          dest: '.'
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
  build: {
    rollupOptions: {
      input: {
        app: './index.html',
        background: './src/background.ts',
        contentScript: './src/contentScript.ts',
        contentStyles: './src/styles/contentScript.css'
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('contentScript.css')) {
            return 'contentScript.css';
          }
          return '[name].[ext]';
        },
        format: 'es'
      }
    },
    watch: {
      include: ['src/**'],
      exclude: ['node_modules/**']
    },
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    open: '/src/popup.html'
  },
});
