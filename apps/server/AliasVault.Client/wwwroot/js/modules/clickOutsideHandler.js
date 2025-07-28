let currentHandler = null;
let currentDotNetHelper = null;

export function registerClickOutsideHandler(dotNetHelper, contentIds, methodName) {
    unregisterClickOutsideHandler();

    currentDotNetHelper = dotNetHelper;
    const idArray = Array.isArray(contentIds) ? contentIds : contentIds.split(',').map(id => id.trim());

    const mouseHandler = (event) => {
        // Check if dotNetHelper is still valid
        if (!currentDotNetHelper) {
            unregisterClickOutsideHandler();
            return;
        }

        const isOutside = idArray.every(id => {
            const content = document.getElementById(id);
            return !content?.contains(event.target);
        });

        if (isOutside) {
            try {
                currentDotNetHelper.invokeMethodAsync(methodName);
            } catch (error) {
                console.warn('Failed to invoke click outside method:', error);
                // Clean up if the DotNetObjectReference is disposed
                unregisterClickOutsideHandler();
            }
        }
    };

    const keyHandler = (event) => {
        if (event.key === 'Escape') {
            // Check if dotNetHelper is still valid
            if (!currentDotNetHelper) {
                unregisterClickOutsideHandler();
                return;
            }

            try {
                currentDotNetHelper.invokeMethodAsync(methodName);
            } catch (error) {
                console.warn('Failed to invoke escape key method:', error);
                // Clean up if the DotNetObjectReference is disposed
                unregisterClickOutsideHandler();
            }
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
        document.removeEventListener('mousedown', currentHandler.mouse);
        document.removeEventListener('keydown', currentHandler.key);
        currentHandler = null;
        currentDotNetHelper = null;
    }
}
