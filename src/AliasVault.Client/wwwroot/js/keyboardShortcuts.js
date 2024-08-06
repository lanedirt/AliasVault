window.keyboardShortcuts = {
    shortcuts: {},
    lastKeyPressed: '',
    lastKeyPressTime: 0,

    init: function() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },

    handleKeyPress: function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        const currentTime = new Date().getTime();
        const key = event.key.toLowerCase();

        if (currentTime - this.lastKeyPressTime > 500) {
            this.lastKeyPressed = '';
        }

        this.lastKeyPressed += key;
        this.lastKeyPressTime = currentTime;

        const shortcut = this.shortcuts[this.lastKeyPressed];
        if (shortcut) {
            event.preventDefault();
            shortcut.dotNetHelper.invokeMethodAsync('Invoke', this.lastKeyPressed);
            this.lastKeyPressed = '';
        }
    },

    registerShortcut: function(keys, dotNetHelper) {
        this.shortcuts[keys.toLowerCase()] = { dotNetHelper: dotNetHelper };
    },

    unregisterShortcut: function(keys) {
        delete this.shortcuts[keys.toLowerCase()];
    }
};

window.keyboardShortcuts.init();
