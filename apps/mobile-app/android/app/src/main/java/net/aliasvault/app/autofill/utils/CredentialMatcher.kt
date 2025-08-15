package net.aliasvault.app.autofill.utils

import net.aliasvault.app.vaultstore.models.Credential

/**
 * Helper class to match credentials against app/website information for autofill.
 * This implementation matches the iOS filtering logic exactly for cross-platform consistency.
 */
object CredentialMatcher {

    /**
     * Extract domain from URL, handling both full URLs and partial domains.
     * @param urlString URL or domain string
     * @return Normalized domain without protocol or www
     */
    private fun extractDomain(urlString: String): String {
        if (urlString.isBlank()) return ""

        var domain = urlString.lowercase().trim()
        // Remove protocol if present
        domain = domain.replace("https://", "").replace("http://", "")
        // Remove www. prefix
        domain = domain.replace("www.", "")
        // Remove path, query, and fragment
        domain = domain.substringBefore("/").substringBefore("?").substringBefore("#")
        return domain
    }

    /**
     * Extract root domain from a domain string.
     * E.g., "sub.example.com" -> "example.com"
     */
    private fun extractRootDomain(domain: String): String {
        val parts = domain.split(".")
        return if (parts.size >= 2) parts.takeLast(2).joinToString(".") else domain
    }

    /**
     * Check if two domains match, supporting partial matches.
     * @param domain1 First domain
     * @param domain2 Second domain
     * @return True if domains match (including partial matches)
     */
    private fun domainsMatch(domain1: String, domain2: String): Boolean {
        val d1 = extractDomain(domain1)
        val d2 = extractDomain(domain2)

        // Exact match
        if (d1 == d2) return true

        // Check if one domain contains the other (for subdomain matching)
        if (d1.contains(d2) || d2.contains(d1)) return true

        // Check root domain match
        val d1Root = extractRootDomain(d1)
        val d2Root = extractRootDomain(d2)

        return d1Root == d2Root
    }

    /**
     * Filter credentials based on search text with anti-phishing protection.
     * @param credentials List of credentials to filter
     * @param searchText Search term (app info, URL, etc.)
     * @return Filtered list of credentials
     *
     * **Security Note**: When searching with a URL, text search fallback only applies to
     * credentials with no service URL defined. This prevents phishing attacks where a
     * malicious site might match credentials intended for the legitimate site.
     */
    fun filterCredentialsByAppInfo(
        credentials: List<Credential>,
        searchText: String,
    ): List<Credential> {
        if (searchText.isEmpty()) {
            return credentials
        }

        // Try to parse as URL first
        val searchDomain = extractDomain(searchText)

        if (searchDomain.isNotEmpty()) {
            val matches = mutableSetOf<Credential>()

            // Check for domain matches with priority
            credentials.forEach { credential ->
                val serviceUrl = credential.service.url
                if (!serviceUrl.isNullOrEmpty()) {
                    if (domainsMatch(searchText, serviceUrl)) {
                        matches.add(credential)
                    }
                }
            }

            // SECURITY: If no domain matches found, only search text in credentials with NO service URL
            // This prevents phishing attacks by ensuring URL-based credentials only match their domains
            if (matches.isEmpty()) {
                val domainParts = searchDomain.split(".")
                val domainWithoutExtension = domainParts.firstOrNull()?.lowercase() ?: searchDomain.lowercase()

                val nameMatches = credentials.filter { credential ->
                    // CRITICAL: Only search in credentials that have no service URL defined
                    if (!credential.service.url.isNullOrEmpty()) return@filter false
                    val serviceNameMatch = credential.service.name?.lowercase()?.contains(domainWithoutExtension) ?: false
                    val notesMatch = credential.notes?.lowercase()?.contains(domainWithoutExtension) ?: false
                    serviceNameMatch || notesMatch
                }
                matches.addAll(nameMatches)
            }

            return matches.toList()
        } else {
            // Non-URL fallback: simple text search in service name, username, or notes
            val lowercasedSearch = searchText.lowercase()
            return credentials.filter { credential ->
                (credential.service.name?.lowercase()?.contains(lowercasedSearch) ?: false) ||
                    (credential.username?.lowercase()?.contains(lowercasedSearch) ?: false) ||
                    (credential.notes?.lowercase()?.contains(lowercasedSearch) ?: false)
            }
        }
    }
}
