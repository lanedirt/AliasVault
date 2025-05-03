# iOS Autofill Extension

This directory contains the native iOS Autofill extension that enables native password autofill functionality on iOS devices. The extension works in conjunction with the main React Native application through a shared data model.

## Architecture

The Autofill extension and the React Native app both access the same `VaultStoreKit`, which serves as a shared data model between the native iOS components and the React Native application. This architecture allows for seamless communication between:

- Native iOS Autofill functionality
- React Native application components
- Shared data storage and access

## Integration

The extension is designed to work alongside the React Native app while maintaining native iOS autofill capabilities.

