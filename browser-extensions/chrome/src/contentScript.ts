import { detectForms } from './utilities/FormDetector';

console.log('Content script loaded!'); // This will help verify the script is running

// Track active input field
let activeInput: HTMLInputElement | null = null;

// Listen for input field focus
document.addEventListener('focusin', (e) => {
  const target = e.target as HTMLInputElement;
  if (target.tagName === 'INPUT') {
    activeInput = target;
    showCredentialPopup(target);
  }
});

// Listen for input field blur
document.addEventListener('focusout', (e) => {
  activeInput = null;
});

// Create and manage credential popup
function showCredentialPopup(input: HTMLInputElement) {
  console.log('showCredentialPopup called');
  const forms = detectForms();
  if (!forms.length) return;

  // Request credentials from background script
  chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS_FOR_URL', url: window.location.href }, (response) => {
    console.log('response received:', response);
    if (!response.credentials?.length) return;

    console.log('credentials received, creating popup:');
    createPopup(input, response.credentials);
  });
}

function createPopup(input: HTMLInputElement, credentials: any[]) {
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

    // Use chrome.runtime.getURL for the fallback image
    const placeholderImage = chrome.runtime.getURL('images/service-placeholder.webp');
    console.log('placeholderImage:', placeholderImage);
    item.innerHTML = `
      <img src="${cred.Logo || placeholderImage}" style="width: 16px; height: 16px;">
      <span>${cred.Username}</span>
    `;

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

function removeExistingPopup() {
  const existing = document.getElementById('aliasvault-credential-popup');
  if (existing) {
    existing.remove();
  }
}

function fillCredential(credential: any) {
  const forms = detectForms();
  if (!forms.length) return;

  const form = forms[0];
  if (form.usernameField) {
    form.usernameField.value = credential.username;
    triggerInputEvents(form.usernameField);
  }
  if (form.passwordField) {
    form.passwordField.value = credential.password;
    triggerInputEvents(form.passwordField);
  }
}

function triggerInputEvents(element: HTMLInputElement) {
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}