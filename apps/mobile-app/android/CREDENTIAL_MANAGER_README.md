# Android CredentialManager Implementation

This document describes how the Android implementation of the CredentialManager works.

## Overview

The Android implementation uses the Android Keystore system to securely store and retrieve encryption keys for credentials. It also leverages the BiometricPrompt API to require user authentication for sensitive operations.

## Key Components

1. **CredentialManagerModule**: React Native bridge module exposing JS methods for credential management.
2. **SharedCredentialStore**: Core class handling secure storage and retrieval of credentials.
3. **Credential**: Simple model class representing a credential.
4. **CredentialManagerPackage**: Package registration for React Native.

## Security Features

- **AES-256 Encryption**: All credentials are encrypted using AES-256 in GCM mode.
- **Biometric Authentication**: User must authenticate with fingerprint/face/PIN to access credentials.
- **Android Keystore**: Encryption keys are stored in the Android Keystore system, making them hardware-backed on supported devices.
- **Secure Preferences**: IVs (Initialization Vectors) are stored in SharedPreferences.

## Biometric Authentication

The implementation requires biometric authentication for:
- Adding credentials
- Retrieving credentials

The user will be prompted with a biometric dialog when performing these operations.

## Key Technical Details

- The encryption key is generated with a 30-second authentication validity period, which means once the user authenticates, they won't need to authenticate again for 30 seconds.
- Each credential operation creates a new BiometricPrompt and requires fresh authentication.
- The user can cancel the authentication if desired.
- **Main Thread Requirement**: BiometricPrompt must be shown on the main UI thread. We handle this by using `activity.runOnUiThread()` in the SharedCredentialStore and `UiThreadUtil.runOnUiThread()` in the CredentialManagerModule.

## Troubleshooting

If you encounter any of these common issues:

1. **IllegalBlockSizeException**: This typically means the authentication failed or was canceled. The user should be prompted to authenticate again.

2. **Activity not available**: The biometric prompt requires a FragmentActivity. Ensure your React Native app is using a compatible activity.

3. **Biometric hardware not available**: Some devices may not have biometric hardware. The implementation should gracefully fail with an appropriate error message.

4. **IllegalStateException: Must be called from main thread of fragment host**: This indicates that BiometricPrompt was not shown on the main UI thread. The current implementation handles this by ensuring all UI operations happen on the main thread.

## Compatibility

- Minimum SDK: 24 (Android 7.0)
- Required Permissions: USE_BIOMETRIC (added to AndroidManifest.xml)
- Required Dependencies: androidx.biometric:biometric:1.1.0 (added to build.gradle) 