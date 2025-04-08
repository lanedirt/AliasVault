import Foundation

public struct Credential: Codable {
    public let username: String
    public let password: String
    public let service: String
    
    public init(username: String, password: String, service: String) {
        self.username = username
        self.password = password
        self.service = service
    }
}

public class SharedCredentialStore {
    public static let shared = SharedCredentialStore()
    private let userDefaults: UserDefaults
    private let credentialsKey = "storedCredentials"
    
    private init() {
        // Use the app group identifier
        userDefaults = UserDefaults(suiteName: "group.net.aliasvault.autofill")!
    }
    
    public func getAllCredentials() -> [Credential] {
        guard let data = userDefaults.data(forKey: credentialsKey) else { return [] }
        return (try? JSONDecoder().decode([Credential].self, from: data)) ?? []
    }
    
    public func addCredential(_ credential: Credential) {
        var credentials = getAllCredentials()
        credentials.append(credential)
        saveCredentials(credentials)
    }
    
    public func clearAllCredentials() {
        userDefaults.removeObject(forKey: credentialsKey)
    }
    
    private func saveCredentials(_ credentials: [Credential]) {
        if let data = try? JSONEncoder().encode(credentials) {
            userDefaults.set(data, forKey: credentialsKey)
        }
    }
} 