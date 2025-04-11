#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CredentialManager, NSObject)

RCT_EXTERN_METHOD(addCredential:(NSString *)username password:(NSString *)password service:(NSString *)service)
RCT_EXTERN_METHOD(clearCredentials)
RCT_EXTERN_METHOD(getCredentials)
RCT_EXTERN_METHOD(requiresMainQueueSetup)

// New methods for SQLite database operations
RCT_EXTERN_METHOD(storeDatabase:(NSString *)base64EncryptedDb
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