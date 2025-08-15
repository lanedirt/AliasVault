package net.aliasvault.app.autofill.utils

import net.aliasvault.app.vaultstore.models.Credential

/**
 * Helper class to match credentials against app/website information for autofill.
 * This class handles the logic of determining which credentials are relevant
 * for a given app or website context.
 */
object CredentialMatcher {
    
    /**
     * Extract domain from URL, handling both full URLs and partial domains.
     * @param url URL or domain string
     * @return Normalized domain without protocol or www
     */
    private fun extractDomain(url: String): String {
        var domain = url.trim().lowercase()
        // Remove protocol if present
        domain = domain.removePrefix("https://").removePrefix("http://")
        // Remove www. prefix
        domain = domain.removePrefix("www.")
        // Remove path, query, and fragment
        domain = domain.substringBefore("/").substringBefore("?").substringBefore("#")
        return domain
    }
    
    /**
     * Check if two domains match, supporting partial matches.
     * @param domain1 First domain
     * @param domain2 Second domain
     * @return True if domains match (including partial matches)
     */
    private fun domainsMatch(domain1: String, domain2: String): Boolean {
        if (domain1.isBlank() || domain2.isBlank()) return false
        
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
     * Filters a list of credentials based on app/package name or URL.
     * Matching strategies in order of priority:
     * 1. Exact domain match
     * 2. Partial domain match (root domain match)
     * 3. Domain key match (package middle segment or domain without TLD)
     * 4. General text matching on service name and notes
     */
    fun filterCredentialsByAppInfo(
        credentials: List<Credential>,
        appInfo: String,
    ): List<Credential> {
        if (appInfo.isBlank()) {
            return credentials
        }

        val input = appInfo.trim()
        val inputDomain = extractDomain(input)
        val isPackageName = input.lowercase().matches(Regex("^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$"))
        
        val domainKey: String = if (isPackageName) {
            // Extract key from package name (e.g., "coolblue" from "com.coolblue.app")
            val parts = input.split('.')
            if (parts.size >= 3) parts[1] else parts.firstOrNull() ?: input
        } else {
            // Extract domain without extension
            extractDomainWithoutExtension(inputDomain)
        }

        val matches = mutableListOf<Credential>()
        val matchedIds = mutableSetOf<String>()

        // Priority 1: Domain matches (exact and partial)
        if (inputDomain.isNotBlank()) {
            credentials.forEach { cred ->
                val serviceUrl = cred.service.url
                if (!serviceUrl.isNullOrBlank() && cred.id !in matchedIds) {
                    if (domainsMatch(input, serviceUrl)) {
                        matches.add(cred)
                        matchedIds.add(cred.id)
                    }
                }
            }
        }
        
        // Priority 2: Domain key match against service name and notes
        if (domainKey.isNotBlank()) {
            credentials.forEach { cred ->
                if (cred.id !in matchedIds) {
                    val nameMatches = cred.service.name?.lowercase()?.contains(domainKey) == true
                    val notesMatches = cred.notes?.lowercase()?.contains(domainKey) == true
                    
                    if (nameMatches || notesMatches) {
                        matches.add(cred)
                        matchedIds.add(cred.id)
                    }
                }
            }
        }
        
        // Priority 3: Fallback text search if no matches found
        if (matches.isEmpty()) {
            val searchText = input.lowercase()
            credentials.forEach { cred ->
                val nameMatches = cred.service.name?.lowercase()?.contains(searchText) == true
                val urlMatches = cred.service.url?.lowercase()?.contains(searchText) == true
                val notesMatches = cred.notes?.lowercase()?.contains(searchText) == true
                
                if (nameMatches || urlMatches || notesMatches) {
                    matches.add(cred)
                }
            }
        }

        // Deduplicate matches based on credential ID to avoid duplicates from different matching strategies
        return matches.distinctBy { it.id }
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
