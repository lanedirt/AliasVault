import { sendMessage } from 'webext-bridge/content-script';

import { AppInfo } from '@/utils/AppInfo';

import { storage } from '#imports';

/**
 * Gets the configured client URL from browser extension settings
 */
async function getConfiguredClientUrl(): Promise<string> {
  try {
    const clientUrl = await storage.getItem('local:clientUrl') as string;
    if (!clientUrl || clientUrl.length === 0) {
      // Use default client URL if no API URL is configured
      return AppInfo.DEFAULT_CLIENT_URL;
    }

    return clientUrl.replace(/\/api\/?$/, '');
  } catch (error) {
    console.error('[AliasVault Extension SSO] Error getting configured client URL:', error);
    return AppInfo.DEFAULT_CLIENT_URL;
  }
}

/**
 * Validates if the current page URL matches the configured client URL
 */
async function isValidClientUrl(): Promise<boolean> {
  const configuredUrl = await getConfiguredClientUrl();
  const currentOrigin = window.location.origin;

  console.info('[AliasVault Extension SSO] Configured client URL:', configuredUrl);
  console.info('[AliasVault Extension SSO] Current origin:', currentOrigin);

  return currentOrigin === configuredUrl;
}

/**
 * Detects if the current page is an AliasVault web client and validates URL
 */
export async function detectAliasVaultWebClient(): Promise<boolean> {
  console.info('[AliasVault Extension SSO] Checking if page is AliasVault web client...');
  console.info('[AliasVault Extension SSO] Current URL:', window.location.href);

  // First check: Validate URL matches configured client URL for security
  const isValidUrl = await isValidClientUrl();
  if (!isValidUrl) {
    console.info('[AliasVault Extension SSO] URL does not match configured client URL, skipping SSO');
    return false;
  }

  // Second check: Look for AliasVault web client indicators
  const indicators = [
    // Check for AliasVault-specific elements
    (): Element | null => document.querySelector('meta[name="application-name"][content="AliasVault"]'),
    (): boolean | undefined => document.querySelector('title')?.textContent?.includes('AliasVault'),
    (): Element | null => document.querySelector('#blazor-root'),
    (): Element | null => document.querySelector('script[src*="blazor"]'),
    // Check for specific Blazor WebAssembly indicators
    (): boolean | undefined => document.querySelector('script')?.textContent?.includes('Blazor.start'),
  ];

  const results = indicators.map((check, index) => {
    const result = check();
    console.info(`[AliasVault Extension SSO] Indicator ${index + 1}:`, result);
    return result;
  });

  const isAliasVault = results.some(Boolean);
  console.info('[AliasVault Extension SSO] Is AliasVault web client:', isAliasVault);

  return isAliasVault;
}

/**
 * Offers SSO login to the user if extension is authenticated
 */
export async function offerSSOLogin(): Promise<void> {
  try {
    console.info('[AliasVault Extension SSO] Checking if SSO login should be offered...');

    // Check if extension is authenticated and vault is unlocked
    const authStatus = await sendMessage('CHECK_AUTH_STATUS', {}, 'background') as {
      isLoggedIn: boolean,
      isVaultLocked: boolean,
      hasPendingMigrations: boolean,
      error?: string
    };

    console.info('[AliasVault Extension SSO] Extension auth status:', authStatus);

    if (!authStatus.isLoggedIn || authStatus.isVaultLocked || authStatus.hasPendingMigrations) {
      console.info('[AliasVault Extension SSO] Extension not ready for SSO - not logged in, vault locked, or has pending migrations');
      return; // Extension not ready for SSO
    }

    // Check if web client is already authenticated by looking for login forms
    const isAlreadyAuth = isWebClientAlreadyAuthenticated();
    console.info('[AliasVault Extension SSO] Web client already authenticated:', isAlreadyAuth);

    if (isAlreadyAuth) {
      console.info('[AliasVault Extension SSO] Web client already logged in, skipping SSO offer');
      return; // Web client already logged in
    }

    console.info('[AliasVault Extension SSO] Showing SSO offer popup');
    // Show SSO offer popup
    showSSOOfferPopup();
  } catch (error) {
    console.error('[AliasVault Extension SSO] Error checking SSO availability:', error);
  }
}

/**
 * Checks if the web client is already authenticated
 */
function isWebClientAlreadyAuthenticated(): boolean {
  // Check current URL path for authenticated areas
  const currentPath = window.location.pathname;
  const authenticatedPaths = ['/credentials', '/emails', '/settings', '/unlock'];

  if (authenticatedPaths.some(path => currentPath.startsWith(path))) {
    console.info('[AliasVault Extension SSO] Already in authenticated area:', currentPath);
    return true;
  }

  // Check for authenticated state indicators in DOM
  const authIndicators = [
    // Authenticated routes or elements present
    document.querySelector('[href*="/credentials"], [href*="/emails"], [href*="/settings"]'),
    // Blazor authentication state
    document.querySelector('script')?.textContent?.includes('"AuthenticationState"'),
    // Check if we're already past login (no login form AND not on start/login pages)
    !document.querySelector('form[action*="login"], form[action*="auth"]') &&
    !['/user/login', '/user/start', '/'].includes(currentPath),
  ];

  const isAuthenticated = authIndicators.some(Boolean);
  console.info('[AliasVault Extension SSO] Authentication indicators:', authIndicators, 'Result:', isAuthenticated);

  return isAuthenticated;
}

/**
 * Shows the SSO offer popup to the user
 */
function showSSOOfferPopup(): void {
  // Avoid showing multiple popups
  if (document.getElementById('aliasvault-sso-offer')) {
    return;
  }

  const popup = createSSOPopup();
  document.body.appendChild(popup);

  // Auto-remove popup after 10 seconds
  setTimeout(() => {
    popup.remove();
  }, 10000);
}

/**
 * Creates the SSO offer popup element
 */
function createSSOPopup(): HTMLElement {
  const popup = document.createElement('div');
  popup.id = 'aliasvault-sso-offer';
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ffffff;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  popup.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 12px;">
      <div style="width: 24px; height: 24px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
        <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.11 7 14 7.89 14 9S13.11 11 12 11 10 10.11 10 9 10.89 7 12 7M18 9C18 13.25 15.22 17 12 17S6 13.25 6 9L12 3L18 9Z"/>
        </svg>
      </div>
      <strong style="color: #1f2937;">AliasVault Extension</strong>
    </div>
    <p style="margin: 0 0 12px 0; color: #4b5563; line-height: 1.4;">
      You're already signed in to AliasVault in your browser extension. Would you like to sign in to this web client automatically?
    </p>
    <div style="display: flex; gap: 8px;">
      <button id="sso-accept" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
      ">Sign In</button>
      <button id="sso-decline" style="
        background: #f3f4f6;
        color: #6b7280;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      ">Not Now</button>
    </div>
  `;

  // Add event listeners
  const acceptBtn = popup.querySelector('#sso-accept') as HTMLButtonElement;
  const declineBtn = popup.querySelector('#sso-decline') as HTMLButtonElement;

  acceptBtn.addEventListener('click', async () => {
    acceptBtn.textContent = 'Signing in...';
    acceptBtn.disabled = true;
    await performSSOLogin();
    popup.remove();
  });

  declineBtn.addEventListener('click', () => {
    popup.remove();
  });

  return popup;
}

/**
 * Performs the actual SSO login by sharing authentication data
 */
async function performSSOLogin(): Promise<void> {
  try {
    // Get authentication data from extension
    const authData = await sendMessage('GET_SSO_AUTH_DATA', {}, 'background') as {
      success: boolean;
      accessToken?: string;
      refreshToken?: string;
      encryptedVault?: string;
      derivedKey?: string;
      username?: string;
      vaultRevisionNumber?: number;
      error?: string;
    };

    if (!authData.success || !authData.accessToken) {
      console.error('Failed to get SSO auth data:', authData.error);
      showSSOError('Failed to get authentication data from extension');
      return;
    }

    // Send authentication data to web client via postMessage
    const ssoData = {
      type: 'ALIASVAULT_SSO_AUTH',
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      encryptedVault: authData.encryptedVault,
      derivedKey: authData.derivedKey,
      username: authData.username,
      vaultRevisionNumber: authData.vaultRevisionNumber,
      timestamp: Date.now(),
    };

    // Send to web client
    window.postMessage(ssoData, window.location.origin);

    console.info('SSO authentication data sent to web client');
  } catch (error) {
    console.error('Error performing SSO login:', error);
    showSSOError('Failed to sign in automatically');
  }
}

/**
 * Shows an SSO error message
 */
function showSSOError(message: string): void {
  const errorPopup = document.createElement('div');
  errorPopup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #fef2f2;
    border: 2px solid #ef4444;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    max-width: 300px;
    color: #dc2626;
  `;

  errorPopup.innerHTML = `
    <strong>SSO Error</strong><br>
    ${message}
  `;

  document.body.appendChild(errorPopup);

  setTimeout(() => {
    errorPopup.remove();
  }, 5000);
}