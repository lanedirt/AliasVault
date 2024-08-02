// clickOutsideHandler.js
let currentHandler = null;
let currentDotNetHelper = null;

export function registerClickOutsideHandler(dotNetHelper, contentId, methodName) {
    unregisterClickOutsideHandler();

    currentDotNetHelper = dotNetHelper;
    currentHandler = (event) => {
        const content = document.getElementById(contentId);
        if (!content) return;

        const isOutside = !content.contains(event.target);
        const isEscapeKey = event.type === 'keydown' && event.key === 'Escape';

        if (isOutside || isEscapeKey) {
            currentDotNetHelper.invokeMethodAsync(methodName);
        }
    };

    document.addEventListener('mousedown', currentHandler);
    document.addEventListener('keydown', currentHandler);
}

export function unregisterClickOutsideHandler() {
    if (currentHandler) {
        document.removeEventListener('mousedown', currentHandler);
        document.removeEventListener('keydown', currentHandler);
        currentHandler = null;
    }
}
