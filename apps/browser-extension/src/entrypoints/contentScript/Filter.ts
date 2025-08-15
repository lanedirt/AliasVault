import type { Credential } from '@/utils/dist/shared/models/vault';
import { CombinedStopWords } from '@/utils/formDetector/FieldPatterns';

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
 * Filter credentials based on current URL and page context to determine which credentials to show
 * in the autofill popup. Credentials are sorted by priority:
 * 1. Exact domain match (highest priority)
 * 2. Partial domain match (root domain match)
 * 3. Base URL match AND page title word match
 * 4. Base URL match only
 * 5. Page title word match only (lowest priority)
 */
export function filterCredentials(credentials: Credential[], currentUrl: string, pageTitle: string): Credential[] {
  const filtered: CredentialWithPriority[] = [];
  const currentDomain = extractDomain(currentUrl);

  // Check each credential for matches
  credentials.forEach(cred => {
    if (!cred.ServiceUrl || cred.ServiceUrl.length === 0) {
      return;
    }

    const credDomain = extractDomain(cred.ServiceUrl);

    // Check for domain match (exact or partial)
    if (domainsMatch(currentDomain, credDomain)) {
      // Exact match gets higher priority
      const priority = currentDomain === credDomain ? 1 : 2;
      filtered.push({ ...cred, priority });
    }
  });

  // If we have domain matches, return them sorted by priority
  if (filtered.length > 0) {
    return filtered
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3);
  }

  // Prepare page title words for matching
  const titleWords = pageTitle.length > 0
    ? pageTitle.toLowerCase()
      .split(/\s+/)
      .filter(word =>
        word.length > 3 &&
          !CombinedStopWords.has(word.toLowerCase())
      )
    : [];

  // Check for page title matches as fallback
  credentials.forEach(cred => {
    // Skip if already in filtered list
    if (filtered.some(f => f.Id === cred.Id)) {
      return;
    }

    // Check page title match
    if (titleWords.length > 0 && cred.ServiceName) {
      const credNameWords = cred.ServiceName.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !CombinedStopWords.has(word));
      const hasTitleMatch = titleWords.some(word =>
        credNameWords.some(credWord => credWord.includes(word))
      );

      if (hasTitleMatch) {
        filtered.push({ ...cred, priority: 5 });
      }
    }
  });

  // Sort by priority and then take unique credentials
  const uniqueCredentials = Array.from(
    new Map(filtered
      .sort((a, b) => a.priority - b.priority)
      .map(cred => [cred.Id, cred]))
      .values()
  );
  // Show max 3 results
  return uniqueCredentials.slice(0, 3);
}
