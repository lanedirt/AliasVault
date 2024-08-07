let currentHandler = null;
let currentDotNetHelper = null;

export function registerClickOutsideHandler(dotNetHelper, contentIds, methodName) {
    unregisterClickOutsideHandler();

    currentDotNetHelper = dotNetHelper;
    const idArray = Array.isArray(contentIds) ? contentIds : contentIds.split(',').map(id => id.trim());

    currentHandler = (event) => {
        const isOutside = idArray.every(id => {
            const content = document.getElementById(id);
            return !content?.contains(event.target);
        });

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
