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
    func storeDatabase(_ base64EncryptedDb: String,
                      metadata: String,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            try credentialStore.storeEncryptedDatabase(base64EncryptedDb, metadata: metadata)
            resolve(nil)
        } catch {
            reject("DB_ERROR", "Failed to store database: \(error.localizedDescription)", error)
        }
    }

    @objc
    func setAuthMethods(_ authMethods: [String],
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            var methods: AuthMethods = []

            for method in authMethods {
                switch method.lowercased() {
                case "faceid":
                    methods.insert(.faceID)
                case "password":
                    methods.insert(.password)
                default:
                    reject("INVALID_AUTH_METHOD", "Invalid authentication method: \(method)", nil)
                    return
                }
            }

            try credentialStore.setAuthMethods(methods)
            resolve(nil)
        } catch {
            reject("AUTH_METHOD_ERROR", "Failed to set authentication methods: \(error.localizedDescription)", error)
        }
    }

    @objc
    func storeEncryptionKey(_ base64EncryptionKey: String,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            // Store the key in the keychain with authentication protection
            try credentialStore.storeEncryptionKey(base64Key: base64EncryptionKey)
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
    func clearVault() {
        do {
            try credentialStore.clearVault()
        } catch {
            print("Failed to clear vault: \(error)")
        }
    }

    @objc
    func isVaultInitialized(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let isInitialized = try credentialStore.isVaultInitialized()
            resolve(isInitialized)
        } catch {
            reject("VAULT_ERROR", "Failed to check vault initialization: \(error.localizedDescription)", error)
        }
    }

    @objc
    func isVaultUnlocked(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        let isUnlocked = try credentialStore.isVaultUnlocked()
        resolve(isUnlocked)
    }

    @objc
    func getVaultMetadata(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let metadata = try credentialStore.getVaultMetadata()
            resolve(metadata)
        } catch {
            reject("METADATA_ERROR", "Failed to get vault metadata: \(error.localizedDescription)", error)
        }
    }

    @objc
    func unlockVault(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            // TODO: rename this to unlockvault? so meaning is: initialized means it exists, and unlock means
            // we're decrypting the encrypted database (that exists) and try to load it into memory. If unlocking
            // fails, user is redirected to the unlock screen in the react native app.
            try credentialStore.initializeDatabase()
            resolve(true)
        } catch {
            // Check if the error is related to Face ID or decryption
            if let nsError = error as NSError? {
                if nsError.domain == "SharedCredentialStore" {
                    // These are our known error codes for initialization failures
                    if nsError.code == 1 || nsError.code == 2 || nsError.code == 10 {
                        resolve(false)
                        return
                    }
                }
            }
            reject("INIT_ERROR", "Failed to unlock vault: \(error.localizedDescription)", error)
        }
    }

    @objc
    func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func setAutoLockTimeout(_ timeout: Int,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        credentialStore.setAutoLockTimeout(timeout)
        resolve(nil)
    }

    @objc
    func getAutoLockTimeout(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        let timeout = credentialStore.getAutoLockTimeout()
        resolve(timeout)
    }

    @objc
    static func moduleName() -> String! {
        return "CredentialManager"
    }
}
