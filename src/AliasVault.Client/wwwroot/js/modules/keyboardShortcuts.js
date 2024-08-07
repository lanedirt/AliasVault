let shortcuts = {};
let lastKeyPressed = '';
let lastKeyPressTime = 0;

document.addEventListener('keydown', handleKeyPress);

export function handleKeyPress(event) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    const currentTime = new Date().getTime();
    const key = event.key.toLowerCase();

    if (currentTime - this.lastKeyPressTime > 500) {
        lastKeyPressed = '';
    }

    lastKeyPressed += key;
    lastKeyPressTime = currentTime;

    const shortcut = shortcuts[lastKeyPressed];
    if (shortcut) {
        event.preventDefault();
        shortcut.dotNetHelper.invokeMethodAsync('Invoke', lastKeyPressed);
        lastKeyPressed = '';
    }
}

export function registerShortcut(keys, dotNetHelper) {
    shortcuts[keys.toLowerCase()] = { dotNetHelper: dotNetHelper };
}

export function unregisterShortcut(keys) {
    delete shortcuts[keys.toLowerCase()];
}

export function unregisterAllShortcuts() {
    shortcuts = {};
}
