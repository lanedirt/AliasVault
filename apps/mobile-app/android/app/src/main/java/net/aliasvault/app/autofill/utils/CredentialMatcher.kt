package net.aliasvault.app.autofill.utils

import net.aliasvault.app.vaultstore.models.Credential

/**
 * Helper class to match credentials against app/website information for autofill.
 * This class handles the logic of determining which credentials are relevant
 * for a given app or website context.
 */
class CredentialMatcher {

    /**
     * Filters a list of credentials based on app/package name or URL.
     * Matching strategies in order of specificity:
     * 1. Exact URL match
     * 2. Base URL match (excluding path/query)
     * 3. Root domain match
     * 4. Domain key match (package middle segment or domain without TLD)
     * 5. General text matching on service name, username, and URL
     */
    fun filterCredentialsByAppInfo(
        credentials: List<Credential>,
        appInfo: String,
    ): List<Credential> {
        if (appInfo.isBlank()) return credentials

        val input = appInfo.trim().lowercase()
        val isUrlLike = input.contains('.') && !input.contains(' ')
        val host: String?
        val rootDomain: String?
        val domainKey: String

        if (isUrlLike && (
                input.startsWith("http://") || input.startsWith("https://") || input.startsWith(
                    "www.",
                )
                )
        ) {
            // Treat as full or partial URL
            val cleaned = input
                .removePrefix("https://")
                .removePrefix("http://")
                .removePrefix("www.")
            host = cleaned.substringBefore("/").substringBefore("?")
            rootDomain = extractRootDomain(host)
            domainKey = extractDomainWithoutExtension(rootDomain)
        } else if (isUrlLike && !input.contains('/')) {
            // Treat as package name (e.g., com.coolblue.app)
            val parts = input.split('.')
            host = null
            rootDomain = null
            domainKey = if (parts.size >= 3) parts[1] else parts.first()
        } else {
            // Plain text search
            host = null
            rootDomain = null
            domainKey = input
        }

        val matches = mutableListOf<Credential>()

        if (host != null) {
            // 1. Exact URL match (with or without scheme)
            matches += credentials.filter { cred ->
                cred.service.url?.trim()?.lowercase() in listOf(
                    input,
                    "https://$host",
                    "http://$host",
                )
            }
            // 2. Base URL match
            if (matches.isEmpty()) {
                matches += credentials.filter { cred ->
                    cred.service.url?.trim()?.lowercase()?.let { url ->
                        url.startsWith("https://$host") || url.startsWith("http://$host")
                    } == true
                }
            }
        }

        if (matches.isEmpty() && rootDomain != null) {
            // 3. Root domain match
            matches += credentials.filter { cred ->
                cred.service.url?.trim()?.lowercase()?.let { url ->
                    val u = url.removePrefix("https://")
                        .removePrefix("http://")
                        .removePrefix("www.")
                        .substringBefore("/")
                    extractRootDomain(u) == rootDomain
                } == true
            }
        }

        // 4. Domain key match against service name
        if (matches.isEmpty()) {
            matches += credentials.filter { cred ->
                cred.service.name?.lowercase()?.let { name ->
                    name.contains(domainKey) || domainKey.contains(name)
                } == true
            }
        }

        return matches
    }

    /**
     * Extracts the root domain from a host string.
     * E.g., "sub.example.com" -> "example.com"
     */
    private fun extractRootDomain(host: String): String {
        val parts = host.split('.')
        return if (parts.size >= 2) parts.takeLast(2).joinToString(".") else host
    }

    /**
     * Extracts the domain key (name without extension/TLD).
     * E.g., "example.com" -> "example"
     */
    private fun extractDomainWithoutExtension(domain: String): String {
        return domain.substringBefore('.')
    }
}
