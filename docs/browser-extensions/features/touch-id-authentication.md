---
layout: default
title: Touch ID Authentication
parent: Browser Extensions
nav_order: 3
---

# Touch ID Authentication for Browser Extension

AliasVault browser extension now supports Touch ID authentication on macOS devices with Touch ID hardware. This feature allows you to quickly unlock your vault using your fingerprint instead of typing your master password.

## Requirements

- macOS device with Touch ID hardware
- Supported browser (Chrome, Safari, Firefox, Edge)
- AliasVault browser extension installed

## How It Works

The Touch ID feature uses the WebAuthn API to securely authenticate with your device's biometric hardware. Your master password is never stored in plaintext, and all cryptographic operations happen locally on your device.

## Setup Touch ID Authentication

1. Open the AliasVault browser extension
2. Log in with your master password
3. Go to Settings
4. Find the "Enable Touch ID" option
5. Toggle the switch to enable Touch ID
6. Follow the on-screen instructions to complete the setup

## Using Touch ID

Once set up, you can use Touch ID to unlock your vault:

1. Open the AliasVault browser extension
2. Click the Touch ID button on the login screen
3. When prompted, scan your fingerprint using your device's Touch ID sensor
4. Your vault will unlock automatically

## Troubleshooting

If you encounter issues with Touch ID authentication:

- Ensure your device has Touch ID hardware and it's properly set up in macOS
- Make sure your browser has permission to use Touch ID
- Try disabling and re-enabling the Touch ID feature in the extension settings
- If problems persist, you can always use your master password to log in

## Security Considerations

- Touch ID authentication is only available on your registered device
- Your master password is still required for certain sensitive operations
- If your device is lost or stolen, your vault remains secure as biometric data cannot be transferred between devices
- You can disable Touch ID authentication at any time from the extension settings

