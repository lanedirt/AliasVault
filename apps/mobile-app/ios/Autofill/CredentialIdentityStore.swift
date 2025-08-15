import AuthenticationServices
import VaultModels
import VaultUI

/**
 * Native iOS implementation of the CredentialIdentityStore protocol.
 *
 * This class is used to save and remove credential identities from the system.
 * It is used to provide credentials to the system when the user is autocompleting a password.
 */
public class CredentialIdentityStore {
    static let shared = CredentialIdentityStore()
    private let store = ASCredentialIdentityStore.shared

    private init() {}

    /// Save credentials into the native iOS credential store.
    public func saveCredentialIdentities(_ credentials: [Credential]) async throws {
        let identities: [ASPasswordCredentialIdentity] = credentials.compactMap { credential in
            guard let urlString = credential.service.url,
                  let url = URL(string: urlString),
                  let host = url.host else {
                return nil
            }
            
            // Use the same logic as the UI for determining the identifier
            let identifier = usernameOrEmail(credential: credential)
            guard !identifier.isEmpty else {
                return nil // Skip credentials with no identifier
            }

            let effectiveDomain = Self.effectiveDomain(from: host)

            return ASPasswordCredentialIdentity(
                serviceIdentifier: ASCredentialServiceIdentifier(identifier: effectiveDomain, type: .domain),
                user: identifier,
                recordIdentifier: credential.id.uuidString
            )
        }

        guard !identities.isEmpty else {
            print("No valid identities to save.")
            return
        }

        let state = await storeState()
            guard state.isEnabled else {
              print("Credential identity store is not enabled.")
              return
        }

        do {
            try await store.saveCredentialIdentities(identities)
        } catch {
            print("Failed to save credential identities to native iOS storage: \(error)")
        }
    }

    /// Remove all credentials from iOS credential store.
    public func removeAllCredentialIdentities() async throws {
        try await store.removeAllCredentialIdentities()
    }

    /// Remove one or more specific credentials from iOS credential store.
    public func removeCredentialIdentities(_ credentials: [Credential]) async throws {
        let identities = credentials.compactMap { credential -> ASPasswordCredentialIdentity? in
            let serviceIdentifier = ASCredentialServiceIdentifier(
                identifier: credential.service.name ?? "",
                type: .domain
            )
            
            // Use the same logic as the UI for determining the identifier
            let identifier = usernameOrEmail(credential: credential)
            guard !identifier.isEmpty else {
                return nil // Skip credentials with no identifier
            }

            return ASPasswordCredentialIdentity(
                serviceIdentifier: serviceIdentifier,
                user: identifier,
                recordIdentifier: credential.id.uuidString
            )
        }

        try await store.removeCredentialIdentities(identities)
    }

    private func storeState() async -> ASCredentialIdentityStoreState {
        await withCheckedContinuation { continuation in
            store.getState { state in
                continuation.resume(returning: state)
            }
        }
    }

    private static func effectiveDomain(from host: String) -> String {
        let parts = host.split(separator: ".")
        guard parts.count >= 2 else { return host }
        return parts.suffix(2).joined(separator: ".")
    }
}
