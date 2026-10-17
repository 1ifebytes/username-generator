/**
 * Toast Module
 * Non-blocking status messages shared by the popup and the full page.
 */
const Toast = (function() {
    let timer = null;

    /**
     * Show a toast message, reusing the same DOM node.
     * @param {string} message - Text to display
     * @param {'success'|'error'} [type] - Visual style
     * @param {number} [duration] - Milliseconds before hiding
     */
    function show(message, type = 'success', duration = 2000) {
        let element = document.getElementById('toast');
        if (!element) {
            element = document.createElement('div');
            element.id = 'toast';
            element.className = 'toast';
            element.setAttribute('role', 'status');
            element.setAttribute('aria-live', 'polite');
            document.body.appendChild(element);
        }

        element.textContent = message;
        element.classList.remove('toast-visible', 'toast-error');
        if (type === 'error') {
            element.classList.add('toast-error');
        }

        // Force a reflow so repeated messages restart the transition.
        void element.offsetWidth;
        element.classList.add('toast-visible');

        clearTimeout(timer);
        timer = setTimeout(() => {
            element.classList.remove('toast-visible');
        }, duration);
    }

    return { show };
})();
