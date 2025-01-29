import { detectForms } from './utils/FormDetector';
import { Credential } from './types/Credential';

type CredentialResponse = {
  status: 'OK' | 'LOCKED';
  credentials?: Credential[];
}

const placeholderBase64 = 'UklGRjoEAABXRUJQVlA4IC4EAAAwFwCdASqAAIAAPpFCm0olo6Ihp5IraLASCWUA0eb/0s56RrLtCnYfLPiBshdXWMx8j1Ez65f169iA4xUDBTEV6ylMQeCIj2b7RngGi7gKZ9WjKdSoy9R8JcgOmjCMlDmLG20KhNo/i/Dc/Ah5GAvGfm8kfniV3AkR6fxN6eKwjDc6xrDgSfS48G5uGV6WzQt24YAVlLSK9BMwndzfHnePK1KFchFrL7O3ulB8cGNCeomu4o+l0SrS/JKblJ4WTzj0DAD++lCUEouSfgRKdiV2TiYCD+H+l3tANKSPQFPQuzi7rbvxqGeRmXB9kDwURaoSTTpYjA9REMUi9uA6aV7PWtBNXgUzMLowYMZeos6Xvyhb34GmufswMHA5ZyYpxzjTphOak4ZjNOiz8aScO5ygiTx99SqwX/uL+HSeVOSraHw8IymrMwm+jLxqN8BS8dGcItLlm/ioulqH2j4V8glDgSut+ExkxiD7m8TGPrrjCQNJbRDzpOFsyCyfBZupvp8QjGKW2KGziSZeIWes4aTB9tRmeEBhnUrmTDZQuXcc67Fg82KHrSfaeeOEq6jjuUjQ8wUnzM4Zz3dhrwSyslVz/WvnKqYkr4V/TTXPFF5EjF4rM1bHZ8bK63EfTnK41+n3n4gEFoYP4mXkNH0hntnYcdTqiE7Gn+q0BpRRxnkpBSZlA6Wa70jpW0FGqkw5e591A5/H+OV+60WAo+4Mi+NlsKrvLZ9EiVaPnoEFZlJQx1fA777AJ2MjXJ4KSsrWDWJi1lE8yPs8V6XvcC0chDTYt8456sKXAagCZyY+fzQriFMaddXyKQdG8qBqcdYjAsiIcjzaRFBBoOK9sU+sFY7N6B6+xtrlu3c37rQKkI3O2EoiJOris54EjJ5OFuumA0M6riNUuBf/MEPFBVx1JRcUEs+upEBsCnwYski7FT3TTqHrx7v5AjgFN97xhPTkmVpu6sxRnWBi1fxIRp8eWZeFM6mUcGgVk1WeVb1yhdV9hoMo2TsNEPE0tHo/wvuSJSzbZo7wibeXM9v/rRfKcx7X93rfiXVnyQ9f/5CaAQ4lxedPp/6uzLtOS4FyL0bCNeZ6L5w+AiuyWCTDFIYaUzhwfG+/YTQpWyeZCdQIKzhV+3GeXI2cxoP0ER/DlOKymf1gm+zRU3sqf1lBVQ0y+mK/Awl9bS3uaaQmI0FUyUwHUKP7PKuXnO+LcwDv4OfPT6hph8smc1EtMe5ib/apar/qZ9dyaEaElALJ1KKxnHziuvVl8atk1fINSQh7OtXDyqbPw9o/nGIpTnv5iFmwmWJLis2oyEgPkJqyx0vYI8rjkVEzKc8eQavAJBYSpjMwM193Swt+yJyjvaGYWPnqExxKiNarpB2WSO7soCAZXhS1uEYHryrK47BH6W1dRiruqT0xpLih3MXiwU3VDwAAAA==';

/**
 * Check if the current theme is dark.
 */
function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Listen for input field focus
 */
document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.tagName === 'INPUT') {
    showCredentialPopup(target);
  }
});

/**
 * Show credential popup
 */
function showCredentialPopup(input: HTMLInputElement) : void {
  const forms = detectForms();
  if (!forms.length) return;

  // Request credentials from background script
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS_FOR_URL', url: window.location.href }, (response: CredentialResponse) => {
    switch (response.status) {
      case 'OK':
        if (response.credentials?.length) {
          createPopup(input, response.credentials);
        }
        break;

      case 'LOCKED':
        createStatusPopup(input, 'AliasVault is locked.');
        break;
    }
  });
}

/**
 * Filter credentials based on current URL and page context
 */
function filterCredentials(credentials: Credential[], currentUrl: string, pageTitle: string): Credential[] {
  // If less than 5 entries, return all
  if (credentials.length <= 5) {
    return credentials;
  }

  const urlObject = new URL(currentUrl);
  const baseUrl = `${urlObject.protocol}//${urlObject.hostname}`;

  // 1. Exact URL match
  let filtered = credentials.filter(cred =>
    cred.ServiceUrl?.toLowerCase() === currentUrl.toLowerCase()
  );

  // 2. Base URL match with fuzzy domain comparison if no exact matches
  if (filtered.length === 0) {
    filtered = credentials.filter(cred => {
        if (!cred.ServiceUrl) return false;
        try {
            const credUrlObject = new URL(cred.ServiceUrl);
            const currentUrlObject = new URL(baseUrl);

            // Extract root domains by splitting on dots and taking last two parts
            const credDomainParts = credUrlObject.hostname.toLowerCase().split('.');
            const currentDomainParts = currentUrlObject.hostname.toLowerCase().split('.');

            // Get root domain (last two parts, e.g., 'dumpert.nl')
            const credRootDomain = credDomainParts.slice(-2).join('.');
            const currentRootDomain = currentDomainParts.slice(-2).join('.');

            // Compare protocols and root domains
            return credUrlObject.protocol === currentUrlObject.protocol &&
                  credRootDomain === currentRootDomain;
        } catch {
            return false;
        }
    });
  }

  // 3. Page title word match if still no matches
  if (filtered.length === 0) {
    const titleWords = pageTitle.toLowerCase().split(/\s+/);
    filtered = credentials.filter(cred =>
      titleWords.some(word =>
        cred.ServiceName.toLowerCase().includes(word)
      )
    );
  }

  return filtered;
}

/**
 * Create auto-fill popup
 */
function createPopup(input: HTMLInputElement, credentials: Credential[]) : void {
  // Remove existing popup if any
  removeExistingPopup();

  const popup = document.createElement('div');
  popup.id = 'aliasvault-credential-popup';

  // Get input width
  const inputWidth = input.offsetWidth;

  // Set popup width to match input width, with min/max constraints
  const popupWidth = Math.max(250, Math.min(960, inputWidth));

  popup.style.cssText = `
    position: absolute;
    z-index: 999999;
    background: ${isDarkMode() ? '#1f2937' : 'white'};
    border: 1px solid ${isDarkMode() ? '#374151' : '#ccc'};
    border-radius: 4px;
    box-shadow: 0 2px 4px ${isDarkMode() ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'};
    padding: 8px 0;
    width: ${popupWidth}px;
    color: ${isDarkMode() ? '#f8f9fa' : '#000000'};
  `;

  // Filter credentials based on current page context
  const filteredCredentials = filterCredentials(
    credentials,
    window.location.href,
    document.title
  );

  // Add credentials to popup if any matches found
  if (filteredCredentials.length > 0) {
    filteredCredentials.forEach(cred => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const imgElement = document.createElement('img');
      imgElement.style.width = '16px';
      imgElement.style.height = '16px';

      // Handle base64 image data
      if (cred.Logo) {
        try {
          const base64Logo = base64Encode(cred.Logo);
          imgElement.src = `data:image/x-icon;base64,${base64Logo}`;
        } catch (error) {
          console.error('Error setting logo:', error);
          imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
        }
      } else {
        imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
      }

      item.appendChild(imgElement);
      item.appendChild(document.createTextNode(cred.Username));

      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = isDarkMode() ? '#374151' : '#f0f0f0';
      });

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent';
      });

      item.addEventListener('click', () => {
        fillCredential(cred);
        removeExistingPopup();
      });

      popup.appendChild(item);
    });
  } else {
    // Show "no matches found" message
    const noMatches = document.createElement('div');
    noMatches.style.cssText = `
      padding: 8px 16px;
      color: ${isDarkMode() ? '#9ca3af' : '#6b7280'};
      font-style: italic;
    `;
    noMatches.textContent = 'No matches found';
    popup.appendChild(noMatches);
  }

  // Add divider
  const divider = document.createElement('div');
  divider.style.cssText = `
    height: 1px;
    background: ${isDarkMode() ? '#374151' : '#e5e7eb'};
    margin: 8px 0;
  `;
  popup.appendChild(divider);

  // Add action buttons container
  const actionContainer = document.createElement('div');
  actionContainer.style.cssText = `
    display: flex;
    gap: 8px;
    padding: 8px 16px;
  `;

  // Create New button
  const createButton = document.createElement('button');
  createButton.style.cssText = `
    flex: 1;
    padding: 6px 12px;
    border-radius: 4px;
    background: ${isDarkMode() ? '#374151' : '#f3f4f6'};
    color: ${isDarkMode() ? '#e5e7eb' : '#374151'};
    font-size: 14px;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  `;
  createButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    New Alias
  `;
  createButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_NEW_CREDENTIAL' });
    removeExistingPopup();
  });

  // Search button
  const searchButton = document.createElement('button');
  searchButton.style.cssText = createButton.style.cssText;
  searchButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    Search
  `;
  searchButton.addEventListener('click', () => {
    // Placeholder for future search functionality
    removeExistingPopup();
  });

  actionContainer.appendChild(createButton);
  actionContainer.appendChild(searchButton);
  popup.appendChild(actionContainer);

  /**
   * Add click outside handler
   * @param event
   */
  const handleClickOutside = (event: MouseEvent) : void => {
    if (!popup.contains(event.target as Node)) {
      removeExistingPopup();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
  }, 100);

  // Position popup below input
  const rect = input.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 2}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  document.body.appendChild(popup);
}

/**
 * Create status popup. TODO: refactor to use same popup basic structure for all popup types.
 */
function createStatusPopup(input: HTMLInputElement, message: string): void {
  // Remove existing popup if any
  removeExistingPopup();

  const popup = document.createElement('div');
  popup.id = 'aliasvault-credential-popup';

  // Get input width
  const inputWidth = input.offsetWidth;

  // Set popup width to match input width, with min/max constraints
  const popupWidth = Math.max(250, Math.min(960, inputWidth));

  popup.style.cssText = `
    position: absolute;
    z-index: 999999;
    background: ${isDarkMode() ? '#1f2937' : 'white'};
    border: 1px solid ${isDarkMode() ? '#374151' : '#ccc'};
    border-radius: 4px;
    box-shadow: 0 2px 4px ${isDarkMode() ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'};
    padding: 12px 16px;
    width: ${popupWidth}px;
    color: ${isDarkMode() ? '#f8f9fa' : '#000000'};
    cursor: pointer;
    transition: background-color 0.2s;
  `;

  // Add hover effect to the entire popup
  popup.addEventListener('mouseenter', () => {
    popup.style.backgroundColor = isDarkMode() ? '#374151' : '#f0f0f0';
  });

  popup.addEventListener('mouseleave', () => {
    popup.style.backgroundColor = isDarkMode() ? '#1f2937' : 'white';
  });

  // Create container for message and button
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    align-items: center;
    position: relative;
  `;

  // Add message
  const messageElement = document.createElement('div');
  messageElement.style.cssText = `
    color: ${isDarkMode() ? '#d1d5db' : '#666'};
    font-size: 14px;
    padding-right: 32px;
  `;
  messageElement.textContent = message;
  container.appendChild(messageElement);

  // Add unlock button with SVG icon
  const button = document.createElement('button');
  button.title = 'Unlock AliasVault';
  button.style.cssText = `
    position: absolute;
    right: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0066cc;
    border-radius: 4px;
  `;
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  `;

  // Make the whole container clickable to open the popup.
  container.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    removeExistingPopup();
  });

  container.appendChild(button);
  popup.appendChild(container);

  // Position popup below input
  const rect = input.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 2}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  /**
   * Add event listener to document to close popup when clicking outside.
   */
  const handleClickOutside = (event: MouseEvent): void => {
    if (!popup.contains(event.target as Node)) {
      removeExistingPopup();
      document.removeEventListener('mousedown', handleClickOutside);
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', handleClickOutside);
  }, 100);

  document.body.appendChild(popup);
}

/**
 * Remove existing popup
 */
function removeExistingPopup() : void {
  const existing = document.getElementById('aliasvault-credential-popup');
  if (existing) {
    existing.remove();
  }
}

/**
 * Fill credential
 */
function fillCredential(credential: Credential) : void {
  const forms = detectForms();
  if (!forms.length) return;

  const form = forms[0];
  if (form.usernameField) {
    form.usernameField.value = credential.Username;
    triggerInputEvents(form.usernameField);
  }
  if (form.passwordField) {
    form.passwordField.value = credential.Password;
    triggerInputEvents(form.passwordField);
  }
}

/**
 * Trigger input events
 */
function triggerInputEvents(element: HTMLInputElement) : void {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Base64 encode binary data.
 */
function base64Encode(buffer: Uint8Array): string | null {
  if (!buffer || typeof buffer !== 'object') {
      return null;
  }

  try {
      // Convert object to array of numbers
      const byteArray = Object.values(buffer);

      // Convert to binary string
      const binary = String.fromCharCode.apply(null, byteArray as number[]);

      // Use btoa to encode binary string to base64
      return btoa(binary);
  } catch (error) {
      console.error('Error encoding to base64:', error);
      return null;
  }
}