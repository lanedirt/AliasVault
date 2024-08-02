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

window.registerClickOutsideHandler = (dotNetHelper, elementIds, methodName) => {
    const handleClickOrEscape = (event) => {
        const shouldClose = elementIds.every(id => {
            const element = document.getElementById(id);
            return element && !element.contains(event.target);
        });

        if (shouldClose || (event.key === 'Escape')) {
            dotNetHelper.invokeMethodAsync(methodName);
        }
    };

    document.addEventListener('click', handleClickOrEscape);
    document.addEventListener('keydown', handleClickOrEscape);

    // Return a function to remove the event listeners
    return () => {
        document.removeEventListener('click', handleClickOrEscape);
        document.removeEventListener('keydown', handleClickOrEscape);
    };
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
