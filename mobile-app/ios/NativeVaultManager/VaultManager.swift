import Foundation
import SQLite
import LocalAuthentication

/**
 * This class is used as a bridge to allow React Native to interact with the VaultStore class.
 * The VaultStore class is implemented in Swift and used by both React Native and the native iOS
 * Autofill extension.
 */
@objc(VaultManager)
public class VaultManager: NSObject {
    private let vaultStore = VaultStore.shared

    override init() {
        super.init()
    }

    @objc
    func storeDatabase(_ base64EncryptedDb: String,
                       metadata: String,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            try vaultStore.storeEncryptedDatabase(base64EncryptedDb, metadata: metadata)
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

            try vaultStore.setAuthMethods(methods)
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
            try vaultStore.storeEncryptionKey(base64Key: base64EncryptionKey)
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

            // Execute the query through the vault store
            let results = try vaultStore.executeQuery(query, params: bindingParams)
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

            // Execute the update through the vault store
            let changes = try vaultStore.executeUpdate(query, params: bindingParams)
            resolve(changes)
        } catch {
            reject("UPDATE_ERROR", "Failed to execute update: \(error.localizedDescription)", error)
        }
    }

    @objc
    func addCredential(_ username: String, password: String, service: String) {
        do {
            let credential = Credential(username: username, password: password, service: service)
            try vaultStore.addCredential(credential)
        } catch {
            print("Failed to add credential: \(error)")
        }
    }

    @objc
    func getCredentials() -> [String: Any] {
        do {
            let credentials = try vaultStore.getAllCredentials()
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
            try vaultStore.clearVault()
        } catch {
            print("Failed to clear vault: \(error)")
        }
    }

    @objc
    func isVaultInitialized(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let isInitialized = try vaultStore.isVaultInitialized()
            resolve(isInitialized)
        } catch {
            reject("VAULT_ERROR", "Failed to check vault initialization: \(error.localizedDescription)", error)
        }
    }

    @objc
    func isVaultUnlocked(_ resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
        let isUnlocked = try vaultStore.isVaultUnlocked()
        resolve(isUnlocked)
    }

    @objc
    func getVaultMetadata(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let metadata = try vaultStore.getVaultMetadata()
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
            try vaultStore.initializeDatabase()
            resolve(true)
        } catch {
            // Check if the error is related to Face ID or decryption
            if let nsError = error as NSError? {
                if nsError.domain == "VaultStore" {
                    // These are our known error codes for initialization failures
                    if nsError.code == 1 || nsError.code == 2 || nsError.code == 8 || nsError.code == 10 {
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
        vaultStore.setAutoLockTimeout(timeout)
        resolve(nil)
    }

    @objc
    func getAutoLockTimeout(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
        let timeout = vaultStore.getAutoLockTimeout()
        resolve(timeout)
    }

    @objc
    func getAuthMethods(_ resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
        do {
            let methods = try vaultStore.getAuthMethods()
            var methodStrings: [String] = []

            if methods.contains(.faceID) {
                methodStrings.append("faceid")
            }
            if methods.contains(.password) {
                methodStrings.append("password")
            }

            resolve(methodStrings)
        } catch {
            reject("AUTH_METHOD_ERROR", "Failed to get authentication methods: \(error.localizedDescription)", error)
        }
    }

    @objc
    static func moduleName() -> String! {
        return "VaultManager"
    }
}
