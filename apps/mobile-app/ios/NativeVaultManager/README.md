# NativeVaultManager

This folder contains the React Native bridge implementation for iOS, written in Objective-C and Swift. These files serve as the communication layer between the React Native mobile app and the shared `VaultStoreKit` logic.

## Purpose

The NativeVaultManager enables:
- React Native to make calls to the shared VaultStoreKit class
- Integration with the native iOS autofill extension
- Secure communication between the React Native layer and native iOS code

## Key Components

- Objective-C bridge files for React Native integration that can talk to Swift
- Swift bridge files that can talk to the VaultStore swift logic where the data is securely stored

This bridge ensures that both the React Native app and the native iOS autofill extension can securely access and manage vault data through a common interface.

