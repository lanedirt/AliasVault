import Foundation
import React

@objc(CredentialManager)
class CredentialManager: NSObject {
  @objc
  func addCredential(_ username: String, password: String, service: String) {
    let credential = Credential(username: username, password: password, service: service)
    SharedCredentialStore.shared.addCredential(credential)
  }
  
  @objc
  func clearCredentials() {
    SharedCredentialStore.shared.clearAllCredentials()
  }

  @objc
  func getCredentials() -> [[String: String]] {
    let credentials = SharedCredentialStore.shared.getAllCredentials()
    let credentialDicts = credentials.map { credential in
      return [
        "username": credential.username,
        "password": credential.password,
        "service": credential.service
      ]
    }
    return credentialDicts
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  static func moduleName() -> String! {
    return "CredentialManager"
  }
} 
