import { CombinedStopWords } from "@/utils/formDetector/FieldPatterns";
import { Credential } from "../../utils/types/Credential";

type CredentialWithPriority = Credential & {
  priority: number;
}

/**
 * Filter credentials based on current URL and page context to determine which credentials to show
 * in the autofill popup. Credentials are sorted by priority:
 * 1. Exact URL match (highest priority)
 * 2. Base URL match AND page title word match
 * 3. Base URL match only
 * 4. Page title word match only (lowest priority)
 */
export function filterCredentials(credentials: Credential[], currentUrl: string, pageTitle: string): Credential[] {
  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.protocol}//${urlObject.hostname}`;
  const filtered: CredentialWithPriority[] = [];

  const sanitizedCurrentUrl = currentUrl.toLowerCase().replace('www.', '');

  // 1. Exact URL match (priority 1)
  credentials.forEach(cred => {
    if (!cred.ServiceUrl || cred.ServiceUrl.length === 0) {
      return;
    }

    const sanitizedCredUrl = cred.ServiceUrl.toLowerCase().replace('www.', '');

    if (sanitizedCurrentUrl.startsWith(sanitizedCredUrl)) {
      filtered.push({ ...cred, priority: 1 });
    }
  });

  // If we have one or more exact matches, do not continue to other matches
  if (filtered.length > 0) {
    return filtered;
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

  // Check for base URL matches and page title matches
  credentials.forEach(cred => {
    if (!cred.ServiceUrl || filtered.some(f => f.Id === cred.Id)) {
      return;
    }

    let hasBaseUrlMatch = false;
    let hasTitleMatch = false;

    // Check base URL match
    try {
      const credUrlObject = new URL(cred.ServiceUrl);
      const currentUrlObject = new URL(baseUrl);

      const credDomainParts = credUrlObject.hostname.toLowerCase().split('.');
      const currentDomainParts = currentUrlObject.hostname.toLowerCase().split('.');

      const credRootDomain = credDomainParts.slice(-2).join('.');
      const currentRootDomain = currentDomainParts.slice(-2).join('.');

      if (credUrlObject.protocol === currentUrlObject.protocol &&
          credRootDomain === currentRootDomain) {
        hasBaseUrlMatch = true;
      }
    } catch {
      // Invalid URL, skip
    }

    // Check page title match
    if (titleWords.length > 0) {
      const credNameWords = cred.ServiceName.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3 && !CombinedStopWords.has(word));
      hasTitleMatch = titleWords.some(word =>
        credNameWords.some(credWord => credWord.includes(word))
      );
    }

    // Assign priority based on matches
    if (hasBaseUrlMatch && hasTitleMatch) {
      filtered.push({ ...cred, priority: 2 });
    } else if (hasBaseUrlMatch) {
      filtered.push({ ...cred, priority: 3 });
    } else if (hasTitleMatch) {
      filtered.push({ ...cred, priority: 4 });
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
