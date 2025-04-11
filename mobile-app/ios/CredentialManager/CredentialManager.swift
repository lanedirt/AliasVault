import Foundation
import SQLite
import LocalAuthentication

@objc(CredentialManager)
class CredentialManager: NSObject {
    private let credentialStore = SharedCredentialStore.shared
    
    override init() {
        super.init()
    }
    
    @objc
    func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc
    func storeDatabase(_ base64EncryptedDb: String,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            try credentialStore.storeEncryptedDatabase(base64EncryptedDb)
            resolve(nil)
        } catch {
            reject("DB_ERROR", "Failed to store database: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func storeEncryptionKey(_ base64EncryptionKey: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            // Store the encryption key in the keychain with biometric or PIN protection
            let context = LAContext()
            var error: NSError?
            
            guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) else {
                reject("AUTH_UNAVAILABLE", "Authentication not available: \(error?.localizedDescription ?? "Unknown error")", error)
                return
            }
            
            // Store the key in the keychain with authentication protection
            try credentialStore.storeEncryptionKey(base64EncryptionKey)
            resolve(nil)
        } catch {
            reject("KEYCHAIN_ERROR", "Failed to store encryption key: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func executeQuery(_ query: String,
                     params: [Any],
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            // Ensure database is initialized
            try credentialStore.initializeDatabase()
            
            // Convert all params to strings
            let bindingParams = params.map { param -> Binding? in
                return String(describing: param)
            }
            
            // Execute the query through the credential store
            let results = try credentialStore.executeQuery(query, params: bindingParams)
            resolve(results)
        } catch {
            reject("QUERY_ERROR", "Failed to execute query: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func executeUpdate(_ query: String,
                      params: [Any],
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            // Ensure database is initialized
            try credentialStore.initializeDatabase()
            
            // Convert all params to strings
            let bindingParams = params.map { param -> Binding? in
                return String(describing: param)
            }
            
            // Execute the update through the credential store
            let changes = try credentialStore.executeUpdate(query, params: bindingParams)
            resolve(changes)
        } catch {
            reject("UPDATE_ERROR", "Failed to execute update: \(error.localizedDescription)", error)
        }
    }
    
    @objc
    func addCredential(_ username: String, password: String, service: String) {
        do {
            let credential = Credential(username: username, password: password, service: service)
            try credentialStore.addCredential(credential)
        } catch {
            print("Failed to add credential: \(error)")
        }
    }
    
    @objc
    func clearCredentials() {
        credentialStore.clearAllCredentials()
    }
    
    @objc
    func getCredentials() -> [String: Any] {
        do {
            let credentials = try credentialStore.getAllCredentials()
            let credentialDicts = credentials.map { credential in
                return [
                    "username": credential.username,
                    "password": credential.password,
                    "service": credential.service
                ]
            }
            return ["credentials": credentialDicts]
        } catch {
            print("Failed to get credentials: \(error)")
            return [:]
        }
    }
    
    @objc
    static func moduleName() -> String! {
        return "CredentialManager"
    }
} 
