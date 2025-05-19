package net.aliasvault.app.vaultstore.models

import java.util.Date
import java.util.UUID

data class Credential(
    val id: UUID,
    val alias: Alias?,
    val service: Service,
    val username: String?,
    val notes: String?,
    val password: Password?,
    val createdAt: Date,
    val updatedAt: Date,
    val isDeleted: Boolean
)

data class Service(
    val id: UUID,
    val name: String?,
    val url: String?,
    val logo: ByteArray?,
    val createdAt: Date,
    val updatedAt: Date,
    val isDeleted: Boolean
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Service

        if (id != other.id) return false
        if (name != other.name) return false
        if (url != other.url) return false
        if (!logo.contentEquals(other.logo)) return false
        if (createdAt != other.createdAt) return false
        if (updatedAt != other.updatedAt) return false
        if (isDeleted != other.isDeleted) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + (name?.hashCode() ?: 0)
        result = 31 * result + (url?.hashCode() ?: 0)
        result = 31 * result + (logo?.contentHashCode() ?: 0)
        result = 31 * result + createdAt.hashCode()
        result = 31 * result + updatedAt.hashCode()
        result = 31 * result + isDeleted.hashCode()
        return result
    }
}

data class Password(
    val id: UUID,
    val credentialId: UUID,
    val value: String,
    val createdAt: Date,
    val updatedAt: Date,
    val isDeleted: Boolean
)

data class Alias(
    val id: UUID,
    val gender: String?,
    val firstName: String?,
    val lastName: String?,
    val nickName: String?,
    val birthDate: Date,
    val email: String?,
    val createdAt: Date,
    val updatedAt: Date,
    val isDeleted: Boolean
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Alias

        if (id != other.id) return false
        if (gender != other.gender) return false
        if (firstName != other.firstName) return false
        if (lastName != other.lastName) return false
        if (nickName != other.nickName) return false
        if (birthDate != other.birthDate) return false
        if (email != other.email) return false
        if (createdAt != other.createdAt) return false
        if (updatedAt != other.updatedAt) return false
        if (isDeleted != other.isDeleted) return false

        return true
    }

    override fun hashCode(): Int {
        var result = id.hashCode()
        result = 31 * result + (gender?.hashCode() ?: 0)
        result = 31 * result + (firstName?.hashCode() ?: 0)
        result = 31 * result + (lastName?.hashCode() ?: 0)
        result = 31 * result + (nickName?.hashCode() ?: 0)
        result = 31 * result + birthDate.hashCode()
        result = 31 * result + (email?.hashCode() ?: 0)
        result = 31 * result + createdAt.hashCode()
        result = 31 * result + updatedAt.hashCode()
        result = 31 * result + isDeleted.hashCode()
        return result
    }
}