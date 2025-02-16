import { Credential } from "../shared/types/Credential";

/**
 * Filter credentials based on current URL and page context to determine which credentials to show
 * in the autofill popup.
 */
export function filterCredentials(credentials: Credential[], currentUrl: string, pageTitle: string): Credential[] {
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.protocol}//${urlObject.hostname}`;

  // 1. Exact URL match
  let filtered = credentials.filter(cred =>
    cred.ServiceUrl?.toLowerCase() === currentUrl.toLowerCase()
  );

  // 2. Base URL match with fuzzy domain comparison if no exact matches
  filtered = credentials.filter(cred => {
    if (!cred.ServiceUrl) return false;
    try {
      const credUrlObject = new URL(cred.ServiceUrl);
      const currentUrlObject = new URL(baseUrl);

      // Extract root domains by splitting on dots and taking last two parts
      const credDomainParts = credUrlObject.hostname.toLowerCase().split('.');
      const currentDomainParts = currentUrlObject.hostname.toLowerCase().split('.');

      // Get root domain (last two parts, e.g., 'aliasvaul.net')
      const credRootDomain = credDomainParts.slice(-2).join('.');
      const currentRootDomain = currentDomainParts.slice(-2).join('.');

      // Compare protocols and root domains
      return credUrlObject.protocol === currentUrlObject.protocol &&
                credRootDomain === currentRootDomain;
    } catch {
      return false;
    }
  });

  // 3. Page title word match if still no matches
  if (filtered.length === 0 && pageTitle.length > 0) {
    const titleWords = pageTitle.toLowerCase().split(/\s+/);
    filtered = credentials.filter(cred =>
      titleWords.some(word =>
        cred.ServiceName.toLowerCase().includes(word)
      )
    );
  }

  // Show max 3 results
  return filtered.slice(0, 3);
}
