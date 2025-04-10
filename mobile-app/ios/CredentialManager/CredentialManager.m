#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CredentialManager, NSObject)

RCT_EXTERN_METHOD(addCredential:(NSString *)username password:(NSString *)password service:(NSString *)service)
RCT_EXTERN_METHOD(clearCredentials)
RCT_EXTERN_METHOD(getCredentials)
RCT_EXTERN_METHOD(requiresMainQueueSetup)

@end 