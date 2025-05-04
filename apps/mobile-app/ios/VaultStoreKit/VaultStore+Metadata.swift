import Foundation
import VaultModels

/// Extension for the VaultStore class to handle metadata management
extension VaultStore {
    /// Store the metadata - the metadata for the vault
    public func storeMetadata(_ metadata: String) throws {
        userDefaults.set(metadata, forKey: VaultConstants.vaultMetadataKey)
        userDefaults.synchronize()
    }

    /// Get the metadata - the metadata for the vault
    public func getVaultMetadata() -> String? {
        return userDefaults.string(forKey: VaultConstants.vaultMetadataKey)
    }

    /// Get the metadata object - the metadata for the vault
    private func getVaultMetadataObject() -> VaultMetadata? {
        guard let jsonString = getVaultMetadata(),
              let data = jsonString.data(using: .utf8),
              let metadata = try? JSONDecoder().decode(VaultMetadata.self, from: data) else {
            return nil
        }
        return metadata
    }

    /// Get the current vault revision number - the revision number of the vault
    public func getCurrentVaultRevisionNumber() -> Int {
        guard let metadata = getVaultMetadataObject() else {
            return 0
        }
        return metadata.vaultRevisionNumber
    }

    /// Set the current vault revision number - the revision number of the vault
    public func setCurrentVaultRevisionNumber(_ revisionNumber: Int) {
        var metadata: VaultMetadata

        if let existingMetadata = getVaultMetadataObject() {
            metadata = existingMetadata
        } else {
            metadata = VaultMetadata(
                publicEmailDomains: [],
                privateEmailDomains: [],
                vaultRevisionNumber: revisionNumber
            )
        }

        metadata.vaultRevisionNumber = revisionNumber
        if let data = try? JSONEncoder().encode(metadata),
           let jsonString = String(data: data, encoding: .utf8) {
            userDefaults.set(jsonString, forKey: VaultConstants.vaultMetadataKey)
            userDefaults.synchronize()
        }
    }
}