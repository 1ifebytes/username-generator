/**
 * Keyboard Shortcuts Module
 * Handles keyboard shortcuts for quick actions
 *
 * Shortcuts:
 * - Ctrl/Cmd + G: Generate new username
 * - Ctrl/Cmd + C: Copy current username (when no text is selected)
 */
const KeyboardShortcuts = (function() {
    let handlers = {};

    /**
     * Get the key combination string from an event
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {string} - The key combination (e.g., 'ctrl+g', 'ctrl+shift+a')
     */
    function getKeyCombo(event) {
        const parts = [];
        if (event.ctrlKey || event.metaKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        parts.push(event.key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Show visual feedback when a shortcut is triggered
     * @param {string} message - The message to display
     */
    function showFeedback(message) {
        // Create a toast notification
        const toast = document.createElement('div');
        toast.className = 'keyboard-shortcut-feedback';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-tooltip);
            color: var(--text-tooltip);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 200ms ease;
        `;
        document.body.appendChild(toast);

        // Fade in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
        });

        // Remove after 1 second
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 200);
        }, 1000);
    }

    /**
     * Handle keyboard events
     * @param {KeyboardEvent} event - The keyboard event
     */
    function handleKeyDown(event) {
        const key = getKeyCombo(event);

        // Ctrl/Cmd + G: Generate new username
        if (key === 'ctrl+g' && handlers.generate) {
            event.preventDefault();
            handlers.generate();
            showFeedback('Generated!');
            return;
        }

        // Ctrl/Cmd + C: Copy current username (only if no text is selected)
        if (key === 'ctrl+c' && handlers.copy) {
            const selection = window.getSelection();
            const selectedText = selection.toString();

            // Only intercept if no text is selected
            if (!selectedText) {
                event.preventDefault();
                handlers.copy();
                showFeedback('Copied!');
            }
            return;
        }
    }

    return {
        /**
         * Initialize keyboard shortcuts
         * @param {Object} actionHandlers - Map of action names to handler functions
         * @param {Function} actionHandlers.generate - Handler for generate action
         * @param {Function} actionHandlers.copy - Handler for copy action
         */
        init: function(actionHandlers) {
            handlers = actionHandlers;
            document.addEventListener('keydown', handleKeyDown);
        },

        /**
         * Remove keyboard shortcut listeners
         */
        destroy: function() {
            document.removeEventListener('keydown', handleKeyDown);
            handlers = {};
        }
    };
})();
