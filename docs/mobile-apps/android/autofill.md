---
layout: default
title: Autofill
parent: Android App
grand_parent: Mobile Apps
nav_order: 2
---

# Android autofill

This page explains how autofill works in the AliasVault Android app.

## Experimental

{: .note }
As of writing (May 2025), autofill support in the AliasVault Android app is available, but experimental.

Android has added multiple autofill APIs throughout the years, which include Accessibility, Native Autofill, and Inline Autofill. These multiple APIs make it hard to offer a universal experience for AliasVault. AliasVault currently supports some but not all of these, so results may vary depending on your device and the app you're using. We're actively working on improving autofill in upcoming releases.

If you're running into any specific issues with your specific device make/model, feel free to raise an issue on GitHub.


## Using Native Autofill in Chrome
Currently AliasVault implements the `Native Autofill` API which shows an autofill popup on supported input fields. The Chrome browser on Android from **version 135** onwards support native autofill via third party apps. You need to enable this manually.

To configure AliasVault as the autofill provider in Chrome:
1. Open Chrome
2. Go to Menu > Settings > Autofill services
3. Choose the option `Autofill using another service`

## Frequently Asked Questions

### Chrome Autofill Issues

#### Autofill suggestions stopped appearing in Chrome
If you notice that autofill suggestions have stopped appearing in Chrome, this is often due to a Chrome process issue rather than an AliasVault problem. To resolve this:

1. Fully close the Chrome browser on your Android device
2. Reopen Chrome

This simple restart of the browser process typically resolves the issue and restores autofill functionality.

