import { Credential } from '../../utils/types/Credential';
import { fillCredential } from './Form';
import { filterCredentials } from './Filter';
import { IdentityGeneratorEn } from '../../utils/generators/Identity/implementations/IdentityGeneratorEn';
import { PasswordGenerator } from '../../utils/generators/Password/PasswordGenerator';
import { storage } from "wxt/storage";
import { sendMessage } from "webext-bridge/content-script";
import { CredentialsResponse } from '@/utils/types/messaging/CredentialsResponse';
import { CombinedStopWords } from '../../utils/formDetector/FieldPatterns';
import { PasswordSettingsResponse } from '@/utils/types/messaging/PasswordSettingsResponse';

/**
 * WeakMap to store event listeners for popup containers
 */
let popupListeners = new WeakMap<HTMLElement, EventListener>();

/**
 * Placeholder base64 image for credentials without a logo.
 */
const placeholderBase64 = 'UklGRjoEAABXRUJQVlA4IC4EAAAwFwCdASqAAIAAPpFCm0olo6Ihp5IraLASCWUA0eb/0s56RrLtCnYfLPiBshdXWMx8j1Ez65f169iA4xUDBTEV6ylMQeCIj2b7RngGi7gKZ9WjKdSoy9R8JcgOmjCMlDmLG20KhNo/i/Dc/Ah5GAvGfm8kfniV3AkR6fxN6eKwjDc6xrDgSfS48G5uGV6WzQt24YAVlLSK9BMwndzfHnePK1KFchFrL7O3ulB8cGNCeomu4o+l0SrS/JKblJ4WTzj0DAD++lCUEouSfgRKdiV2TiYCD+H+l3tANKSPQFPQuzi7rbvxqGeRmXB9kDwURaoSTTpYjA9REMUi9uA6aV7PWtBNXgUzMLowYMZeos6Xvyhb34GmufswMHA5ZyYpxzjTphOak4ZjNOiz8aScO5ygiTx99SqwX/uL+HSeVOSraHw8IymrMwm+jLxqN8BS8dGcItLlm/ioulqH2j4V8glDgSut+ExkxiD7m8TGPrrjCQNJbRDzpOFsyCyfBZupvp8QjGKW2KGziSZeIWes4aTB9tRmeEBhnUrmTDZQuXcc67Fg82KHrSfaeeOEq6jjuUjQ8wUnzM4Zz3dhrwSyslVz/WvnKqYkr4V/TTXPFF5EjF4rM1bHZ8bK63EfTnK41+n3n4gEFoYP4mXkNH0hntnYcdTqiE7Gn+q0BpRRxnkpBSZlA6Wa70jpW0FGqkw5e591A5/H+OV+60WAo+4Mi+NlsKrvLZ9EiVaPnoEFZlJQx1fA777AJ2MjXJ4KSsrWDWJi1lE8yPs8V6XvcC0chDTYt8456sKXAagCZyY+fzQriFMaddXyKQdG8qBqcdYjAsiIcjzaRFBBoOK9sU+sFY7N6B6+xtrlu3c37rQKkI3O2EoiJOris54EjJ5OFuumA0M6riNUuBf/MEPFBVx1JRcUEs+upEBsCnwYski7FT3TTqHrx7v5AjgFN97xhPTkmVpu6sxRnWBi1fxIRp8eWZeFM6mUcGgVk1WeVb1yhdV9hoMo2TsNEPE0tHo/wvuSJSzbZo7wibeXM9v/rRfKcx7X93rfiXVnyQ9f/5CaAQ4lxedPp/6uzLtOS4FyL0bCNeZ6L5w+AiuyWCTDFIYaUzhwfG+/YTQpWyeZCdQIKzhV+3GeXI2cxoP0ER/DlOKymf1gm+zRU3sqf1lBVQ0y+mK/Awl9bS3uaaQmI0FUyUwHUKP7PKuXnO+LcwDv4OfPT6hph8smc1EtMe5ib/apar/qZ9dyaEaElALJ1KKxnHziuvVl8atk1fINSQh7OtXDyqbPw9o/nGIpTnv5iFmwmWJLis2oyEgPkJqyx0vYI8rjkVEzKc8eQavAJBYSpjMwM193Swt+yJyjvaGYWPnqExxKiNarpB2WSO7soCAZXhS1uEYHryrK47BH6W1dRiruqT0xpLih3MXiwU3VDwAAAA==';

/**
 * Create basic popup with default style.
 */
export function createBasePopup(input: HTMLInputElement, rootContainer: HTMLElement) : HTMLElement {
  // Remove existing popup and its event listeners
  removeExistingPopup(rootContainer);

  const popup = document.createElement('div');
  popup.id = 'aliasvault-credential-popup';
  popup.className = 'av-popup';

  // Get position of the input field relative to the viewport
  const inputRect = input.getBoundingClientRect();

  // Get position of the root container relative to the viewport
  const rootContainerRect = rootContainer.getBoundingClientRect();

  /*
   * Calculate the position relative to the root container
   * This accounts for any offset the shadow root might have in the page
   */
  const relativeTop = inputRect.bottom - rootContainerRect.top;
  const relativeLeft = inputRect.left - rootContainerRect.left;

  // Set the position
  popup.style.position = 'absolute';
  popup.style.top = `${relativeTop}px`;
  popup.style.left = `${relativeLeft}px`;

  // Append popup to the root container
  rootContainer.appendChild(popup);

  return popup;
}

/**
 * Create a loading popup.
 */
export function createLoadingPopup(input: HTMLInputElement, message: string, rootContainer: HTMLElement) : HTMLElement {
  /**
   * Get the loading wrapper HTML.
   */
  const getLoadingHtml = (message: string): string => `
  <div class="av-loading-container">
    <svg class="av-loading-spinner" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="2"
        stroke-dasharray="30 60"
        stroke-linecap="round">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
    <span class="av-loading-text">${message}</span>
  </div>
`;

  const popup = createBasePopup(input, rootContainer);
  popup.innerHTML = getLoadingHtml(message);

  rootContainer.appendChild(popup);
  return popup;
}

/**
 * Update the credential list content in the popup.
 *
 * @param credentials - The credentials to display.
 * @param credentialList - The credential list element.
 * @param input - The input element that triggered the popup. Required when filling credentials to know which form to fill.
 */
export function updatePopupContent(credentials: Credential[], credentialList: HTMLElement | null, input: HTMLInputElement, rootContainer: HTMLElement) : void {
  if (!credentialList) {
    credentialList = document.getElementById('aliasvault-credential-list') as HTMLElement;
  }

  if (!credentialList) {
    return;
  }

  // Clear existing content
  credentialList.innerHTML = '';

  // Add credentials using the shared function
  const credentialElements = createCredentialList(credentials, input, rootContainer);
  credentialElements.forEach(element => credentialList.appendChild(element));
}

/**
 * Remove existing popup (if any exists).
 */
export function removeExistingPopup(container: HTMLElement) : void {
  const existingInContainer = container.querySelector('#aliasvault-credential-popup');

  if (existingInContainer) {
    // Remove event listeners before removing the element
    if (popupListeners && popupListeners.has(container)) {
      const listener = popupListeners.get(container);
      if (listener) {
        container.removeEventListener('mousedown', listener);
        popupListeners.delete(container);
      }
    }

    existingInContainer.remove();
  }
}

/**
 * Create auto-fill popup
 */
export function createAutofillPopup(input: HTMLInputElement, credentials: Credential[] | undefined, rootContainer: HTMLElement) : void {
  // Disable browser's native autocomplete to avoid conflicts with AliasVault's autocomplete.
  input.setAttribute('autocomplete', 'false');
  const popup = createBasePopup(input, rootContainer);

  // Create credential list container with ID
  const credentialList = document.createElement('div');
  credentialList.id = 'aliasvault-credential-list';
  credentialList.className = 'av-credential-list';
  popup.appendChild(credentialList);

  // Add initial credentials
  if (!credentials) {
    credentials = [];
  }

  const filteredCredentials = filterCredentials(
    credentials,
    window.location.href,
    document.title
  );

  updatePopupContent(filteredCredentials, credentialList, input, rootContainer);

  // Add divider
  const divider = document.createElement('div');
  divider.className = 'av-divider';
  popup.appendChild(divider);

  // Add action buttons container
  const actionContainer = document.createElement('div');
  actionContainer.className = 'av-action-container';

  // Create New button
  const createButton = document.createElement('button');
  createButton.className = 'av-button av-button-primary';
  createButton.innerHTML = `
    <svg class="av-icon" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    New
  `;

  /**
   * Handle create button click
   */
  const handleCreateClick = async (e: Event) : Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const suggestedName = getSuggestedServiceName(document, window.location);
    const serviceName = await createEditNamePopup(suggestedName, rootContainer);

    if (!serviceName) {
      // User cancelled
      return;
    }

    const loadingPopup = createLoadingPopup(input, 'Creating new alias...', rootContainer);

    try {
      // Sync with api to ensure we have the latest vault.
      await sendMessage('SYNC_VAULT', {}, 'background');

      // Retrieve default email domain from background
      const response = await sendMessage('GET_DEFAULT_EMAIL_DOMAIN', {}, 'background') as { domain: string };
      const domain = response.domain;

      // Generate new identity locally
      const identityGenerator = new IdentityGeneratorEn();
      const identity = await identityGenerator.generateRandomIdentity();

      // Get password settings from background
      const passwordSettingsResponse = await sendMessage('GET_PASSWORD_SETTINGS', {}, 'background') as PasswordSettingsResponse;
      
      // Initialize password generator with the retrieved settings
      const passwordGenerator = new PasswordGenerator(passwordSettingsResponse.settings);
      const password = passwordGenerator.generateRandomPassword();

      // Extract favicon from page and get the bytes
      const faviconBytes = await getFaviconBytes(document);

      /**
       * Get a valid service URL from the current page.
       */
      const getValidServiceUrl = (): string | null => {
        try {
          // Check if we're in an iframe with invalid/null source
          if (window !== window.top && (!window.location.href || window.location.href === 'about:srcdoc')) {
            return null;
          }

          const url = new URL(window.location.href);

          // Validate the domain/origin
          if (!url.origin || url.origin === 'null' || !url.hostname) {
            return null;
          }

          // Check for valid protocol (only http/https)
          if (!(/^https?:$/).exec(url.protocol)) {
            return null;
          }

          return url.origin + url.pathname;
        } catch (error) {
          console.debug('Error validating service URL:', error);
          return null;
        }
      };

      // Get valid service URL, defaults to empty string if invalid
      const serviceUrl = getValidServiceUrl() ?? '';

      // Submit new identity to backend to persist in db
      const credential: Credential = {
        Id: '',
        ServiceName: serviceName,
        ServiceUrl: serviceUrl,
        Email: `${identity.emailPrefix}@${domain}`,
        Logo: faviconBytes ? new Uint8Array(faviconBytes) : undefined,
        Username: identity.nickName,
        Password: password,
        Notes: '',
        Alias: {
          FirstName: identity.firstName,
          LastName: identity.lastName,
          NickName: identity.nickName,
          BirthDate: identity.birthDate.toISOString(),
          Gender: identity.gender,
          Email: `${identity.emailPrefix}@${domain}`
        }
      };

      // Create identity in background.
      await sendMessage('CREATE_IDENTITY', {
        credential: JSON.parse(JSON.stringify(credential))
      }, 'background');

      // Close popup.
      removeExistingPopup(rootContainer);

      // Fill the form with the new identity immediately.
      fillCredential(credential, input);
    } catch (error) {
      console.error('Error creating identity:', error);
      loadingPopup.innerHTML = `
        <div style="padding: 16px; color: #ef4444;">
          Failed to create identity. Please try again.
        </div>
      `;
      setTimeout(() => {
        removeExistingPopup(rootContainer);
      }, 2000);
    }
  };

  // Add click listener with capture and prevent removal.
  createButton.addEventListener('click', handleCreateClick, {
    capture: true,
    passive: false
  });

  // Backup click handling using mousedown/mouseup if needed.
  let isMouseDown = false;
  createButton.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isMouseDown = true;
  }, { capture: true });

  createButton.addEventListener('mouseup', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMouseDown) {
      handleCreateClick(e);
    }
    isMouseDown = false;
  }, { capture: true });

  // Create search input.
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.dataset.aliasvaultIgnore = 'true';
  searchInput.placeholder = 'Search vault...';
  searchInput.className = 'av-search-input';

  // Handle search input.
  let searchTimeout: NodeJS.Timeout | null = null;

  searchInput.addEventListener('input', async () => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const searchTerm = searchInput.value.toLowerCase();

    const response = await sendMessage('GET_CREDENTIALS', {}, 'background') as CredentialsResponse;
    if (response.success && response.credentials) {
      // Ensure we have unique credentials
      const uniqueCredentials = Array.from(new Map(response.credentials.map(cred => [cred.Id, cred])).values());
      let filteredCredentials;

      if (searchTerm === '') {
        // If search is empty, use original URL-based filtering
        filteredCredentials = filterCredentials(
          uniqueCredentials,
          window.location.href,
          document.title
        ).sort((a, b) => {
          // First compare by service name
          const serviceNameComparison = (a.ServiceName ?? '').localeCompare(b.ServiceName ?? '');
          if (serviceNameComparison !== 0) {
            return serviceNameComparison;
          }

          // If service names are equal, compare by username/nickname
          return (a.Username ?? '').localeCompare(b.Username ?? '');
        });
      } else {
        // Otherwise filter based on search term
        filteredCredentials = uniqueCredentials.filter(cred =>
          cred.ServiceName.toLowerCase().includes(searchTerm) ||
            cred.Username.toLowerCase().includes(searchTerm) ||
            cred.Email.toLowerCase().includes(searchTerm) ||
            cred.ServiceUrl?.toLowerCase().includes(searchTerm)
        ).sort((a, b) => {
          // First compare by service name
          const serviceNameComparison = (a.ServiceName ?? '').localeCompare(b.ServiceName ?? '');
          if (serviceNameComparison !== 0) {
            return serviceNameComparison;
          }

          // If service names are equal, compare by username/nickname
          return (a.Username ?? '').localeCompare(b.Username ?? '');
        });
      }

      // Update popup content with filtered results
      updatePopupContent(filteredCredentials, credentialList, input, rootContainer);
    }
  });

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'av-button av-button-close';
  closeButton.innerHTML = `
  <svg class="av-icon" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

  closeButton.addEventListener('click', async () => {
    await disableAutoShowPopup();
    removeExistingPopup(rootContainer);
  });

  actionContainer.appendChild(searchInput);
  actionContainer.appendChild(createButton);
  actionContainer.appendChild(closeButton);
  popup.appendChild(actionContainer);

  /**
   * Handle clicking outside the popup.
   */
  const handleClickOutside = (event: MouseEvent) : void => {
    const popup = rootContainer.querySelector('#aliasvault-credential-popup');
    const target = event.target as Node;
    const targetElement = event.target as HTMLElement;
    // If popup doesn't exist, remove the listener
    if (!popup) {
      document.removeEventListener('mousedown', handleClickOutside);
      return;
    }

    // Check if the click is outside the popup and outside the shadow UI
    if (popup && !popup.contains(target) && !input.contains(target) && targetElement.tagName !== 'ALIASVAULT-UI') {
      removeExistingPopup(rootContainer);
    }
  };

  // Add the event listener for clicking outside
  document.addEventListener('mousedown', handleClickOutside);
  rootContainer.appendChild(popup);
}

/**
 * Create vault locked popup.
 */
export function createVaultLockedPopup(input: HTMLInputElement, rootContainer: HTMLElement): void {
  /**
   * Handle unlock click.
   */
  const handleUnlockClick = () : void => {
    sendMessage('OPEN_POPUP', {}, 'background');
    removeExistingPopup(rootContainer);
  }

  const popup = createBasePopup(input, rootContainer);
  popup.classList.add('av-vault-locked');

  // Create container for message and button
  const container = document.createElement('div');
  container.className = 'av-vault-locked-container';

  // Make the entire container clickable
  container.addEventListener('click', handleUnlockClick);
  container.style.cursor = 'pointer';

  // Add message
  const messageElement = document.createElement('div');
  messageElement.className = 'av-vault-locked-message';
  messageElement.textContent = 'AliasVault is locked.';
  container.appendChild(messageElement);

  // Add unlock button with SVG icon
  const button = document.createElement('button');
  button.title = 'Unlock AliasVault';
  button.className = 'av-vault-locked-button';
  button.innerHTML = `
    <svg class="av-icon-lock" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `;
  container.appendChild(button);

  // Add the container to the popup
  popup.appendChild(container);

  // Add close button as a separate element positioned to the right
  const closeButton = document.createElement('button');
  closeButton.className = 'av-button av-button-close av-vault-locked-close';
  closeButton.title = 'Dismiss popup';
  closeButton.innerHTML = `
    <svg class="av-icon" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Position the close button to the right of the container
  closeButton.style.position = 'absolute';
  closeButton.style.right = '8px';
  closeButton.style.top = '50%';
  closeButton.style.transform = 'translateY(-50%)';

  // Handle close button click
  closeButton.addEventListener('click', async (e) => {
    e.stopPropagation(); // Prevent opening the unlock popup
    await dismissVaultLockedPopup();
    removeExistingPopup(rootContainer);
  });

  popup.appendChild(closeButton);

  /**
   * Add event listener to document to close popup when clicking outside.
   */
  const handleClickOutside = (event: MouseEvent): void => {
    const target = event.target as Node;
    const targetElement = event.target as HTMLElement;

    // Check if the click is outside the popup and outside the shadow UI
    if (popup && !popup.contains(target) && !input.contains(target) && targetElement.tagName !== 'ALIASVAULT-UI') {
      removeExistingPopup(rootContainer);
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
  }, 100);

  rootContainer.appendChild(popup);
}

/**
 * Create credential list content for popup
 *
 * @param credentials - The credentials to display.
 * @param input - The input element that triggered the popup. Required when filling credentials to know which form to fill.
 */
function createCredentialList(credentials: Credential[], input: HTMLInputElement, rootContainer: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];

  if (credentials.length > 0) {
    credentials.forEach(cred => {
      const item = document.createElement('div');
      item.className = 'av-credential-item';

      // Create container for credential info (logo + username)
      const credentialInfo = document.createElement('div');
      credentialInfo.className = 'av-credential-info';

      const imgElement = document.createElement('img');
      imgElement.className = 'av-credential-logo';

      // Handle base64 image data
      if (cred.Logo) {
        try {
          const logoBytes = toUint8Array(cred.Logo);
          const base64Logo = base64Encode(logoBytes);
          // Detect image type from first few bytes
          const mimeType = detectMimeType(logoBytes);
          imgElement.src = `data:${mimeType};base64,${base64Logo}`;
        } catch (error) {
          console.error('Error setting logo:', error);
          imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
        }
      } else {
        imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
      }

      credentialInfo.appendChild(imgElement);
      const credTextContainer = document.createElement('div');
      credTextContainer.className = 'av-credential-text';

      // Service name (primary text)
      const serviceName = document.createElement('div');
      serviceName.className = 'av-service-name';
      serviceName.textContent = cred.ServiceName;

      // Details container (secondary text)
      const detailsContainer = document.createElement('div');
      detailsContainer.className = 'av-service-details';

      // Combine full name (if available) and username
      const details = [];
      if (cred.Alias?.FirstName && cred.Alias?.LastName) {
        details.push(`${cred.Alias.FirstName} ${cred.Alias.LastName}`);
      }
      details.push(cred.Username);
      detailsContainer.textContent = details.join(' · ');

      credTextContainer.appendChild(serviceName);
      credTextContainer.appendChild(detailsContainer);
      credentialInfo.appendChild(credTextContainer);

      // Add popout icon
      const popoutIcon = document.createElement('div');
      popoutIcon.className = 'av-popout-icon';
      popoutIcon.innerHTML = `
          <svg class="av-icon" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        `;

      // Handle popout click
      popoutIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent credential fill
        sendMessage('OPEN_POPUP_WITH_CREDENTIAL', { credentialId: cred.Id }, 'background');
        removeExistingPopup(rootContainer);
      });

      item.appendChild(credentialInfo);
      item.appendChild(popoutIcon);

      // Update click handler to only trigger on credentialInfo
      credentialInfo.addEventListener('click', () => {
        fillCredential(cred, input);
        removeExistingPopup(rootContainer);
      });

      elements.push(item);
    });
  } else {
    const noMatches = document.createElement('div');
    noMatches.className = 'av-no-matches';
    noMatches.textContent = 'No matches found';
    elements.push(noMatches);
  }

  return elements;
}

export const DISABLED_SITES_KEY = 'local:aliasvault_disabled_sites';
export const GLOBAL_POPUP_ENABLED_KEY = 'local:aliasvault_global_popup_enabled';
export const VAULT_LOCKED_DISMISS_UNTIL_KEY = 'local:aliasvault_vault_locked_dismiss_until';

/**
 * Check if auto-popup is disabled for current site
 */
export async function isAutoShowPopupEnabled(): Promise<boolean> {
  const disabledSites = await storage.getItem(DISABLED_SITES_KEY) as string[] ?? [];
  const globalPopupEnabled = await storage.getItem(GLOBAL_POPUP_ENABLED_KEY) ?? true;

  const currentHostname = window.location.hostname;

  if (!globalPopupEnabled) {
    // Popup is disabled for all sites.
    return false;
  }

  if (disabledSites.includes(currentHostname)) {
    // Popup is disabled for current site.
    return false;
  }

  // Check time-based dismissal
  const dismissUntil = await storage.getItem(VAULT_LOCKED_DISMISS_UNTIL_KEY) as number;
  if (dismissUntil && Date.now() < dismissUntil) {
    // Popup is dismissed for a certain amount of time.
    return false;
  }

  return true;
}

/**
 * Disable auto-popup for current site
 * /**
 * Disable auto-show popup for current site.
 */
export async function disableAutoShowPopup(): Promise<void> {
  const disabledSites = await storage.getItem(DISABLED_SITES_KEY) as string[] ?? [];
  if (!disabledSites.includes(window.location.hostname)) {
    disabledSites.push(window.location.hostname);
    await storage.setItem(DISABLED_SITES_KEY, disabledSites);
  }
}

/**
 * Create edit name popup. Part of the "create new alias" flow.
 */
export async function createEditNamePopup(defaultName: string, rootContainer: HTMLElement): Promise<string | null> {
  // Close existing popup
  removeExistingPopup(rootContainer);

  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'aliasvault-create-popup';
    overlay.className = 'av-create-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'av-create-popup';

    popup.innerHTML = `
      <h3 class="av-create-popup-title">
        New alias name
      </h3>
      <input
        type="text"
        id="service-name-input"
        data-aliasvault-ignore="true"
        value="${defaultName}"
        class="av-create-popup-input"
      >
      <div class="av-create-popup-actions">
        <button id="cancel-btn" class="av-create-popup-cancel">Cancel</button>
        <button id="save-btn" class="av-create-popup-save">Create alias</button>
      </div>
    `;

    overlay.appendChild(popup);
    rootContainer.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      popup.classList.add('show');
    });

    const input = popup.querySelector('#service-name-input') as HTMLInputElement;
    const saveBtn = popup.querySelector('#save-btn') as HTMLButtonElement;
    const cancelBtn = popup.querySelector('#cancel-btn') as HTMLButtonElement;

    // Select input text
    input.select();

    /**
     * Close the popup.
     */
    const closePopup = (value: string | null) : void => {
      popup.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(value);
      }, 200);
    };

    // Handle save
    saveBtn.addEventListener('click', () => {
      const value = input.value.trim();
      if (value) {
        closePopup(value);
      }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      closePopup(null);
    });

    // Handle Enter key
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        if (value) {
          closePopup(value);
        }
      }
    });

    // Handle click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Check if there's any text selected in the input
        const selectedText = input.value.substring(input.selectionStart ?? 0, input.selectionEnd ?? 0);

        // Only close if no text is selected
        if (!selectedText) {
          closePopup(null);
        }
      }
    });
  });
};

/**
 * Open (or refresh) the autofill popup including check if vault is locked.
 */
export function openAutofillPopup(input: HTMLInputElement, container: HTMLElement) : void {
  /**
   * Handle the Enter key.
   */
  const handleEnterKey = (e: KeyboardEvent) : void => {
    if (e.key === 'Enter') {
      removeExistingPopup(container);
      // Remove the event listener to clean up
      document.body.removeEventListener('keydown', handleEnterKey);
    }
  };

  document.addEventListener('keydown', handleEnterKey);

  (async () : Promise<void> => {
    const response = await sendMessage('GET_CREDENTIALS', { }, 'background') as CredentialsResponse;

    if (response.success) {
      createAutofillPopup(input, response.credentials, container);
    } else {
      createVaultLockedPopup(input, container);
    }
  })();
}

/**
 * Convert various binary data formats to Uint8Array
 */
function toUint8Array(buffer: Uint8Array | number[] | {[key: number]: number}): Uint8Array {
  if (buffer instanceof Uint8Array) {
    return buffer;
  }

  if (Array.isArray(buffer)) {
    return new Uint8Array(buffer);
  }

  const length = Object.keys(buffer).length;
  const arr = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    arr[i] = buffer[i];
  }

  return arr;
}

/**
 * Base64 encode binary data.
 */
function base64Encode(buffer: Uint8Array | number[] | {[key: number]: number}): string | null {
  try {
    const arr = Array.from(toUint8Array(buffer));
    return btoa(arr.reduce((data, byte) => data + String.fromCharCode(byte), ''));
  } catch (error) {
    console.error('Error encoding to base64:', error);
    return null;
  }
}

/**
 * Get favicon bytes from page and resize if necessary.
 */
async function getFaviconBytes(document: Document): Promise<Uint8Array | null> {
  const MAX_SIZE_BYTES = 50 * 1024; // 50KB max size before resizing
  const TARGET_WIDTH = 96; // Resize target width

  const faviconLinks = [
    ...Array.from(document.querySelectorAll('link[rel="icon"][type="image/svg+xml"]')),
    ...Array.from(document.querySelectorAll('link[rel="icon"][sizes="192x192"], link[rel="icon"][sizes="128x128"]')),
    ...Array.from(document.querySelectorAll('link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]')),
    ...Array.from(document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')),
    { href: `${window.location.origin}/favicon.ico` }
  ] as HTMLLinkElement[];

  const uniqueLinks = Array.from(new Map(faviconLinks.map(link => [link.href, link])).values());

  for (const link of uniqueLinks) {
    const imageData = await fetchAndProcessFavicon(link.href, MAX_SIZE_BYTES, TARGET_WIDTH);
    if (imageData) {
      return imageData;
    }
  }

  return null;
}

/**
 * Attempt to fetch and process a favicon from a given URL
 */
async function fetchAndProcessFavicon(url: string, maxSize: number, targetWidth: number): Promise<Uint8Array | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength === 0) {
      return null;
    }

    let imageData = new Uint8Array(arrayBuffer);

    // If image is too large, attempt to resize
    if (imageData.byteLength > maxSize) {
      const resizedBlob = await resizeImage(imageData, contentType, targetWidth);
      if (resizedBlob) {
        imageData = new Uint8Array(await resizedBlob.arrayBuffer());
      }
    }

    // Return only if within size limits
    return imageData.byteLength <= maxSize ? imageData : null;
  } catch (error) {
    console.error('Error fetching favicon:', url, error);
    return null;
  }
}

/**
 * Resizes an image using OffscreenCanvas and compresses it.
 */
async function resizeImage(imageData: Uint8Array, contentType: string, targetWidth: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const blob = new Blob([imageData], { type: contentType });
    const img = new Image();

    /**
     * Handle image load.
     */
    img.onload = () : void => {
      const scale = targetWidth / img.width;
      const targetHeight = Math.floor(img.height * scale);

      const canvas = new OffscreenCanvas(targetWidth, targetHeight);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      canvas.convertToBlob({ type: "image/png", quality: 0.7 }).then(resolve).catch(() => resolve(null));
    };

    /**
     * Handle image load error.
     */
    img.onerror = () : void => {
      resolve(null);
    };

    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Detect MIME type from file signature (magic numbers)
 */
function detectMimeType(bytes: Uint8Array): string {
  /**
   * Check if the file is an SVG file.
   */
  const isSvg = () : boolean => {
    const header = new TextDecoder().decode(bytes.slice(0, 5)).toLowerCase();
    return header.includes('<?xml') || header.includes('<svg');
  };

  /**
   * Check if the file is an ICO file.
   */
  const isIco = () : boolean => {
    return bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00;
  };

  /**
   * Check if the file is an PNG file.
   */
  const isPng = () : boolean => {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
  };

  if (isSvg()) {
    return 'image/svg+xml';
  }
  if (isIco()) {
    return 'image/x-icon';
  }
  if (isPng()) {
    return 'image/png';
  }

  return 'image/x-icon';
}

/**
 * Dismiss vault locked popup for 4 hours if user is logged in, or for 3 days if user is not logged in.
 */
export async function dismissVaultLockedPopup(): Promise<void> {
  // First check if user is logged in or not.
  const authStatus = await sendMessage('CHECK_AUTH_STATUS', {}, 'background') as { isLoggedIn: boolean, isVaultLocked: boolean };

  if (authStatus.isLoggedIn) {
    // User is logged in - dismiss for 4 hours
    const fourHoursFromNow = Date.now() + (4 * 60 * 60 * 1000);
    await storage.setItem(VAULT_LOCKED_DISMISS_UNTIL_KEY, fourHoursFromNow);
  } else {
    // User is not logged in - dismiss for 3 days
    const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000);
    await storage.setItem(VAULT_LOCKED_DISMISS_UNTIL_KEY, threeDaysFromNow);
  }
}

/**
 * Get a suggested service name from the page title and URL.
 * Attempts to extract meaningful parts while maintaining original capitalization.
 */
function getSuggestedServiceName(document: Document, location: Location): string {
  const title = document.title;

  /**
   * Filter out common words and keep meaningful parts of the title
   */
  const getMeaningfulTitleParts = (title: string): string[] => {
    return title
      .toLowerCase()
      .split(/[\s|\-—/\\]+/) // Split on spaces and common dividers
      .filter(word =>
        word.length > 1 && // Filter out single characters
        !CombinedStopWords.has(word.toLowerCase()) // Filter out common words
      );
  };

  /**
   * Get original case version of meaningful words
   */
  const getOriginalCase = (text: string, meaningfulParts: string[]): string => {
    return text
      .split(/[\s|\-—/\\]+/)
      .filter(word => meaningfulParts.includes(word.toLowerCase()))
      .join(' ');
  };

  // First try to extract meaningful parts after the last divider
  const dividerRegex = /[|\-—/\\][^|\-—/\\]*$/;
  const dividerMatch = dividerRegex.exec(title);
  if (dividerMatch) {
    const meaningfulParts = getMeaningfulTitleParts(dividerMatch[0]);
    if (meaningfulParts.length > 0) {
      return getOriginalCase(dividerMatch[0].trim(), meaningfulParts);
    }
  }

  // If no meaningful parts found after divider, try the full title
  const meaningfulParts = getMeaningfulTitleParts(title);
  if (meaningfulParts.length > 0) {
    return getOriginalCase(title, meaningfulParts);
  }

  // Fall back to domain name if no meaningful parts found
  const domainParts = location.hostname.replace(/^www\./, '').split('.');
  return domainParts.slice(-2).join('.');
}
