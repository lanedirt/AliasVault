import AuthenticationServices
import VaultModels

/**
 * Native iOS implementation of the CredentialIdentityStore protocol.
 *
 * This class is used to save and remove credential identities from the system.
 * It is used to provide credentials to the system when the user is autocompleting a password.
 */
class CredentialIdentityStore {
    static let shared = CredentialIdentityStore()
    private let store = ASCredentialIdentityStore.shared

    private init() {}

    func saveCredentialIdentities(_ credentials: [Credential]) async throws {
        let identities: [ASPasswordCredentialIdentity] = credentials.compactMap { credential in
            guard let urlString = credential.service.url,
                  let url = URL(string: urlString),
                  let host = url.host else {
                return nil
            }
            guard let username = credential.username, !username.isEmpty else {
                return nil
            }

            let effectiveDomain = Self.effectiveDomain(from: host)

            return ASPasswordCredentialIdentity(
                serviceIdentifier: ASCredentialServiceIdentifier(identifier: effectiveDomain, type: .domain),
                user: username,
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

    func removeAllCredentialIdentities() async throws {
        try await store.removeAllCredentialIdentities()
    }

    func removeCredentialIdentities(_ credentials: [Credential]) async throws {
        let identities = credentials.map { credential in
            let serviceIdentifier = ASCredentialServiceIdentifier(
                identifier: credential.service.name ?? "",
                type: .domain
            )

            return ASPasswordCredentialIdentity(
                serviceIdentifier: serviceIdentifier,
                user: credential.username ?? "",
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
