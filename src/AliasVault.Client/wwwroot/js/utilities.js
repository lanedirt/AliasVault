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

window.initTopMenu = function() {
    initDarkModeSwitcher();
};

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
