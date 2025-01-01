---
layout: default
title: Enable WebAuthn
parent: Development
grand_parent: Miscellaneous
nav_order: 9
---

# WebAuthn
Webauthn allows to quick unlock the vault. This can be either the built-in browser authenticator or an external authenticator like a Yubikey.

At the time of writing (2024-10-04), only some browsers support the required PRF extension. In order to make it work in Chrome, you need to enable the PRF extension in the browser settings.

## Chrome

1. Open the Chrome browser and navigate to `chrome://flags/#enable-experimental-web-platform-features`.
2. Enable the `Experimental Web Platform features` flag.
3. Restart the browser.
4. Now it should be possible to use the built-in chrome password manager to unlock the vault.
5. Go to Menu -> Security Settings -> Quick Vault Unlock and enable it.
