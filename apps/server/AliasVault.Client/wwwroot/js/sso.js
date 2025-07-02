/**
 * AliasVault Browser Extension SSO Integration
 * Handles automatic sign-in from browser extension
 */

window.AliasVaultSSO = (function() {
    let isInitialized = false;
    let isAuthenticationInProgress = false;

    /**
     * Initialize SSO listener
     */
    function initialize() {
        if (isInitialized) {
            return;
        }

        console.log('[AliasVault SSO] Initializing SSO listener');
        window.addEventListener('message', handleSSOMessage, false);
        isInitialized = true;

        // Add a global function for debugging
        window.debugSSO = function() {
            console.log('[AliasVault SSO] Debug info:');
            console.log('- Initialized:', isInitialized);
            console.log('- Authentication in progress:', isAuthenticationInProgress);
            console.log('- Is authenticated:', isAuthenticated());
            console.log('- Current URL:', window.location.href);
            console.log('- Meta tag present:', !!document.querySelector('meta[name="application-name"][content="AliasVault"]'));
        };
    }

    /**
     * Handle incoming SSO messages from browser extension
     */
    function handleSSOMessage(event) {
        // Verify origin for security (same-origin only)
        if (event.origin !== window.location.origin) {
            return;
        }

        // Check if this is an SSO auth message
        if (!event.data || event.data.type !== 'ALIASVAULT_SSO_AUTH') {
            return;
        }

        console.log('Received SSO authentication data from browser extension');

        // Prevent multiple simultaneous authentications
        if (isAuthenticationInProgress) {
            console.warn('SSO authentication already in progress, ignoring');
            return;
        }

        isAuthenticationInProgress = true;

        try {
            handleSSOAuthentication(event.data);
        } catch (error) {
            console.error('Error handling SSO authentication:', error);
            showSSOError('Failed to process authentication data');
        } finally {
            isAuthenticationInProgress = false;
        }
    }

    /**
     * Process SSO authentication data
     */
    async function handleSSOAuthentication(ssoData) {
        try {
            // Validate required data
            if (!ssoData.accessToken || !ssoData.derivedKey || !ssoData.encryptedVault || !ssoData.username) {
                throw new Error('Missing required authentication data');
            }

            // Validate timestamp (within last 30 seconds)
            const currentTime = Date.now();
            if (!ssoData.timestamp || (currentTime - ssoData.timestamp) > 30000) {
                throw new Error('Authentication data expired');
            }

            console.log('Processing SSO authentication for user:', ssoData.username);

            // Show loading indicator
            showSSOProgress('Signing in with browser extension...');

            // Store authentication data in local storage (same as normal login)
            if (typeof Storage !== "undefined") {
                localStorage.setItem('token', ssoData.accessToken);
                if (ssoData.refreshToken) {
                    localStorage.setItem('refreshToken', ssoData.refreshToken);
                }
            }

            // Set up the vault data in memory via Blazor interop
            if (typeof window.blazorSetSSOAuthData === 'function') {
                const result = await window.blazorSetSSOAuthData({
                    accessToken: ssoData.accessToken,
                    refreshToken: ssoData.refreshToken,
                    encryptedVault: ssoData.encryptedVault,
                    derivedKey: ssoData.derivedKey,
                    username: ssoData.username,
                    vaultRevisionNumber: ssoData.vaultRevisionNumber || 0
                });

                if (result.success) {
                    console.info('SSO authentication successful');
                    showSSOSuccess('Successfully signed in!');

                    // Navigate to vault (trigger page refresh/navigation)
                    setTimeout(() => {
                        if (typeof window.blazorNavigate === 'function') {
                            window.blazorNavigate('/credentials');
                        } else {
                            window.location.href = '/credentials';
                        }
                    }, 1000);
                } else {
                    throw new Error(result.error || 'Failed to set authentication data');
                }
            } else {
                // Fallback: trigger page refresh to pick up stored tokens
                console.log('Blazor interop not available, triggering page refresh');
                showSSOSuccess('Successfully signed in! Redirecting...');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('SSO authentication failed:', error);
            showSSOError(error.message || 'Authentication failed');
        }
    }

    /**
     * Show SSO progress message
     */
    function showSSOProgress(message) {
        showSSONotification(message, 'progress');
    }

    /**
     * Show SSO success message
     */
    function showSSOSuccess(message) {
        showSSONotification(message, 'success');
    }

    /**
     * Show SSO error message
     */
    function showSSOError(message) {
        showSSONotification(message, 'error');
    }

    /**
     * Show SSO notification
     */
    function showSSONotification(message, type) {
        // Remove any existing notifications
        const existing = document.getElementById('aliasvault-sso-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.id = 'aliasvault-sso-notification';

        const bgColor = type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#fef9e7';
        const borderColor = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#f59e0b';
        const textColor = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#d97706';

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            color: ${textColor};
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation
        if (!document.getElementById('sso-notification-style')) {
            const style = document.createElement('style');
            style.id = 'sso-notification-style';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Add icon based on type
        let icon = '';
        if (type === 'error') {
            icon = '❌';
        } else if (type === 'success') {
            icon = '✅';
        } else {
            icon = '⏳';
        }

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${icon}</span>
                <div>
                    <strong>Browser Extension SSO</strong><br>
                    ${message}
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after delay (longer for success/error)
        const delay = type === 'progress' ? 5000 : 3000;
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, delay);
    }

    /**
     * Check if user is already authenticated
     */
    function isAuthenticated() {
        if (typeof Storage === "undefined") {
            return false;
        }
        return !!localStorage.getItem('token');
    }

    // Public API
    return {
        initialize: initialize,
        isAuthenticated: isAuthenticated
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Only initialize if not already authenticated
        if (!window.AliasVaultSSO.isAuthenticated()) {
            window.AliasVaultSSO.initialize();
        }
    });
} else {
    // DOM already loaded
    if (!window.AliasVaultSSO.isAuthenticated()) {
        window.AliasVaultSSO.initialize();
    }
}