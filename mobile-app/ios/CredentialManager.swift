import Foundation
import React
import CryptoKit

@objc(CredentialManager)
class CredentialManager: NSObject {
  @objc
  func addCredential(_ username: String, password: String, service: String) {
    do {
      let credential = Credential(username: username, password: password, service: service)
      try SharedCredentialStore.shared.addCredential(credential)
    } catch let error as CryptoKitError {
      print("Encryption error: \(error)")
      // Handle encryption errors
    } catch {
      print("Failed to add credential: \(error)")
      // Handle other errors
    }
  }
  
  @objc
  func clearCredentials() {
    SharedCredentialStore.shared.clearAllCredentials()
  }

  @objc
  func getCredentials() -> [[String: String]] {
    do {
      let credentials = try SharedCredentialStore.shared.getAllCredentials()
      let credentialDicts = credentials.map { credential in
        return [
          "username": credential.username,
          "password": credential.password,
          "service": credential.service
        ]
      }
      return credentialDicts
    } catch let error as CryptoKitError {
      print("Decryption error: \(error)")
      // Handle decryption errors
      return []
    } catch {
      print("Failed to get credentials: \(error)")
      // Handle other errors
      return []
    }
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
