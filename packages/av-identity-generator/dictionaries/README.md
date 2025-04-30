This folder contains the dictionaries used by the identity generator.

These dictionaries are used by both .NET and JavaScript code.

For .NET these dictionaries are linked by the `AliasVault.Generators.Identity` project:
- `apps/server/generators/AliasVault.Generators.Identity/Implementations/Dictionaries`.

For JavaScript, these dictionaries are injected into the code by the `dictionary-loader.ts` plugin:
- `apps/browser-extensions/chrome/vite-plugins/dictionary-loader.ts`
