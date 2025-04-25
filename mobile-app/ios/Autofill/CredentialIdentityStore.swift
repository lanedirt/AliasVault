import AuthenticationServices

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
        let identities = credentials.map { credential in
            let serviceIdentifier = ASCredentialServiceIdentifier(
                identifier: credential.service,
                type: .domain
            )

            return ASPasswordCredentialIdentity(
                serviceIdentifier: serviceIdentifier,
                user: credential.username,
                // TODO: Use the actual record identifier when implementing the actual vault
                recordIdentifier: UUID().uuidString
            )
        }

        try await store.saveCredentialIdentities(identities)
    }

    func removeAllCredentialIdentities() async throws {
        try await store.removeAllCredentialIdentities()
    }

    func removeCredentialIdentities(_ credentials: [Credential]) async throws {
        let identities = credentials.map { credential in
            let serviceIdentifier = ASCredentialServiceIdentifier(
                identifier: credential.service,
                type: .domain
            )

            return ASPasswordCredentialIdentity(
                serviceIdentifier: serviceIdentifier,
                user: credential.username,
                // TODO: Use the actual record identifier when implementing the actual vault
                recordIdentifier: UUID().uuidString
            )
        }

        try await store.removeCredentialIdentities(identities)
    }
}