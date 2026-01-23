/**
 * Theme Manager Module
 * Manages light/dark theme with system preference detection
 */
const ThemeManager = (function() {
    const THEME_KEY = 'themePreference';
    let currentTheme = 'system';
    let storage = null;
    let mediaQuery = null;

    /**
     * Get the system theme preference
     * @returns {string} - 'dark' or 'light'
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Resolve the actual theme to apply
     * @returns {string} - 'dark' or 'light'
     */
    function resolveTheme() {
        if (currentTheme === 'system') {
            return getSystemTheme();
        }
        return currentTheme;
    }

    /**
     * Apply theme to document
     * @param {string} theme - Theme to apply ('dark' or 'light')
     */
    function applyTheme(theme) {
        const html = document.documentElement;
        html.setAttribute('data-theme', theme);
        html.classList.remove('theme-light', 'theme-dark');
        html.classList.add(`theme-${theme}`);
    }

    /**
     * Persist theme preference to storage
     * @param {string} theme - Theme to persist
     */
    function persistTheme(theme) {
        if (!storage) return;

        storage.set({ [THEME_KEY]: theme }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to persist theme preference', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Handle system theme change
     */
    function handleSystemThemeChange() {
        if (currentTheme === 'system') {
            applyTheme(resolveTheme());
        }
    }

    /**
     * Watch for system theme changes
     */
    function watchSystemTheme() {
        if (window.matchMedia) {
            mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleSystemThemeChange);
            }
            // Older browsers
            else if (mediaQuery.addListener) {
                mediaQuery.addListener(handleSystemThemeChange);
            }
        }
    }

    /**
     * Stop watching for system theme changes
     */
    function unwatchSystemTheme() {
        if (mediaQuery) {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleSystemThemeChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleSystemThemeChange);
            }
            mediaQuery = null;
        }
    }

    return {
        /**
         * Initialize the theme manager
         * @param {Object} storageInstance - Chrome storage instance
         * @param {Function} callback - Callback after initialization
         */
        init: function(storageInstance, callback) {
            storage = storageInstance;

            if (!storage) {
                // No storage available, use system theme
                currentTheme = 'system';
                applyTheme(resolveTheme());
                watchSystemTheme();
                if (callback) callback();
                return;
            }

            storage.get([THEME_KEY], (result) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('Failed to load theme preference', chrome.runtime.lastError);
                    currentTheme = 'system';
                } else {
                    currentTheme = result[THEME_KEY] || 'system';
                }

                applyTheme(resolveTheme());
                watchSystemTheme();
                if (callback) callback();
            });
        },

        /**
         * Set the theme
         * @param {string} theme - Theme to set ('system', 'light', or 'dark')
         */
        setTheme: function(theme) {
            if (!['system', 'light', 'dark'].includes(theme)) {
                console.warn(`Invalid theme: ${theme}`);
                return;
            }

            currentTheme = theme;
            persistTheme(theme);
            applyTheme(resolveTheme());
        },

        /**
         * Get the current theme preference
         * @returns {string} - Current theme preference ('system', 'light', or 'dark')
         */
        getTheme: function() {
            return currentTheme;
        },

        /**
         * Get the resolved theme (actual theme being applied)
         * @returns {string} - Resolved theme ('light' or 'dark')
         */
        getResolvedTheme: function() {
            return resolveTheme();
        },

        /**
         * Toggle between light and dark themes
         */
        toggleTheme: function() {
            const resolved = resolveTheme();
            const newTheme = resolved === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        /**
         * Destroy the theme manager
         */
        destroy: function() {
            unwatchSystemTheme();
            storage = null;
            currentTheme = 'system';
        }
    };
})();
