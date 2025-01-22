---
layout: default
title: Browser Extensions
parent: Development
grand_parent: Miscellaneous
nav_order: 2
---

# Browser Extensions
AliasVault has browser extensions for Chrome and Firefox. In order to locally build and debug the extension, you can follow the steps below.

## Chrome Extension
The Chrome extension is built with React as framework and Vite as build tool.

### Install dependencies

```bash
cd browser-extensions/chrome
npm install
```

### Build the extension

```bash
npm run build
```

### Add the extension to Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `dist` folder in the `chrome` directory.
4. The extension should now be loaded and ready to use.

### Auto-build on changes
When developing the extension, you can use the `npm run watch` command. This will automatically build the extension when you make changes to the code which will then automatically reload the extension in Chrome. This means you can make changes and see the results immediately.
