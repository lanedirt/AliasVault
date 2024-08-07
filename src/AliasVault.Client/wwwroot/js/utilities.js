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
        const menu = document.getElementById('userMenuDropdown');
        const menuButton = document.getElementById('userMenuDropdownButton');
        if (menu && !menu.contains(event.target) && !menuButton.contains(event.target)) {
            dotNetHelper.invokeMethodAsync('CloseMenu');
        }

        const mobileMenu = document.getElementById('mobileMenu');
        const mobileMenuButton = document.getElementById('toggleMobileMenuButton');
        if (mobileMenu && !mobileMenu.contains(event.target) && !mobileMenuButton.contains(event.target)) {
            dotNetHelper.invokeMethodAsync('CloseMenu');
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

