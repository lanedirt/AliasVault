package net.aliasvault.app.autofill

import android.net.Uri
import net.aliasvault.app.vaultstore.models.Credential

/**
 * Helper class to match credentials against app/website information for autofill.
 * This class handles the logic of determining which credentials are relevant
 * for a given app or website context.
 */
class CredentialMatcher {
    /**
     * Filters a list of credentials based on app/website information.
     * Uses multiple matching strategies in order of specificity:
     * 1. Exact URL match
     * 2. Base URL match (excluding query/path)
     * 3. Root domain match
     * 4. Domain name part match
     * 5. General text matching on service name, username, and URL
     */
    fun filterCredentialsByAppInfo(credentials: List<Credential>, appInfo: String): List<Credential> {
        // First try URL-based matching
        val uri = try {
            Uri.parse(appInfo)
        } catch (e: Exception) {
            null
        }

        val matches = mutableListOf<Credential>()

        if (uri != null && uri.host != null) {
            val host = uri.host!!
            val baseUrl = "${uri.scheme}://$host"
            val rootDomain = extractRootDomain(host)
            val domainWithoutExtension = extractDomainWithoutExtension(rootDomain)

            // 1. Exact URL match
            matches.addAll(credentials.filter { credential ->
                credential.service.url?.equals(appInfo, ignoreCase = true) == true
            })

            // 2. Base URL match (excluding query/path)
            if (matches.isEmpty()) {
                matches.addAll(credentials.filter { credential ->
                    credential.service.url?.startsWith(baseUrl, ignoreCase = true) == true
                })
            }

            // 3. Root domain match (e.g., coolblue.nl)
            if (matches.isEmpty()) {
                matches.addAll(credentials.filter { credential ->
                    credential.service.url?.let { url ->
                        extractRootDomain(url)?.equals(rootDomain, ignoreCase = true) == true
                    } ?: false
                })
            }

            // 4. Domain name part match (e.g., "coolblue" in service name)
            if (matches.isEmpty()) {
                matches.addAll(credentials.filter { credential ->
                    credential.service.name?.let { name ->
                        name.contains(domainWithoutExtension, ignoreCase = true) ||
                        domainWithoutExtension.contains(name, ignoreCase = true)
                    } ?: false
                })
            }
        }

        // If no URL matches found or appInfo is not a URL, try non-URL matching
        if (matches.isEmpty()) {
            // Split appInfo into words for better matching
            val searchTerms = appInfo.split(Regex("[\\s._-]+")).filter { it.isNotEmpty() }

            matches.addAll(credentials.filter { credential ->
                // Check service name
                credential.service.name?.let { name ->
                    searchTerms.any { term ->
                        name.contains(term, ignoreCase = true) ||
                        term.contains(name, ignoreCase = true)
                    }
                } ?: false ||
                // Check username
                credential.username?.let { username ->
                    searchTerms.any { term ->
                        username.contains(term, ignoreCase = true) ||
                        term.contains(username, ignoreCase = true)
                    }
                } ?: false ||
                // Check service URL (even if appInfo isn't a URL)
                credential.service.url?.let { url ->
                    searchTerms.any { term ->
                        url.contains(term, ignoreCase = true) ||
                        term.contains(url, ignoreCase = true)
                    }
                } ?: false
            })
        }

        return matches
    }

    /**
     * Extracts the root domain from a host string.
     * For example: "sub.example.com" -> "example.com"
     */
    private fun extractRootDomain(host: String): String {
        val parts = host.split(".")
        return if (parts.size >= 2) {
            parts.takeLast(2).joinToString(".")
        } else {
            host
        }
    }

    /**
     * Extracts the domain name without its extension.
     * For example: "example.com" -> "example"
     */
    private fun extractDomainWithoutExtension(domain: String): String {
        return domain.split(".").firstOrNull() ?: domain
    }
}