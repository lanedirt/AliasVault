This folder contains the source code for the browser extensions for AliasVault.

The browser extension is built using WXT and React:
- [WXT](https://wxt.dev/) is a build tool for browser extensions.
- [React](https://reactjs.org/) is a JavaScript library for building user interfaces.

To build the browser extension, run the following command in this directory:

### Build the browser extension
```bash
npm install

# Build the Chrome extension (saves in dist/chrome-mv3)
npm run zip:chrome

# Build the Firefox extension (saves in dist/firefox-mv2)
npm run zip:firefox
```
