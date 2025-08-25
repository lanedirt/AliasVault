import type { Credential } from '@/utils/dist/shared/models/vault';
import { CombinedStopWords } from '@/utils/formDetector/FieldPatterns';

export enum AutofillMatchingMode {
  DEFAULT = 'default',
  URL_EXACT = 'url_exact',
  URL_SUBDOMAIN = 'url_subdomain'
}

type CredentialWithPriority = Credential & {
  priority: number;
}

/**
 * Extract domain from URL, handling both full URLs and partial domains
 * @param url - URL or domain string
 * @returns Normalized domain without protocol or www
 */
function extractDomain(url: string): string {
  if (!url) {
    return '';
  }

  // Remove protocol if present
  let domain = url.toLowerCase().trim();
  domain = domain.replace(/^https?:\/\//, '');

  // Remove www. prefix
  domain = domain.replace(/^www\./, '');

  // Remove path, query, and fragment
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];

  return domain;
}

/**
 * Check if two domains match, supporting partial matches
 * @param domain1 - First domain
 * @param domain2 - Second domain
 * @returns True if domains match (including partial matches)
 */
function domainsMatch(domain1: string, domain2: string): boolean {
  if (!domain1 || !domain2) {
    return false;
  }

  const d1 = extractDomain(domain1);
  const d2 = extractDomain(domain2);

  // Exact match
  if (d1 === d2) {
    return true;
  }

  // Check if one domain contains the other (for subdomain matching)
  if (d1.includes(d2) || d2.includes(d1)) {
    return true;
  }

  // Extract root domains for comparison
  const d1Parts = d1.split('.');
  const d2Parts = d2.split('.');

  // Get the last 2 parts (domain.tld) for comparison
  const d1Root = d1Parts.slice(-2).join('.');
  const d2Root = d2Parts.slice(-2).join('.');

  return d1Root === d2Root;
}

/**
 * Extract meaningful words from text, removing punctuation and filtering stop words
 * @param text - Text to extract words from
 * @returns Array of filtered words
 */
function extractWords(text: string): string[] {
  if (!text || text.length === 0) {
    return [];
  }

  return text.toLowerCase()
    // Replace common separators and punctuation with spaces
    .replace(/[|,;:\-–—/\\()[\]{}'"`~!@#$%^&*+=<>?]/g, ' ')
    // Split on whitespace and filter
    .split(/\s+/)
    .filter(word =>
      word.length > 3 &&
      !CombinedStopWords.has(word)
    );
}

/**
 * Filter credentials based on current URL and page context with anti-phishing protection.
 *
 * **Security Note**: When searching with a URL, text search fallback only applies to
 * credentials with no service URL defined. This prevents phishing attacks where a
 * malicious site might match credentials intended for the legitimate site.
 *
 * Credentials are sorted by priority:
 * 1. Exact domain match (priority 1 - highest)
 * 2. Partial/subdomain match (priority 2)
 * 3. Service name fallback match (priority 5 - lowest, only for credentials without URLs)
 */
export function filterCredentials(credentials: Credential[], currentUrl: string, pageTitle: string, matchingMode: AutofillMatchingMode = AutofillMatchingMode.DEFAULT): Credential[] {
  const filtered: CredentialWithPriority[] = [];
  const currentDomain = extractDomain(currentUrl);

  // Determine feature flags based on matching mode
  let enableExactMatch = false;
  let enableSubdomainMatch = false;
  let enableServiceNameFallback = false;

  switch (matchingMode) {
    case AutofillMatchingMode.URL_EXACT:
      enableExactMatch = true;
      enableSubdomainMatch = false;
      enableServiceNameFallback = false;
      break;

    case AutofillMatchingMode.URL_SUBDOMAIN:
      enableExactMatch = true;
      enableSubdomainMatch = true;
      enableServiceNameFallback = false;
      break;

    case AutofillMatchingMode.DEFAULT:
      enableExactMatch = true;
      enableSubdomainMatch = true;
      enableServiceNameFallback = true;
      break;
  }

  // Process credentials with service URLs
  credentials.forEach(cred => {
    if (!cred.ServiceUrl || cred.ServiceUrl.length === 0) {
      return; // Handle these in service name fallback
    }

    const credDomain = extractDomain(cred.ServiceUrl);

    // Check for exact match (priority 1)
    if (enableExactMatch && currentDomain === credDomain) {
      filtered.push({ ...cred, priority: 1 });
      return;
    }

    // Check for subdomain/partial match (priority 2)
    if (enableSubdomainMatch && domainsMatch(currentDomain, credDomain)) {
      filtered.push({ ...cred, priority: 2 });
      return;
    }
  });

  // Service name fallback for credentials without URLs (priority 5)
  if (enableServiceNameFallback) {
    /*
     * SECURITY: Service name matching only applies to credentials with no service URL.
     * This prevents phishing attacks where a malicious site might match credentials
     * intended for a legitimate site.
     */

    // Extract words from page title
    const titleWords = extractWords(pageTitle);

    if (titleWords.length > 0) {
      credentials.forEach(cred => {
        // CRITICAL: Only check credentials that have NO service URL defined
        if (cred.ServiceUrl && cred.ServiceUrl.length > 0) {
          return;
        }

        // Skip if already in filtered list
        if (filtered.some(f => f.Id === cred.Id)) {
          return;
        }

        // Check page title match with service name
        if (cred.ServiceName) {
          const credNameWords = extractWords(cred.ServiceName);

          /*
           * Match only complete words, not substrings
           * For example: "Express" should match "My Express Account" but not "AliExpress"
           */
          const hasTitleMatch = titleWords.some(titleWord =>
            credNameWords.some(credWord =>
              titleWord === credWord // Exact word match only
            )
          );

          if (hasTitleMatch) {
            filtered.push({ ...cred, priority: 5 });
          }
        }
      });
    }
  }

  // Sort by priority and return unique credentials (max 3)
  const uniqueCredentials = Array.from(
    new Map(
      filtered
        .sort((a, b) => a.priority - b.priority)
        .map(cred => [cred.Id, cred])
    ).values()
  );

  return uniqueCredentials.slice(0, 3);
}
