import Foundation

struct Credential: Codable {
    let username: String
    let password: String
    let service: String
}

class SharedCredentialStore {
    static let shared = SharedCredentialStore()
    private let userDefaults: UserDefaults
    private let credentialsKey = "storedCredentials"
    
    private init() {
        // Use the app group identifier
        userDefaults = UserDefaults(suiteName: "group.net.aliasvault.autofill")!
    }
    
    func getAllCredentials() -> [Credential] {
        guard let data = userDefaults.data(forKey: credentialsKey) else { return [] }
        return (try? JSONDecoder().decode([Credential].self, from: data)) ?? []
    }
    
    func addCredential(_ credential: Credential) {
        var credentials = getAllCredentials()
        credentials.append(credential)
        saveCredentials(credentials)
    }
    
    func clearAllCredentials() {
        userDefaults.removeObject(forKey: credentialsKey)
    }
    
    private func saveCredentials(_ credentials: [Credential]) {
        if let data = try? JSONEncoder().encode(credentials) {
            userDefaults.set(data, forKey: credentialsKey)
        }
    }
} 