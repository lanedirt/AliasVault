//
//  RCTNativeCredentialManager.m
//  AliasVault
//
//  Created by Leendert de Borst on 24/04/2025.
//

#import "RCTNativeCredentialManager.h"
#import <ExpoModulesCore-Swift.h>
#import "AliasVault-Swift.h"

@interface RCTNativeCredentialManager () <NativeCredentialManagerSpec>
@end

@implementation RCTNativeCredentialManager {
    CredentialManager *credentialManager;
}

+ (NSString *)moduleName {
    return @"NativeCredentialManager";
}

- (id) init {
   if (self = [super init]) {
    credentialManager = [CredentialManager new];
   }
   return self;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeCredentialManagerSpecJSI>(params);
}

- (void)addCredential:(NSString *)username password:(NSString *)password service:(NSString *)service resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager addCredential:username password:password service:service];
}

- (void)clearVault {
    [credentialManager clearVault];
}

- (void)executeQuery:(NSString *)query params:(NSArray *)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager executeQuery:query params:params resolver:resolve rejecter:reject];
}

- (void)executeUpdate:(NSString *)query params:(NSArray *)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager executeUpdate:query params:params resolver:resolve rejecter:reject];
}

- (void)getAuthMethods:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager getAuthMethods:resolve rejecter:reject];
}

- (void)getAutoLockTimeout:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager getAutoLockTimeout:resolve rejecter:reject];
}

- (void)getCredentials:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager getCredentials];
}

- (void)getVaultMetadata:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager getVaultMetadata:resolve rejecter:reject];
}

- (void)isVaultInitialized:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager isVaultInitialized:resolve rejecter:reject];
}

- (void)isVaultUnlocked:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager isVaultUnlocked:resolve rejecter:reject];
}

- (void)setAuthMethods:(NSArray *)authMethods resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager setAuthMethods:authMethods resolver:resolve rejecter:reject];
}

- (void)setAutoLockTimeout:(double)timeout resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager setAutoLockTimeout:timeout resolver:resolve rejecter:reject];
}

- (void)storeDatabase:(NSString *)base64EncryptedDb metadata:(NSString *)metadata resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager storeDatabase:base64EncryptedDb metadata:metadata resolver:resolve rejecter:reject];
}

- (void)storeEncryptionKey:(NSString *)base64EncryptionKey resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager storeEncryptionKey:base64EncryptionKey resolver:resolve rejecter:reject];
}

- (void)unlockVault:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager unlockVault:resolve rejecter:reject];
}

- (void)clearVault:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject {
    [credentialManager clearVault];
}

@end
