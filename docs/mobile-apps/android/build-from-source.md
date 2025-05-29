---
layout: default
title: Build from Source
parent: Android App
grand_parent: Mobile Apps
nav_order: 1
---

# Building AliasVault Android App from Source

This guide explains how to build and install the AliasVault Android app from source code using React Native.

## Prerequisites

- MacOS or Windows machine with Android Studio installed
- Git to clone the repository

## Building the Android app

1. Clone the repository:
```bash
git clone https://github.com/lanedirt/AliasVault.git
```

2. Navigate to the mobile app directory:
```bash
cd AliasVault/apps/mobile-app
```

3. Install JavaScript dependencies:
```bash
npm install
```

4. Install and build Android dependencies:
```bash
cd android
./gradlew assembleRelease
```

5. Deploy release build to your device:

For MacOS, install adb to deploy the app to a phone or simulator via command line:
```bash
# Install adb
brew install android-platform-tools

# List devices (physical devices connected via USB and any running simulators)
adb devices

# Deploy to chosen device
adb -s [device-id] install android/app/build/outputs/apk/release/app-release.apk
```

