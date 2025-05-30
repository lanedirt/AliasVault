package net.aliasvault.app.vaultstore.models

import java.util.Date
import java.util.UUID

/**
 * Credential object.
 */
data class Credential(
    /**
     * The ID of the credential.
     */
    val id: UUID,

    /**
     * The alias of the credential.
     */
    val alias: Alias?,

    /**
     * The service of the credential.
     */
    val service: Service,

    /**
     * The username of the credential.
     */
    val username: String?,

    /**
     * The notes of the credential.
     */
    val notes: String?,

    /**
     * The password of the credential.
     */
    val password: Password?,

    /**
     * The creation date of the credential.
     */
    val createdAt: Date,

    /**
     * The update date of the credential.
     */
    val updatedAt: Date,

    /**
     * Whether the credential is deleted.
     */
    val isDeleted: Boolean,
)

/**
 * Service object.
 */
data class Service(
    /**
     * The ID of the service.
     */
    val id: UUID,

    /**
     * The name of the service.
     */
    val name: String?,

    /**
     * The URL of the service.
     */
    val url: String?,

    /**
     * The logo of the service.
     */
    val logo: ByteArray?,

    /**
     * The creation date of the service.
     */
    val createdAt: Date,

    /**
     * The update date of the service.
     */
    val updatedAt: Date,

    /**
     * Whether the service is deleted.
     */
    val isDeleted: Boolean,
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

/**
 * Password object.
 */
data class Password(
    /**
     * The ID of the password.
     */
    val id: UUID,

    /**
     * The credential ID of the password.
     */
    val credentialId: UUID,

    /**
     * The value of the password.
     */
    val value: String,

    /**
     * The creation date of the password.
     */
    val createdAt: Date,

    /**
     * The update date of the password.
     */
    val updatedAt: Date,

    /**
     * Whether the password is deleted.
     */
    val isDeleted: Boolean,
)

/**
 * Alias object.
 */
data class Alias(
    /**
     * The ID of the alias.
     */
    val id: UUID,

    /**
     * The gender of the alias.
     */
    val gender: String?,

    /**
     * The first name of the alias.
     */
    val firstName: String?,

    /**
     * The last name of the alias.
     */
    val lastName: String?,

    /**
     * The nick name of the alias.
     */
    val nickName: String?,

    /**
     * The birth date of the alias.
     */
    val birthDate: Date,

    /**
     * The email of the alias.
     */
    val email: String?,

    /**
     * The creation date of the alias.
     */
    val createdAt: Date,

    /**
     * The update date of the alias.
     */
    val updatedAt: Date,

    /**
     * Whether the alias is deleted.
     */
    val isDeleted: Boolean,
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
