package net.aliasvault.app.vaultstore.models

data class VaultMetadata(
    val publicEmailDomains: List<String> = emptyList(),
    val privateEmailDomains: List<String> = emptyList(),
    val vaultRevisionNumber: Int = 0,
)
