import { defineConfig } from 'wxt';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: "AliasVault",
    description: "AliasVault Browser AutoFill Extension. Keeping your personal information private.",
    version: "0.21.2",
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
    },
    action: {
      default_title: "AliasVault"
    },
    permissions: [
      "storage",
      "activeTab",
      "contextMenus",
      "scripting"
    ],
    host_permissions: [
      "<all_urls>"
    ],
    commands: {
      "show-autofill-popup": {
        description: "Show the autofill popup (while focusing an input field)"
      }
    }
  },
  modules: ['@wxt-dev/module-react'],
  srcDir: 'src',
  outDir: 'dist',
  vite: () => ({
    plugins: [
      viteStaticCopy({
        targets: [
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
  }),
  zip: {
    includeSources: ['README.md'],
  },
});
