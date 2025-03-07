import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';
import identityGenDictLoader from './vite-plugins/identity-gen-dict-loader';

export default defineConfig({
  plugins: [
    identityGenDictLoader(),
    WxtVitest(),
  ],
});
