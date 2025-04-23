#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CredentialManager, NSObject)
RCT_EXTERN_METHOD(requiresMainQueueSetup)

RCT_EXTERN_METHOD(addCredential:(NSString *)username password:(NSString *)password service:(NSString *)service)
RCT_EXTERN_METHOD(getCredentials)
RCT_EXTERN_METHOD(clearVault)
// TODO: isvaultinitialized should be renamed to "isVaultExists" or something similar as we're just checking if the file exists.
// The initializevault actually initializes the vault by decrypting it and loading the DB into memory.
RCT_EXTERN_METHOD(isVaultInitialized:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isVaultUnlocked:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getVaultMetadata:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(unlockVault:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

// New methods for SQLite database operations
RCT_EXTERN_METHOD(storeDatabase:(NSString *)base64EncryptedDb
                  metadata:(NSString *)metadata
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setAuthMethods:(NSArray *)authMethods
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(storeEncryptionKey:(NSString *)base64EncryptionKey
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(executeQuery:(NSString *)query
                  params:(NSArray *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(executeUpdate:(NSString *)query
                  params:(NSArray *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)


@end
