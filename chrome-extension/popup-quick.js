(function() {
    'use strict';

    const SETTINGS_KEY = 'quickSettings';

    const output = document.getElementById('quick-output');
    const modeSelect = document.getElementById('quick-mode');
    const lengthInput = document.getElementById('quick-length');
    const languageSelect = document.getElementById('quick-language');
    const generateButton = document.getElementById('quick-generate');
    const copyButton = document.getElementById('quick-copy');
    const openPageButton = document.getElementById('quick-open-page');

    const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
        ? chrome.storage.local
        : null;

    /**
     * Translate a key with a fallback for non-extension contexts.
     * @param {string} key - i18n key
     * @param {string} fallback - Fallback text
     * @returns {string}
     */
    function t(key, fallback) {
        return typeof I18nManager !== 'undefined' ? I18nManager.t(key) : fallback;
    }

    /**
     * Build generator options from the compact popup controls.
     * @returns {Object} Options accepted by UsernameGenerator.generate
     */
    function getOptions() {
        const mode = modeSelect.value;
        return {
            length: UsernameGenerator.clampLength(lengthInput.value),
            easyToSay: mode === 'easyToSay',
            easyToRead: mode === 'easyToRead',
            allCharacters: mode === 'allCharacters',
            uppercase: true,
            lowercase: true,
            numbers: mode !== 'easyToSay',
            symbols: mode === 'allCharacters'
        };
    }

    /**
     * Generate a username and show it without recording it.
     * @returns {string} The previewed username
     */
    function renderPreview() {
        const username = UsernameGenerator.generate(getOptions());
        output.textContent = username || '—';
        return username;
    }

    /**
     * Persist the compact popup preferences.
     */
    function saveSettings() {
        if (!storage) return;
        storage.set({
            [SETTINGS_KEY]: {
                mode: modeSelect.value,
                length: UsernameGenerator.clampLength(lengthInput.value)
            }
        });
    }

    /**
     * Generate a username and record it in history.
     * @returns {string} The generated username
     */
    function commit() {
        const username = renderPreview();
        if (username) {
            HistoryStore.add(storage, username);
        }
        return username;
    }

    /**
     * Copy the displayed username and make sure it is in history.
     */
    function copy() {
        const username = output.textContent;
        if (!username || username === '—') return;

        HistoryStore.add(storage, username);

        navigator.clipboard.writeText(username)
            .then(() => {
                Toast.show(t('alert.copySuccess', 'Username copied to clipboard!'));
            })
            .catch((error) => {
                console.error('Failed to copy username', error);
                Toast.show(t('alert.copyFailed', 'Copy failed. Please try again.'), 'error');
            });
    }

    /**
     * Fill the language selector with every supported language.
     */
    function populateLanguageSelector() {
        if (!languageSelect || typeof I18nManager === 'undefined') return;

        languageSelect.innerHTML = '';
        I18nManager.getSupportedLanguages().forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = I18nManager.getLanguageName(code);
            languageSelect.appendChild(option);
        });
        languageSelect.value = I18nManager.getLanguage();
    }

    /**
     * Restore the last used mode and length.
     * @param {Function} callback - Called once preferences are applied
     */
    function loadSettings(callback) {
        if (!storage) {
            callback();
            return;
        }

        storage.get([SETTINGS_KEY], (result) => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to load quick settings', chrome.runtime.lastError);
                callback();
                return;
            }

            const settings = result[SETTINGS_KEY];
            if (settings && settings.mode) {
                modeSelect.value = settings.mode;
            }
            if (settings && settings.length) {
                lengthInput.value = UsernameGenerator.clampLength(settings.length);
            }
            callback();
        });
    }

    // Browsing mode/length only previews; Generate and Copy record history.
    modeSelect.addEventListener('change', () => {
        saveSettings();
        renderPreview();
    });

    lengthInput.addEventListener('input', renderPreview);
    lengthInput.addEventListener('change', () => {
        lengthInput.value = UsernameGenerator.clampLength(lengthInput.value);
        saveSettings();
        renderPreview();
    });

    generateButton.addEventListener('click', commit);
    copyButton.addEventListener('click', copy);
    output.addEventListener('click', copy);

    openPageButton.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.runtime) {
            chrome.tabs.create({ url: chrome.runtime.getURL('page.html') });
            window.close();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            commit();
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
            const selection = window.getSelection ? window.getSelection().toString() : '';
            if (!selection) {
                event.preventDefault();
                copy();
            }
        }
    });

    if (typeof I18nManager !== 'undefined') {
        populateLanguageSelector();
        I18nManager.init(storage, populateLanguageSelector);

        if (languageSelect) {
            languageSelect.addEventListener('change', (event) => {
                I18nManager.setLanguage(event.target.value);
                populateLanguageSelector();
            });
        }
    }
    if (typeof ThemeManager !== 'undefined') {
        ThemeManager.init(storage);
    }

    loadSettings(renderPreview);
})();
