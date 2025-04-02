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
import SqliteClient from '../../utils/SqliteClient';

/**
 * WeakMap to store event listeners for popup containers
 */
let popupListeners = new WeakMap<HTMLElement, EventListener>();

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
    const result = await createEditNamePopup(suggestedName, rootContainer);

    if (!result) {
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

      let credential: Credential;

      if (result.isCustomCredential) {
        // Create custom credential
        const faviconBytes = await getFaviconBytes(document);
        credential = {
          Id: '',
          ServiceName: result.serviceName || '',
          ServiceUrl: getValidServiceUrl(),
          Email: result.customEmail || '',
          Logo: faviconBytes || undefined,
          Username: result.customUsername || '',
          Password: result.customPassword || '', // Set the generated password
          Notes: '',
          Alias: {
            FirstName: '',
            LastName: '',
            NickName: result.customUsername || '',
            BirthDate: new Date().toISOString(),
            Gender: undefined,
            Email: result.customEmail || ''
          }
        };
      } else {
        // Generate new identity locally
        const identityGenerator = new IdentityGeneratorEn();
        const identity = await identityGenerator.generateRandomIdentity();

        // Get password settings from background
        const passwordSettingsResponse = await sendMessage('GET_PASSWORD_SETTINGS', {}, 'background') as PasswordSettingsResponse;
        
        // Initialize password generator with the retrieved settings
        const passwordGenerator = new PasswordGenerator({
          Length: 16,
          UseUppercase: true,
          UseLowercase: true,
          UseNumbers: true,
          UseSpecialChars: true,
          UseNonAmbiguousChars: false
        });
        const password = passwordGenerator.generateRandomPassword();

        // Extract favicon from page and get the bytes
        const faviconBytes = await getFaviconBytes(document);

        credential = {
          Id: '',
          ServiceName: result.serviceName || '',
          ServiceUrl: getValidServiceUrl(),
          Email: `${identity.emailPrefix}@${domain}`,
          Logo: faviconBytes || undefined,
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
      }

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
  searchInput.addEventListener('input', () => handleSearchInput(searchInput, credentials, rootContainer, searchTimeout, credentialList, input));

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

  console.log('Autofill actually popup appended:', popup);

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
 * Handle popup search input by filtering credentials based on the search term.
 */
function handleSearchInput(searchInput: HTMLInputElement, credentials: Credential[], rootContainer: HTMLElement, searchTimeout: NodeJS.Timeout | null, credentialList: HTMLElement | null, input: HTMLInputElement) : void {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  const searchTerm = searchInput.value.toLowerCase();

  // Ensure we have unique credentials
  const uniqueCredentials = Array.from(new Map(credentials.map(cred => [cred.Id, cred])).values());
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
      cred.ServiceName?.toLowerCase().includes(searchTerm) ||
        cred.Username?.toLowerCase().includes(searchTerm) ||
        cred.Email?.toLowerCase().includes(searchTerm) ||
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
      imgElement.src = SqliteClient.imgSrcFromBytes(cred.Logo);

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
export async function createEditNamePopup(defaultName: string, rootContainer: HTMLElement): Promise<{ serviceName: string | null, isCustomCredential: boolean, customEmail?: string, customUsername?: string, customPassword?: string } | null> {
  // Close existing popup
  removeExistingPopup(rootContainer);

  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'aliasvault-create-popup';
    overlay.className = 'av-create-popup-overlay';

    const popup = document.createElement('div');
    popup.className = 'av-create-popup';

    // Create the main content
    popup.innerHTML = `
      <button class="av-create-popup-close">
        <svg class="av-icon" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="av-create-popup-mode-select">
        <h3 class="av-create-popup-title">Create new alias</h3>
        <div class="av-create-popup-modes">
          <button class="av-create-popup-mode-btn av-create-popup-mode-random">
            <div class="av-create-popup-mode-icon">
              <svg class="av-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>
            </div>
            <div class="av-create-popup-mode-content">
              <h4>Random alias</h4>
              <p>Generate a random identity with random email</p>
            </div>
          </button>
          <button class="av-create-popup-mode-btn av-create-popup-mode-custom">
            <div class="av-create-popup-mode-icon">
              <svg class="av-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>
            </div>
            <div class="av-create-popup-mode-content">
              <h4>Username/password</h4>
              <p>Create a custom username and password</p>
            </div>
          </button>
        </div>
      </div>

      <div class="av-create-popup-random-mode" style="display: none;">
        <h3 class="av-create-popup-title">Create random alias</h3>
        <div class="av-create-popup-field-group">
          <label for="service-name-input">Service name</label>
          <input
            type="text"
            id="service-name-input"
            data-aliasvault-ignore="true"
            value="${defaultName}"
            class="av-create-popup-input"
            placeholder="Enter service name"
          >
        </div>
        <div class="av-create-popup-actions">
          <button id="back-btn" class="av-create-popup-back">Back</button>
          <button id="cancel-btn" class="av-create-popup-cancel">Cancel</button>
          <button id="save-btn" class="av-create-popup-save">Create alias</button>
        </div>
      </div>

      <div class="av-create-popup-custom-mode" style="display: none;">
        <h3 class="av-create-popup-title">Create username/password</h3>
        <div class="av-create-popup-field-group">
          <label for="custom-service-name">Service name</label>
          <input
            type="text"
            id="custom-service-name"
            data-aliasvault-ignore="true"
            value="${defaultName}"
            class="av-create-popup-input"
            placeholder="Enter service name"
          >
        </div>
        <div class="av-create-popup-field-group">
          <label for="custom-email">Email</label>
          <input
            type="email"
            id="custom-email"
            data-aliasvault-ignore="true"
            class="av-create-popup-input"
            placeholder="Enter email address"
          >
        </div>
        <div class="av-create-popup-field-group">
          <label for="custom-username">Username</label>
          <input
            type="text"
            id="custom-username"
            data-aliasvault-ignore="true"
            class="av-create-popup-input"
            placeholder="Enter username"
          >
        </div>
        <div class="av-create-popup-field-group">
          <label>Generated Password</label>
          <div class="av-create-popup-password-preview">
            <input
              type="text"
              id="password-preview"
              data-aliasvault-ignore="true"
              class="av-create-popup-input"
            >
            <button id="regenerate-password" class="av-create-popup-regenerate-btn">
              <svg class="av-icon" viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="av-create-popup-actions">
          <button id="custom-back-btn" class="av-create-popup-back">Back</button>
          <button id="custom-cancel-btn" class="av-create-popup-cancel">Cancel</button>
          <button id="custom-save-btn" class="av-create-popup-save">Create credential</button>
        </div>
      </div>
    `;

    overlay.appendChild(popup);
    rootContainer.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      popup.classList.add('show');
    });

    // Get all the elements
    const modeSelect = popup.querySelector('.av-create-popup-mode-select') as HTMLElement;
    const randomMode = popup.querySelector('.av-create-popup-random-mode') as HTMLElement;
    const customMode = popup.querySelector('.av-create-popup-custom-mode') as HTMLElement;
    const randomBtn = popup.querySelector('.av-create-popup-mode-random') as HTMLButtonElement;
    const customBtn = popup.querySelector('.av-create-popup-mode-custom') as HTMLButtonElement;
    const backBtn = popup.querySelector('#back-btn') as HTMLButtonElement;
    const customBackBtn = popup.querySelector('#custom-back-btn') as HTMLButtonElement;
    const cancelBtn = popup.querySelector('#cancel-btn') as HTMLButtonElement;
    const customCancelBtn = popup.querySelector('#custom-cancel-btn') as HTMLButtonElement;
    const saveBtn = popup.querySelector('#save-btn') as HTMLButtonElement;
    const customSaveBtn = popup.querySelector('#custom-save-btn') as HTMLButtonElement;
    const input = popup.querySelector('#service-name-input') as HTMLInputElement;
    const customInput = popup.querySelector('#custom-service-name') as HTMLInputElement;
    const customEmail = popup.querySelector('#custom-email') as HTMLInputElement;
    const customUsername = popup.querySelector('#custom-username') as HTMLInputElement;
    const passwordPreview = popup.querySelector('#password-preview') as HTMLInputElement;
    const regenerateBtn = popup.querySelector('#regenerate-password') as HTMLButtonElement;
    const closeBtn = popup.querySelector('.av-create-popup-close') as HTMLButtonElement;

    // Initialize password generator
    const passwordGenerator = new PasswordGenerator({
      Length: 16,
      UseUppercase: true,
      UseLowercase: true,
      UseNumbers: true,
      UseSpecialChars: true,
      UseNonAmbiguousChars: false
    });

    // Function to generate and set password
    const generatePassword = () => {
      passwordPreview.value = passwordGenerator.generateRandomPassword();
    };

    // Generate initial password
    generatePassword();

    // Handle regenerate button click
    regenerateBtn.addEventListener('click', generatePassword);

    // Handle mode selection
    randomBtn.addEventListener('click', () => {
      modeSelect.style.display = 'none';
      randomMode.style.display = 'block';
      input.select();
    });

    customBtn.addEventListener('click', () => {
      modeSelect.style.display = 'none';
      customMode.style.display = 'block';
      customInput.select();
    });

    // Handle back buttons
    backBtn.addEventListener('click', () => {
      randomMode.style.display = 'none';
      modeSelect.style.display = 'block';
    });

    customBackBtn.addEventListener('click', () => {
      customMode.style.display = 'none';
      modeSelect.style.display = 'block';
    });

    /**
     * Close the popup.
     */
    const closePopup = (value: { serviceName: string | null, isCustomCredential: boolean, customEmail?: string, customUsername?: string, customPassword?: string } | null) : void => {
      popup.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(value);
      }, 200);
    };

    // Handle save buttons
    saveBtn.addEventListener('click', () => {
      const serviceName = input.value.trim();
      if (serviceName) {
        closePopup({
          serviceName,
          isCustomCredential: false
        });
      }
    });

    customSaveBtn.addEventListener('click', () => {
      const serviceName = customInput.value.trim();
      if (serviceName) {
        if (!customEmail.value.trim() && !customUsername.value.trim()) {
          // Add error styling to fields
          customEmail.classList.add('av-create-popup-input-error');
          customUsername.classList.add('av-create-popup-input-error');
          
          // Add error messages after labels
          const emailLabel = customEmail.previousElementSibling as HTMLLabelElement;
          const usernameLabel = customUsername.previousElementSibling as HTMLLabelElement;
          
          if (!emailLabel.querySelector('.av-create-popup-error-text')) {
            const emailError = document.createElement('span');
            emailError.className = 'av-create-popup-error-text';
            emailError.textContent = 'Enter email and/or username';
            emailLabel.appendChild(emailError);
          }
          
          if (!usernameLabel.querySelector('.av-create-popup-error-text')) {
            const usernameError = document.createElement('span');
            usernameError.className = 'av-create-popup-error-text';
            usernameError.textContent = 'Enter email and/or username';
            usernameLabel.appendChild(usernameError);
          }
          
          // Remove error styling when user starts typing
          const removeError = () => {
            customEmail.classList.remove('av-create-popup-input-error');
            customUsername.classList.remove('av-create-popup-input-error');
            const emailError = emailLabel.querySelector('.av-create-popup-error-text');
            const usernameError = usernameLabel.querySelector('.av-create-popup-error-text');
            if (emailError) emailError.remove();
            if (usernameError) usernameError.remove();
          };
          
          customEmail.addEventListener('input', removeError, { once: true });
          customUsername.addEventListener('input', removeError, { once: true });
          
          return;
        }
        closePopup({
          serviceName,
          isCustomCredential: true,
          customEmail: customEmail.value.trim(),
          customUsername: customUsername.value.trim(),
          customPassword: passwordPreview.value
        });
      }
    });

    // Handle cancel buttons
    cancelBtn.addEventListener('click', () => {
      closePopup(null);
    });

    customCancelBtn.addEventListener('click', () => {
      closePopup(null);
    });

    // Handle Enter key
    input.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const serviceName = input.value.trim();
        if (serviceName) {
          closePopup({
            serviceName,
            isCustomCredential: false
          });
        }
      }
    });

    customInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const serviceName = customInput.value.trim();
        if (serviceName) {
          if (!customEmail.value.trim() && !customUsername.value.trim()) {
            return;
          }
          closePopup({
            serviceName,
            isCustomCredential: true,
            customEmail: customEmail.value.trim(),
            customUsername: customUsername.value.trim()
          });
        }
      }
    });

    // Handle close button
    closeBtn.addEventListener('click', () => {
      closePopup(null);
    });

    // Handle click outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePopup(null);
      }
    });
  });
}

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
      console.log('creating autofill popup...');
      createAutofillPopup(input, response.credentials, container);
    } else {
      createVaultLockedPopup(input, container);
    }
  })();
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

/**
 * Get a valid service URL from the current page.
 */
function getValidServiceUrl(): string {
  try {
    // Check if we're in an iframe with invalid/null source
    if (window !== window.top && (!window.location.href || window.location.href === 'about:srcdoc')) {
      return '';
    }

    const url = new URL(window.location.href);

    // Validate the domain/origin
    if (!url.origin || url.origin === 'null' || !url.hostname) {
      return '';
    }

    // Check for valid protocol (only http/https)
    if (!(/^https?:$/).exec(url.protocol)) {
      return '';
    }

    return url.origin + url.pathname;
  } catch (error) {
    console.debug('Error validating service URL:', error);
    return '';
  }
}
