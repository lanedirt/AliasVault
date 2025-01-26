import { detectForms } from './utils/FormDetector';
import { Credential } from './types/Credential';

const placeholderBase64 = 'UklGRjoEAABXRUJQVlA4IC4EAAAwFwCdASqAAIAAPpFCm0olo6Ihp5IraLASCWUA0eb/0s56RrLtCnYfLPiBshdXWMx8j1Ez65f169iA4xUDBTEV6ylMQeCIj2b7RngGi7gKZ9WjKdSoy9R8JcgOmjCMlDmLG20KhNo/i/Dc/Ah5GAvGfm8kfniV3AkR6fxN6eKwjDc6xrDgSfS48G5uGV6WzQt24YAVlLSK9BMwndzfHnePK1KFchFrL7O3ulB8cGNCeomu4o+l0SrS/JKblJ4WTzj0DAD++lCUEouSfgRKdiV2TiYCD+H+l3tANKSPQFPQuzi7rbvxqGeRmXB9kDwURaoSTTpYjA9REMUi9uA6aV7PWtBNXgUzMLowYMZeos6Xvyhb34GmufswMHA5ZyYpxzjTphOak4ZjNOiz8aScO5ygiTx99SqwX/uL+HSeVOSraHw8IymrMwm+jLxqN8BS8dGcItLlm/ioulqH2j4V8glDgSut+ExkxiD7m8TGPrrjCQNJbRDzpOFsyCyfBZupvp8QjGKW2KGziSZeIWes4aTB9tRmeEBhnUrmTDZQuXcc67Fg82KHrSfaeeOEq6jjuUjQ8wUnzM4Zz3dhrwSyslVz/WvnKqYkr4V/TTXPFF5EjF4rM1bHZ8bK63EfTnK41+n3n4gEFoYP4mXkNH0hntnYcdTqiE7Gn+q0BpRRxnkpBSZlA6Wa70jpW0FGqkw5e591A5/H+OV+60WAo+4Mi+NlsKrvLZ9EiVaPnoEFZlJQx1fA777AJ2MjXJ4KSsrWDWJi1lE8yPs8V6XvcC0chDTYt8456sKXAagCZyY+fzQriFMaddXyKQdG8qBqcdYjAsiIcjzaRFBBoOK9sU+sFY7N6B6+xtrlu3c37rQKkI3O2EoiJOris54EjJ5OFuumA0M6riNUuBf/MEPFBVx1JRcUEs+upEBsCnwYski7FT3TTqHrx7v5AjgFN97xhPTkmVpu6sxRnWBi1fxIRp8eWZeFM6mUcGgVk1WeVb1yhdV9hoMo2TsNEPE0tHo/wvuSJSzbZo7wibeXM9v/rRfKcx7X93rfiXVnyQ9f/5CaAQ4lxedPp/6uzLtOS4FyL0bCNeZ6L5w+AiuyWCTDFIYaUzhwfG+/YTQpWyeZCdQIKzhV+3GeXI2cxoP0ER/DlOKymf1gm+zRU3sqf1lBVQ0y+mK/Awl9bS3uaaQmI0FUyUwHUKP7PKuXnO+LcwDv4OfPT6hph8smc1EtMe5ib/apar/qZ9dyaEaElALJ1KKxnHziuvVl8atk1fINSQh7OtXDyqbPw9o/nGIpTnv5iFmwmWJLis2oyEgPkJqyx0vYI8rjkVEzKc8eQavAJBYSpjMwM193Swt+yJyjvaGYWPnqExxKiNarpB2WSO7soCAZXhS1uEYHryrK47BH6W1dRiruqT0xpLih3MXiwU3VDwAAAA==';

// Listen for input field focus
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
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS_FOR_URL', url: window.location.href }, (response) => {
    if (!response.credentials?.length) return;

    createPopup(input, response.credentials);
  });
}

/**
 * Create auto-fill popup
 */
function createPopup(input: HTMLInputElement, credentials: Credential[]) : void {
  // Remove existing popup if any
  removeExistingPopup();

  const popup = document.createElement('div');
  popup.id = 'aliasvault-credential-popup';
  popup.style.cssText = `
    position: absolute;
    z-index: 999999;
    background: white;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    max-width: 300px;
    padding: 8px 0;
  `;

  // Position popup below input
  const rect = input.getBoundingClientRect();
  popup.style.top = `${rect.bottom + window.scrollY + 2}px`;
  popup.style.left = `${rect.left + window.scrollX}px`;

  // Add credentials to popup
  credentials.forEach(cred => {
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
        const base64Logo = base64Encode(cred.Logo);
        if (base64Logo) {
            imgElement.src = `data:image/x-icon;base64,${base64Logo}`;
        } else {
            imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
        }
    } else {
        imgElement.src = `data:image/x-icon;base64,${placeholderBase64}`;
    }

    item.appendChild(imgElement);
    item.appendChild(document.createTextNode(cred.Username));

    item.addEventListener('click', () => {
      fillCredential(cred);
      removeExistingPopup();
    });

    item.addEventListener('mouseenter', () => {
      item.style.backgroundColor = '#f0f0f0';
    });

    item.addEventListener('mouseleave', () => {
      item.style.backgroundColor = 'transparent';
    });

    popup.appendChild(item);
  });

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
 * Base64 encode
 * TODO: make this a generic function if still needed? Check all other usages.
 */
function base64Encode(buffer: Uint8Array): string | null {
    if (!buffer || typeof buffer !== 'object') {
        console.error('Empty or invalid buffer received');
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
