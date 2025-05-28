/**
 * Utility functions for handling service URLs and names
 */

/**
 * Extract the service name from a service URL.
 * @param url The service URL to extract the name from
 * @returns The extracted service name
 */
export function extractServiceNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');

    // Remove common subdomains
    const commonSubdomains = ['www', 'app', 'login', 'auth', 'account', 'portal'];
    while (hostParts.length > 2 && commonSubdomains.includes(hostParts[0].toLowerCase())) {
      hostParts.shift();
    }

    // For domains like google.com, return Google.com
    if (hostParts.length <= 2) {
      const domain = hostParts.join('.');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }

    // For domains like app.example.com, return Example.com
    const mainDomain = hostParts.slice(-2).join('.');
    return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
  } catch {
    // If URL parsing fails, return the original URL
    return url;
  }
}