//
//  RCTNativeVaultManager.h
//  AliasVault
//
//  Created by Leendert de Borst on 24/04/2025.
//

#import <Foundation/Foundation.h>
#import <NativeVaultManagerSpec/NativeVaultManagerSpec.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTNativeVaultManager : NSObject <NativeVaultManagerSpec>

- (void)getEncryptedDatabase:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)getCurrentVaultRevisionNumber:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;
- (void)setCurrentVaultRevisionNumber:(double)revisionNumber resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject;

@end

NS_ASSUME_NONNULL_END
