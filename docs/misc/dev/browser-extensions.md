---
layout: default
title: Browser Extensions
parent: Development
grand_parent: Miscellaneous
nav_order: 2
---

# Browser Extensions
AliasVault has browser extensions for Chrome (with Firefox support coming soon). In order to locally build and debug the extension, you can follow the steps below.

## Chrome Extension
The Chrome extension is built with React as framework and Vite as build tool.

### Install dependencies
Make sure you have Node.js installed on your host machine. Then install the dependencies by running the following command.

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
3. Click "Load unpacked" and select the `dist` folder in the `./browser-extensions/chrome` directory.
4. The extension should now be loaded and ready to use.

### Auto-build on changes
When developing the extension, you can use the `npm run dev` command. This will automatically build the extension when you make changes to the code which will then automatically reload the extension in Chrome. This means you can make changes and see the results immediately.

## Automatic tests
The extension has a suite of automatic tests that are run on every pull request. These tests are located in the `__tests__` directories scattered throughout the browser extension codebase.

### Run the tests
To run the tests locally, you can use the `npm run test` command. This will run all tests.

```bash
npm run test
```

## Manual tests
In order to test for client side issues, here is a list of public websites that have caused issues in the past and can be used to test whether the extension is (still) working correctly.

### Websites that have caused issues
The following websites have been known to cause issues in the past (but should be fixed now). After making changes to the extension, you can test whether the extension is (still) working correctly by using the websites below.

| Website | Reason |
| --- | --- |
| https://www.paprika-shopping.nl/nieuwsbrief/newsletter-register-landing.html | Popup CSS style conflicts |
| https://bloshing.com/inschrijven-nieuwsbrief | Popup CSS style conflicts |
| https://gamefaqs.gamespot.com/user | Popup buttons not working  |
