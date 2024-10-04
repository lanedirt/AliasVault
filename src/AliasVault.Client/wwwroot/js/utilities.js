function downloadFileFromStream(fileName, contentStreamReference) {
    const arrayBuffer = new Uint8Array(contentStreamReference).buffer;
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    const anchorElement = document.createElement('a');
    anchorElement.href = url;
    anchorElement.download = fileName ?? '';
    anchorElement.click();
    anchorElement.remove();
    URL.revokeObjectURL(url);
}

window.topMenuClickOutsideHandler = (dotNetHelper) => {
    document.addEventListener('click', (event) => {
        const userMenu = document.getElementById('userMenuDropdown');
        const userMenuButton = document.getElementById('userMenuDropdownButton');
        const mobileMenu = document.getElementById('mobileMenuDropdown');
        const mobileMenuButton = document.getElementById('toggleMobileMenuButton');

        // Handle user menu
        if (userMenu && !userMenu.contains(event.target) && !userMenuButton.contains(event.target)) {
            dotNetHelper.invokeMethodAsync('CloseUserMenu');
        }

        // Handle mobile menu
        if (mobileMenu && !mobileMenu.contains(event.target)) {
            if (!mobileMenuButton.contains(event.target)) {
                dotNetHelper.invokeMethodAsync('CloseMobileMenu');
            }
        }
    });
};

window.clipboardCopy = {
    copyText: function (text) {
        navigator.clipboard.writeText(text).then(function () { })
            .catch(function (error) {
                alert(error);
            });
    }
};

// Primarily used by E2E tests.
window.blazorNavigate = (url) => {
    Blazor.navigateTo(url);
};

window.focusElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.focus();
    }
};

window.blurElement = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
        element.blur();
    }
};

function initDarkModeSwitcher() {
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    if (themeToggleDarkIcon === null && themeToggleLightIcon === null) {
        return;
    }

    if (localStorage.getItem('color-theme')) {
        if (localStorage.getItem('color-theme') === 'light') {
            document.documentElement.classList.remove('dark');
            themeToggleLightIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.add('dark');
            themeToggleDarkIcon.classList.remove('hidden');
        }
    }
    else {
        // Default to light mode if not set.
        document.documentElement.classList.remove('dark');
        themeToggleLightIcon.classList.remove('hidden');
    }

    const themeToggleBtn = document.getElementById('theme-toggle');

    let event = new Event('dark-mode');

    themeToggleBtn.addEventListener('click', function () {
        // toggle icons
        themeToggleDarkIcon.classList.toggle('hidden');
        themeToggleLightIcon.classList.toggle('hidden');

        // if set via local storage previously
        if (localStorage.getItem('color-theme')) {
            if (localStorage.getItem('color-theme') === 'light') {
                document.documentElement.classList.add('dark');
                localStorage.setItem('color-theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('color-theme', 'light');
            }
            // if NOT set via local storage previously
        } else if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
        }

        document.dispatchEvent(event);
    });
}

window.initTopMenu = function() {
    initDarkModeSwitcher();
};

/**
 * Generate a QR code for the given id element that has a data-url attribute.
 * @param id
 */
function generateQrCode(id) {
    // Find the element by id
    const element = document.getElementById(id);

    // Check if the element exists
    if (!element) {
        return;
    }

    // Get the data-url attribute
    const dataUrl = element.getAttribute('data-url');

    // Check if data-url exists
    if (!dataUrl) {
        return;
    }

    // Create a container for the QR code
    const qrContainer = document.createElement('div');
    qrContainer.id = `qrcode-${id}`;
    element.appendChild(qrContainer);

    // Initialize QRCode object
    let qrcode = new QRCode(qrContainer, {
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    qrcode.makeCode(dataUrl);
}

/**
 * Gets or creates a WebAuthn credential and derives a key from it.
 * @param {string} credentialIdToUse - The credentialId to use if one exists.
 * @param {string} salt - The salt to use when deriving the key.
 * @returns {Promise<string>} The derived key as a base64 string.
 */
async function getWebAuthnCredentialAndDeriveKey(credentialIdToUse, salt) {
    const rpId = window.location.hostname;
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    try {
        // Try to get an existing credential
        const existingCredential = await navigator.credentials.get({
            publicKey: {
                challenge,
                rpId,
                userVerification: "preferred",
                allowCredentials: [{
                    id: Uint8Array.from(atob(credentialIdToUse), c => c.charCodeAt(0)),
                    type: 'public-key'
                }],
                extensions: {
                    prf: {
                        eval: {
                            first: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
                        },
                    },
                },
            }
        });

        // Check if the authenticator supports the PRF extension
        const extensionsResult = existingCredential.getClientExtensionResults();
        if (!extensionsResult.prf) {
            throw new Error("Authenticator does not support the PRF extension");
        }

        if (!extensionsResult.prf || !extensionsResult.prf.results || !extensionsResult.prf.results.first) {
            throw new Error("Failed to derive key using PRF extension");
        }

        const derivedKey = extensionsResult.prf.results.first;
        return btoa(String.fromCharCode.apply(null, new Uint8Array(derivedKey)));
    } catch (error) {
        console.log("No existing WebAuthn credential found:", error);
        return null;
    }
}

/**
 * Creates a WebAuthn credential and derives a key from it.
 * @param {string} username - The username to associate with the credential.
 * * @returns {Promise<{credentialId: string, salt: string, derivedKey: string} | null>} An object containing the credentialId, salt and derived key, or null if unsuccessful.
 */
async function createWebAuthnCredentialAndDeriveKey(username) {
    const rpId = window.location.hostname;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(32));

    // Create a new credential
    try {
        const newCredential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: {
                    name: "AliasVault",
                    id: rpId},
                user: {
                    id: crypto.getRandomValues(new Uint8Array(32)),
                    name: username,
                    displayName: username
                },
                pubKeyCredParams: [{
                    alg: -7,
                    type: "public-key"
                }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "preferred",
                    residentKey: "required"
                },
                extensions: {
                    prf: {
                        eval: {
                            first: salt,
                        },
                    },
                },
            }
        });

        // Check if the authenticator supports the PRF extension
        const extensionsResult = newCredential.getClientExtensionResults();
        if (!extensionsResult.prf || !extensionsResult.prf.enabled) {
            throw new Error("Authenticator does not support the PRF extension");
        }

        if (!extensionsResult.prf || !extensionsResult.prf.results || !extensionsResult.prf.results.first) {
            throw new Error("Failed to derive key using PRF extension");
        }

        const derivedKey = extensionsResult.prf.results.first;
        const credentialId = new Uint8Array(newCredential.rawId);

        return {
            CredentialId: btoa(String.fromCharCode.apply(null, credentialId)),
            Salt: btoa(String.fromCharCode.apply(null, salt)),
            DerivedKey: btoa(String.fromCharCode.apply(null, new Uint8Array(derivedKey))),
        };
    } catch (createError) {
        console.error("Error creating new WebAuthn credential:", createError);
        return null;
    }
}

