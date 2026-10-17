document.addEventListener('DOMContentLoaded', function() {
    const HISTORY_KEY = HistoryStore.HISTORY_KEY;
    const HISTORY_LIMIT = HistoryStore.HISTORY_LIMIT;
    const HISTORY_BATCH_SIZE = 10;
    const CURRENT_VERSION = 2;

    const lengthInput = document.getElementById('length');
    const lengthSlider = document.getElementById('length-slider');
    const generatedUsername = document.getElementById('generated-username');
    const generateButton = document.getElementById('generate-username');
    const copyButton = document.getElementById('copy-username');
    const historyList = document.getElementById('history-list');
    const emptyHistory = document.getElementById('empty-history');
    const clearHistoryButton = document.getElementById('clear-history');
    const loadMoreHistoryButton = document.getElementById('load-more-history');
    const exportHistoryButton = document.getElementById('export-history');
    const historySearchInput = document.getElementById('history-search');
    const clearSearchButton = document.getElementById('clear-search');
    const themeSelector = document.getElementById('theme-selector');
    const languageSelector = document.getElementById('language-selector');
    const favoritesList = document.getElementById('favorites-list');
    const emptyFavorites = document.getElementById('empty-favorites');
    const easyToSayRadio = document.getElementById('easy-to-say');
    const easyToReadRadio = document.getElementById('easy-to-read');
    const allCharactersRadio = document.getElementById('all-characters');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const lowercaseCheckbox = document.getElementById('lowercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    let history = [];
    let visibleHistoryCount = HISTORY_BATCH_SIZE;

    const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : null;

    function migrateStorage() {
        if (!storage) return;

        storage.get(['version'], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to check storage version', chrome.runtime.lastError);
                return;
            }

            const version = result.version || 1;

            if (version < 2) {
                // Migrate to v2: add new storage keys
                const newSettings = {
                    version: 2,
                    themePreference: 'system',
                    languagePreference: 'en',
                    usernameFavorites: []
                };

                storage.set(newSettings, () => {
                    if (chrome.runtime && chrome.runtime.lastError) {
                        console.error('Failed to migrate storage to v2', chrome.runtime.lastError);
                    }
                });
            }
        });
    }

    migrateStorage();

    function clampLength(value) {
        return UsernameGenerator.clampLength(value);
    }

    function syncLengthInputs(value) {
        const clamped = clampLength(value);
        lengthInput.value = clamped;
        lengthSlider.value = clamped;
        return clamped;
    }

    function getOptions() {
        return {
            length: syncLengthInputs(lengthInput.value),
            easyToSay: document.getElementById('easy-to-say').checked,
            easyToRead: document.getElementById('easy-to-read').checked,
            allCharacters: document.getElementById('all-characters').checked,
            uppercase: document.getElementById('uppercase').checked,
            lowercase: document.getElementById('lowercase').checked,
            numbers: document.getElementById('numbers').checked,
            symbols: document.getElementById('symbols').checked
        };
    }

    function generateUsername(options) {
        return UsernameGenerator.generate(options);
    }

    /**
     * Format a timestamp as YYYY-MM-DD HH:mm:ss in the local timezone.
     * Locale-independent so every language shows the same stable format.
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @returns {string} - Formatted timestamp
     */
    function formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
            `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function upsertHistory(list, entry, limit = HISTORY_LIMIT) {
        return HistoryStore.upsert(list, entry, limit);
    }

    function persistHistory(updatedHistory) {
        history = updatedHistory;
        if (storage) {
            storage.set({ [HISTORY_KEY]: history }, () => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('Failed to persist history', chrome.runtime.lastError);
                }
            });
        }
    }

    function renderHistory(filteredItems = null) {
        if (!historyList) return;

        historyList.innerHTML = '';
        const itemsToRender = filteredItems || history.slice(0, visibleHistoryCount);
        const isFiltered = filteredItems !== null;

        if (itemsToRender.length === 0) {
            emptyHistory.style.display = 'block';
            if (loadMoreHistoryButton) loadMoreHistoryButton.disabled = true;
            return;
        }

        emptyHistory.style.display = 'none';

        itemsToRender.forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-item';
            row.setAttribute('data-username', item.username);
            row.setAttribute('data-timestamp', item.timestamp);

            const text = document.createElement('div');
            text.className = 'history-text';

            const name = document.createElement('div');
            name.className = 'history-username';
            name.textContent = item.username;

            const time = document.createElement('div');
            time.className = 'history-timestamp';
            time.textContent = formatTimestamp(item.timestamp);

            text.appendChild(name);
            text.appendChild(time);

            const actions = document.createElement('div');
            actions.className = 'history-actions-inline';

            // Star button for favorites
            const starButton = document.createElement('button');
            starButton.className = 'history-star';
            const isFav = typeof FavoritesManager !== 'undefined' && FavoritesManager.isFavorite ? FavoritesManager.isFavorite(item.username) : false;
            starButton.textContent = isFav ? '★' : '☆';
            starButton.title = isFav ? 'Remove from favorites' : 'Add to favorites';
            starButton.addEventListener('click', (event) => {
                event.stopPropagation();
                if (typeof FavoritesManager !== 'undefined') {
                    FavoritesManager.toggleFavorite(item);
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'history-delete';
            deleteButton.textContent = '✕';
            deleteButton.title = 'Delete';

            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const updated = history.filter(entry => entry.username !== item.username);
                persistHistory(updated);
                renderHistory();
            });

            actions.appendChild(starButton);
            actions.appendChild(deleteButton);

            row.addEventListener('click', () => {
                navigator.clipboard.writeText(item.username)
                    .then(() => {
                        const message = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copySuccess') : 'Username copied to clipboard!';
                        showToast(message);
                    })
                    .catch((error) => {
                        console.error('Failed to copy username', error);
                        const failMessage = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copyFailed') : 'Copy failed. Please try again.';
                        showToast(failMessage, 'error');
                    });
            });

            row.appendChild(text);
            row.appendChild(actions);
            historyList.appendChild(row);
        });

        if (!isFiltered && loadMoreHistoryButton) {
            loadMoreHistoryButton.disabled = visibleHistoryCount >= history.length;
        }
    }

    function addHistoryEntry(username) {
        const timestamp = Date.now();
        history = upsertHistory(history, { username, timestamp }, HISTORY_LIMIT);
        persistHistory(history);
        // Update history filter cache
        if (typeof HistoryFilter !== 'undefined') {
            HistoryFilter.updateHistory(history);
        }
        visibleHistoryCount = Math.min(history.length, Math.max(visibleHistoryCount, HISTORY_BATCH_SIZE));
        renderHistory();
    }

    function loadHistory() {
        if (!storage) {
            history = [];
            renderHistory();
            return;
        }

        storage.get([HISTORY_KEY], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to load history', chrome.runtime.lastError);
                history = [];
            } else {
                history = Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
                history.sort((a, b) => b.timestamp - a.timestamp);
            }
            // Update history filter cache after loading
            if (typeof HistoryFilter !== 'undefined') {
                HistoryFilter.updateHistory(history);
            }
            visibleHistoryCount = Math.min(history.length, HISTORY_BATCH_SIZE);
            renderHistory();
        });
    }

    /**
     * Show a non-blocking toast message.
     * @param {string} message - Text to display
     * @param {'success'|'error'} [type] - Visual style
     */
    function showToast(message, type = 'success') {
        Toast.show(message, type);
    }

    /**
     * Regenerate the preview only. Slider, number input, checkbox and radio
     * changes call this so browsing options never writes to history.
     * @returns {string} The generated username
     */
    function previewUsername() {
        const options = getOptions();
        const username = generateUsername(options);
        generatedUsername.textContent = username;
        return username;
    }

    /**
     * Regenerate the preview and record it in history. The Generate button,
     * the keyboard shortcut and the copy action call this.
     * @returns {string} The generated username
     */
    function commitUsername() {
        const username = previewUsername();
        if (username) {
            addHistoryEntry(username);
        }
        return username;
    }

    function copyUsername() {
        const username = generatedUsername.textContent;
        if (!username) return;

        // A username the user actually copied is worth keeping in history.
        if (!history.some(item => item.username === username)) {
            addHistoryEntry(username);
        }

        navigator.clipboard.writeText(username)
            .then(() => {
                const message = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copySuccess') : 'Username copied to clipboard!';
                showToast(message);
            })
            .catch((error) => {
                console.error('Failed to copy username', error);
                const failMessage = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copyFailed') : 'Copy failed. Please try again.';
                showToast(failMessage, 'error');
            });
    }

    lengthInput.addEventListener('input', function() {
        syncLengthInputs(this.value);
        previewUsername();
    });

    lengthSlider.addEventListener('input', function() {
        syncLengthInputs(this.value);
        previewUsername();
    });

    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', previewUsername);
    });

    generateButton.addEventListener('click', commitUsername);
    copyButton.addEventListener('click', copyUsername);

    function maybeLoadMoreOnScroll() {
        if (!historyList) return;
        const { scrollTop, scrollHeight, clientHeight } = historyList;
        const nearBottom = scrollTop + clientHeight >= scrollHeight - 8;
        if (nearBottom && visibleHistoryCount < history.length) {
            visibleHistoryCount = Math.min(history.length, visibleHistoryCount + HISTORY_BATCH_SIZE);
            renderHistory();
        }
    }

    // These controls only exist on the full-page view; guard so the shared
    // script stays safe to load anywhere.
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', () => {
            history = [];
            persistHistory(history);
            visibleHistoryCount = HISTORY_BATCH_SIZE;
            renderHistory();
        });
    }

    if (loadMoreHistoryButton) {
        loadMoreHistoryButton.addEventListener('click', () => {
            visibleHistoryCount = Math.min(history.length, visibleHistoryCount + HISTORY_BATCH_SIZE);
            renderHistory();
        });
    }

    if (historyList) {
        historyList.addEventListener('scroll', maybeLoadMoreOnScroll);
    }

    function applyPreset(preset) {
        switch (preset) {
            case 'easyToSay':
                uppercaseCheckbox.checked = true;
                lowercaseCheckbox.checked = true;
                numbersCheckbox.checked = false;
                numbersCheckbox.disabled = true;  // Disable: not compatible with pronounceable names
                symbolsCheckbox.checked = false;
                symbolsCheckbox.disabled = true;  // Disable: not compatible with pronounceable names
                break;
            case 'easyToRead':
                uppercaseCheckbox.checked = true;
                lowercaseCheckbox.checked = true;
                numbersCheckbox.checked = true;
                numbersCheckbox.disabled = false;  // Enable
                symbolsCheckbox.checked = false;
                symbolsCheckbox.disabled = false;  // Enable (user can choose)
                break;
            case 'allCharacters':
                uppercaseCheckbox.checked = true;
                lowercaseCheckbox.checked = true;
                numbersCheckbox.checked = true;
                numbersCheckbox.disabled = false;  // Enable
                symbolsCheckbox.checked = true;
                symbolsCheckbox.disabled = false;  // Enable
                break;
            default:
                break;
        }
    }

    [easyToSayRadio, easyToReadRadio, allCharactersRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            if (easyToSayRadio.checked) applyPreset('easyToSay');
            if (easyToReadRadio.checked) applyPreset('easyToRead');
            if (allCharactersRadio.checked) applyPreset('allCharacters');
            previewUsername();
        });
    });

    if (easyToSayRadio && easyToSayRadio.checked) applyPreset('easyToSay');
    if (easyToReadRadio && easyToReadRadio.checked) applyPreset('easyToRead');
    if (allCharactersRadio && allCharactersRadio.checked) applyPreset('allCharacters');

    // === Module Initialization ===
    // Order matters: i18n -> theme -> favorites -> other modules

    // 1. Initialize i18n manager
    function populateLanguageSelector(selectElement) {
        if (!selectElement || typeof I18nManager === 'undefined') return;

        selectElement.innerHTML = '';
        I18nManager.getSupportedLanguages().forEach(code => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = I18nManager.getLanguageName(code);
            selectElement.appendChild(option);
        });
        selectElement.value = I18nManager.getLanguage();
    }

    if (typeof I18nManager !== 'undefined') {
        populateLanguageSelector(languageSelector);

        I18nManager.init(storage, () => {
            // Saved language is known now; refresh the selector and timestamps.
            populateLanguageSelector(languageSelector);
            renderHistory();
        });

        if (languageSelector) {
            languageSelector.addEventListener('change', (e) => {
                I18nManager.setLanguage(e.target.value);
                populateLanguageSelector(languageSelector);
                // Timestamps are locale-formatted, so re-render the list.
                renderHistory();
            });
        }
    }

    // 2. Initialize theme manager
    if (typeof ThemeManager !== 'undefined') {
        ThemeManager.init(storage, () => {
            // Theme loaded
        });

        if (themeSelector) {
            themeSelector.value = ThemeManager.getTheme();
            themeSelector.addEventListener('change', (e) => {
                ThemeManager.setTheme(e.target.value);
            });
        }
    }

    // 3. Initialize favorites manager
    if (typeof FavoritesManager !== 'undefined') {
        FavoritesManager.init(storage, () => {
            FavoritesManager.renderFavorites();
        });
    }

    // 4. Initialize history filter
    if (typeof HistoryFilter !== 'undefined' && historySearchInput) {
        HistoryFilter.init(historySearchInput, historyList, clearSearchButton);
    }

    // 5. Initialize keyboard shortcuts
    if (typeof KeyboardShortcuts !== 'undefined') {
        KeyboardShortcuts.init({
            generate: commitUsername,
            copy: copyUsername
        });
    }

    // === New Event Handlers ===

    // Export history to CSV
    if (exportHistoryButton) {
        exportHistoryButton.addEventListener('click', () => {
            if (typeof CSVExporter !== 'undefined') {
                const searchQuery = typeof HistoryFilter !== 'undefined' ? HistoryFilter.getSearchQuery() : '';
                const historyToExport = searchQuery
                    ? history.filter(item => item.username.toLowerCase().includes(searchQuery.toLowerCase()))
                    : history;
                CSVExporter.exportToCSV(historyToExport, formatTimestamp);
            }
        });
    }

    // Clear search button
    if (clearSearchButton) {
        clearSearchButton.addEventListener('click', () => {
            if (typeof HistoryFilter !== 'undefined') {
                HistoryFilter.clear();
            }
        });
    }

    // === Load history and seed initial username ===
    loadHistory();
    storage && storage.get ? storage.get([HISTORY_KEY], (result) => {
        if (chrome.runtime && chrome.runtime.lastError) {
            console.error('Failed to load history for initial seed', chrome.runtime.lastError);
            commitUsername();
            return;
        }
        const existing = Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
        if (existing.length === 0) {
            commitUsername();
        } else {
            history = existing.sort((a, b) => b.timestamp - a.timestamp);
            visibleHistoryCount = Math.min(history.length, HISTORY_BATCH_SIZE);
            renderHistory();
            // Replace the static placeholder with a fresh preview.
            previewUsername();
        }
    }) : commitUsername();

    // === Expose state and helpers for inter-module communication ===
    if (typeof window !== 'undefined') {
        window.__usernameGeneratorState = {
            // Getter so modules always see the current array, not the empty
            // array captured at bootstrap time.
            get history() {
                return history;
            },
            locale: 'en-US',
            renderHistory,
            renderFilteredHistory: (filteredItems) => renderHistory(filteredItems)
        };

        window.__usernameGeneratorTestHelpers = {
            upsertHistory,
            formatTimestamp,
            generateUsername,
            getOptions
        };
    }
});
