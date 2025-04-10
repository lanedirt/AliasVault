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