import Foundation

public struct Credential: Codable {
    public let id: UUID
    public let aliasId: UUID
    public let service: Service
    public let username: String?
    public let notes: String?
    public let password: Password?
    public let createdAt: Date
    public let updatedAt: Date
    public let isDeleted: Bool

    public init(
        id: UUID,
        aliasId: UUID,
        service: Service,
        username: String?,
        notes: String?,
        password: Password?,
        createdAt: Date,
        updatedAt: Date,
        isDeleted: Bool
    ) {
        self.id = id
        self.aliasId = aliasId
        self.service = service
        self.username = username
        self.notes = notes
        self.password = password
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isDeleted = isDeleted
    }
}

public struct Service: Codable, Hashable {
    public let id: UUID
    public let name: String?
    public let url: String?
    public let logo: Data?
    public let createdAt: Date
    public let updatedAt: Date
    public let isDeleted: Bool

    public init(
        id: UUID,
        name: String?,
        url: String?,
        logo: Data?,
        createdAt: Date,
        updatedAt: Date,
        isDeleted: Bool
    ) {
        self.id = id
        self.name = name
        self.url = url
        self.logo = logo
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isDeleted = isDeleted
    }
}

public struct Password: Codable {
    public let id: UUID
    public let credentialId: UUID
    public let value: String
    public let createdAt: Date
    public let updatedAt: Date
    public let isDeleted: Bool

    public init(
        id: UUID,
        credentialId: UUID,
        value: String,
        createdAt: Date,
        updatedAt: Date,
        isDeleted: Bool
    ) {
        self.id = id
        self.credentialId = credentialId
        self.value = value
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.isDeleted = isDeleted
    }
}