let currentHandler = null;
let currentDotNetHelper = null;

export function registerClickOutsideHandler(dotNetHelper, contentIds, methodName) {
    unregisterClickOutsideHandler();

    currentDotNetHelper = dotNetHelper;
    const idArray = Array.isArray(contentIds) ? contentIds : contentIds.split(',').map(id => id.trim());

    const mouseHandler = (event) => {
        const isOutside = idArray.every(id => {
            const content = document.getElementById(id);
            return !content?.contains(event.target);
        });

        if (isOutside) {
            currentDotNetHelper.invokeMethodAsync(methodName);
        }
    };

    const keyHandler = (event) => {
        if (event.key === 'Escape') {
            currentDotNetHelper.invokeMethodAsync(methodName);
        }
    };

    currentHandler = {
        mouse: mouseHandler,
        key: keyHandler
    };

    document.addEventListener('mousedown', mouseHandler);
    document.addEventListener('keydown', keyHandler);
}

export function unregisterClickOutsideHandler() {
    if (currentHandler) {
        document.removeEventListener('mousedown', currentHandler);
        document.removeEventListener('keydown', currentHandler);
        currentHandler = null;
    }
}
