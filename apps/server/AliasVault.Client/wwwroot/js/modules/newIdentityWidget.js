window.getWindowWidth = function() {
    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
};
window.getElementRect = function(element) {
    if (element) {
        const rect = {
            left: element.offsetLeft,
            top: element.offsetTop,
            right: element.offsetLeft + element.offsetWidth,
            bottom: element.offsetTop + element.offsetHeight,
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        let parent = element.offsetParent;
        while (parent) {
            rect.left += parent.offsetLeft;
            rect.top += parent.offsetTop;
            parent = parent.offsetParent;
        }
        rect.right = rect.left + rect.width;
        rect.bottom = rect.top + rect.height;
        return rect;
    }
    return null;
};
