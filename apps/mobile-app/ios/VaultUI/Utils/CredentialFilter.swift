import Foundation
import VaultModels

/// Utility class for filtering credentials based on search text.
/// This class contains the core filtering logic used by both UI and tests for consistency.
public class CredentialFilter {

    /// Extract domain from URL, handling both full URLs and partial domains.
    /// - Parameter urlString: URL or domain string
    /// - Returns: Normalized domain without protocol or www, or empty string if not a valid URL/domain
    private static func extractDomain(from urlString: String) -> String {
        guard !urlString.isEmpty else { return "" }

        var domain = urlString.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)

        // Check if it starts with a protocol
        let hasProtocol = domain.hasPrefix("http://") || domain.hasPrefix("https://")

        // Remove protocol if present
        if hasProtocol {
            domain = domain.replacingOccurrences(of: "https://", with: "")
            domain = domain.replacingOccurrences(of: "http://", with: "")
        }

        // Remove www. prefix
        domain = domain.replacingOccurrences(of: "www.", with: "")

        // Remove path, query, and fragment
        if let firstSlash = domain.firstIndex(of: "/") {
            domain = String(domain[..<firstSlash])
        }
        if let firstQuestion = domain.firstIndex(of: "?") {
            domain = String(domain[..<firstQuestion])
        }
        if let firstHash = domain.firstIndex(of: "#") {
            domain = String(domain[..<firstHash])
        }

        // Basic domain validation - must contain at least one dot and valid characters
        do {
            let domainRegex = try NSRegularExpression(pattern: "^[a-z0-9.-]+$")
            
            let range = NSRange(location: 0, length: domain.utf16.count)
            if !domain.contains(".") || domainRegex.firstMatch(in: domain, options: [], range: range) == nil {
                return ""
            }
        } catch {
            return ""
        }
        
        // Ensure we have a valid domain structure
        if domain.isEmpty || domain.hasPrefix(".") || domain.hasSuffix(".") || domain.contains("..") {
            return ""
        }

        return domain
    }

    /// Extract root domain from a domain string.
    /// - Parameter domain: Domain string
    /// - Returns: Root domain (e.g., "sub.example.com" -> "example.com")
    private static func extractRootDomain(from domain: String) -> String {
        let parts = domain.components(separatedBy: ".")
        return parts.count >= 2 ? parts.suffix(2).joined(separator: ".") : domain
    }

    /// Check if two domains match, supporting partial matches.
    /// - Parameters:
    ///   - domain1: First domain
    ///   - domain2: Second domain
    /// - Returns: True if domains match (including partial matches)
    private static func domainsMatch(_ domain1: String, _ domain2: String) -> Bool {
        let d1 = extractDomain(from: domain1)
        let d2 = extractDomain(from: domain2)

        // Exact match
        if d1 == d2 { return true }

        // Check if one domain contains the other (for subdomain matching)
        if d1.contains(d2) || d2.contains(d1) { return true }

        // Check root domain match
        let d1Root = extractRootDomain(from: d1)
        let d2Root = extractRootDomain(from: d2)

        return d1Root == d2Root
    }

    /// Extract meaningful words from text, removing punctuation and filtering stop words.
    /// - Parameter text: Text to extract words from
    /// - Returns: Array of filtered words
    private static func extractWords(from text: String) -> [String] {
        guard !text.isEmpty else { return [] }

        let lowercased = text.lowercased()

        // Replace common separators and punctuation with spaces
        let punctuationPattern = "[|,;:\\-–—/\\\\()\\[\\]{}'\" ~!@#$%^&*+=<>?]"
        let withoutPunctuation = lowercased.replacingOccurrences(
            of: punctuationPattern,
            with: " ",
            options: .regularExpression
        )

        // Split on whitespace and filter
        return withoutPunctuation
            .components(separatedBy: .whitespacesAndNewlines)
            .filter { word in
                word.count > 3  // Filter out short words
            }
    }

    /// Filter credentials based on search text with anti-phishing protection.
    /// - Parameters:
    ///   - credentials: List of credentials to filter
    ///   - searchText: Search term (app info, URL, etc.)
    /// - Returns: Filtered list of credentials
    ///
    /// **Security Note**: When searching with a URL, text search fallback only applies to
    /// credentials with no service URL defined. This prevents phishing attacks where a
    /// malicious site might match credentials intended for the legitimate site.
    public static func filterCredentials(_ credentials: [Credential], searchText: String) -> [Credential] {
        if searchText.isEmpty {
            return credentials
        }

        // Try to parse as URL first
        let searchDomain = extractDomain(from: searchText)

        if !searchDomain.isEmpty {
            var matches: Set<Credential> = []

            // Check for domain matches with priority
            credentials.forEach { credential in
                guard let serviceUrl = credential.service.url, !serviceUrl.isEmpty else { return }

                if domainsMatch(searchText, serviceUrl) {
                    matches.insert(credential)
                }
            }

            // SECURITY: If no domain matches found, only search text in credentials with NO service URL
            // This prevents phishing attacks by ensuring URL-based credentials only match their domains
            if matches.isEmpty {
                let domainParts = searchDomain.components(separatedBy: ".")
                let domainWithoutExtension = domainParts.first?.lowercased() ?? searchDomain.lowercased()

                let nameMatches = credentials.filter { credential in
                    // CRITICAL: Only search in credentials that have no service URL defined
                    guard credential.service.url?.isEmpty != false else { return false }

                    let serviceNameMatch = credential.service.name?.lowercased().contains(domainWithoutExtension) ?? false
                    let notesMatch = credential.notes?.lowercased().contains(domainWithoutExtension) ?? false
                    return serviceNameMatch || notesMatch
                }
                matches.formUnion(nameMatches)
            }

            return Array(matches)
        } else {
            // Non-URL fallback: Extract words from search text for better matching
            let searchWords = extractWords(from: searchText)

            if searchWords.isEmpty {
                // If no meaningful words after extraction, fall back to simple contains
                let lowercasedSearch = searchText.lowercased()
                return credentials.filter { credential in
                    (credential.service.name?.lowercased().contains(lowercasedSearch) ?? false) ||
                        (credential.username?.lowercased().contains(lowercasedSearch) ?? false) ||
                        (credential.notes?.lowercased().contains(lowercasedSearch) ?? false)
                }
            }

            // Match using extracted words
            return credentials.filter { credential in
                let serviceNameWords = credential.service.name.map { extractWords(from: $0) } ?? []
                let usernameWords = credential.username.map { extractWords(from: $0) } ?? []
                let notesWords = credential.notes.map { extractWords(from: $0) } ?? []

                // Check if any search word matches any credential word exactly
                return searchWords.contains { searchWord in
                    serviceNameWords.contains(searchWord) ||
                        usernameWords.contains(searchWord) ||
                        notesWords.contains(searchWord)
                }
            }
        }
    }
}
