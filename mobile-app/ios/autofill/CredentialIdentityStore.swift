import AuthenticationServices

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