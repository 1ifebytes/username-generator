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
    const generateBatchButton = document.getElementById('generate-batch');
    const batchResults = document.getElementById('batch-results');
    const presetChips = document.getElementById('preset-chips');
    const historyList = document.getElementById('history-list');
    const emptyHistory = document.getElementById('empty-history');
    const clearHistoryButton = document.getElementById('clear-history');
    const loadMoreHistoryButton = document.getElementById('load-more-history');
    const exportHistoryButton = document.getElementById('export-history');
    const exportDataButton = document.getElementById('export-data');
    const importDataButton = document.getElementById('import-data');
    const importDataFile = document.getElementById('import-data-file');
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
    let activePresetId = null;

    const BATCH_SIZE = 10;

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
        const copyLabel = typeof I18nManager !== 'undefined'
            ? I18nManager.t('a11y.copy')
            : 'Copy username';

        if (itemsToRender.length === 0) {
            if (emptyHistory) emptyHistory.style.display = 'flex';
            if (loadMoreHistoryButton) loadMoreHistoryButton.disabled = true;
            return;
        }

        if (emptyHistory) emptyHistory.style.display = 'none';

        itemsToRender.forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-item';
            row.setAttribute('role', 'listitem');
            row.setAttribute('data-username', item.username);
            row.setAttribute('data-timestamp', item.timestamp);

            const text = document.createElement('div');
            text.className = 'history-text';
            // Focusable so keyboard users can copy without a mouse.
            text.setAttribute('tabindex', '0');
            text.setAttribute('role', 'button');
            text.setAttribute('aria-label', `${copyLabel}: ${item.username}`);

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

            const copyItem = () => copyToClipboard(item.username);

            row.addEventListener('click', copyItem);

            text.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    copyItem();
                }
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
     * Translate a key and fill {placeholders}.
     * @param {string} key - i18n key
     * @param {Object} [vars] - Placeholder values
     * @returns {string} - Localised text
     */
    function translate(key, vars) {
        let text = typeof I18nManager !== 'undefined' ? I18nManager.t(key) : key;
        if (vars) {
            Object.keys(vars).forEach(name => {
                text = text.split(`{${name}}`).join(String(vars[name]));
            });
        }
        return text;
    }

    /**
     * Copy a username and report the outcome.
     * @param {string} username - Username to copy
     */
    function copyToClipboard(username) {
        if (!username) return;

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

        copyToClipboard(username);
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
        input.addEventListener('change', () => {
            updatePresetChipState(null);
            previewUsername();
        });
    });

    generateButton.addEventListener('click', commitUsername);
    copyButton.addEventListener('click', copyUsername);

    if (generateBatchButton) {
        generateBatchButton.addEventListener('click', generateBatch);
    }

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

    // Empty-state shortcut: generate right from the empty history panel.
    const generateFromEmptyButton = document.getElementById('generate-from-empty');
    if (generateFromEmptyButton) {
        generateFromEmptyButton.addEventListener('click', commitUsername);
    }

    function applyModeDefaults(mode) {
        switch (mode) {
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
            if (easyToSayRadio.checked) applyModeDefaults('easyToSay');
            if (easyToReadRadio.checked) applyModeDefaults('easyToRead');
            if (allCharactersRadio.checked) applyModeDefaults('allCharacters');
            previewUsername();
        });
    });

    if (easyToSayRadio && easyToSayRadio.checked) applyModeDefaults('easyToSay');
    if (easyToReadRadio && easyToReadRadio.checked) applyModeDefaults('easyToRead');
    if (allCharactersRadio && allCharactersRadio.checked) applyModeDefaults('allCharacters');

    // === Presets ===

    /**
     * Mark one preset chip as active and clear the others.
     * @param {string|null} id - Active preset id
     */
    function updatePresetChipState(id) {
        activePresetId = id;
        if (!presetChips) return;

        presetChips.querySelectorAll('.preset-chip').forEach(chip => {
            chip.setAttribute('aria-pressed', String(chip.dataset.preset === id));
        });
    }

    /**
     * Build the preset chips from the Presets module.
     */
    function renderPresetChips() {
        if (!presetChips || typeof Presets === 'undefined') return;

        presetChips.innerHTML = '';
        Presets.ids().forEach(id => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'preset-chip';
            chip.dataset.preset = id;
            chip.setAttribute('aria-pressed', String(activePresetId === id));
            chip.textContent = typeof I18nManager !== 'undefined'
                ? I18nManager.t(Presets.labelKey(id))
                : id;
            chip.title = typeof I18nManager !== 'undefined'
                ? I18nManager.t(Presets.tooltipKey(id))
                : '';
            chip.addEventListener('click', () => applyNamedPreset(id));
            presetChips.appendChild(chip);
        });
    }

    /**
     * Apply a named preset to the visible controls and generate once.
     * @param {string} id - Preset id
     */
    function applyNamedPreset(id) {
        const preset = typeof Presets !== 'undefined' ? Presets.get(id) : null;
        if (!preset) return;

        easyToSayRadio.checked = preset.mode === 'easyToSay';
        easyToReadRadio.checked = preset.mode === 'easyToRead';
        allCharactersRadio.checked = preset.mode === 'allCharacters';

        // Mode defaults decide which toggles are enabled, then the preset
        // overrides the actual selection (e.g. lowercase-only social handles).
        applyModeDefaults(preset.mode);
        uppercaseCheckbox.checked = preset.uppercase;
        lowercaseCheckbox.checked = preset.lowercase;
        numbersCheckbox.checked = preset.numbers;
        symbolsCheckbox.checked = preset.symbols;

        syncLengthInputs(preset.length);
        updatePresetChipState(id);
        commitUsername();
    }

    // === Batch generation ===

    /**
     * Render a grid of generated candidates. Clicking one copies it and adds
     * it to history.
     * @param {string[]} results - Generated usernames
     */
    function renderBatch(results) {
        if (!batchResults) return;

        batchResults.innerHTML = '';
        const copyLabel = typeof I18nManager !== 'undefined'
            ? I18nManager.t('a11y.copy')
            : 'Copy username';

        results.forEach(name => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'batch-item';
            item.textContent = name;
            item.setAttribute('aria-label', `${copyLabel}: ${name}`);
            item.addEventListener('click', () => {
                addHistoryEntry(name);
                copyToClipboard(name);
            });
            batchResults.appendChild(item);
        });
    }

    /**
     * Generate a batch of distinct candidates for the current options.
     */
    function generateBatch() {
        if (!batchResults) return;

        const options = getOptions();
        const results = [];
        const seen = new Set();
        const maxAttempts = BATCH_SIZE * 20;

        for (let attempt = 0; attempt < maxAttempts && results.length < BATCH_SIZE; attempt++) {
            const candidate = generateUsername(options);
            if (!candidate || seen.has(candidate)) continue;
            seen.add(candidate);
            results.push(candidate);
        }

        renderBatch(results);
    }

    // === Module Initialization ===
    // Order matters: i18n -> theme -> favorites -> other modules

    renderPresetChips();

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
            renderPresetChips();
            renderHistory();
        });

        if (languageSelector) {
            languageSelector.addEventListener('change', (e) => {
                I18nManager.setLanguage(e.target.value);
                populateLanguageSelector(languageSelector);
                renderPresetChips();
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

    // Export history + favorites to a JSON file
    if (exportDataButton && typeof DataPortability !== 'undefined') {
        exportDataButton.addEventListener('click', () => {
            const favorites = typeof FavoritesManager !== 'undefined'
                ? FavoritesManager.getFavorites()
                : [];

            DataPortability.download(
                DataPortability.defaultFilename(),
                DataPortability.serialize(history, favorites)
            );

            showToast(translate('alert.exportSuccess', { count: history.length }));
        });
    }

    // Import a previously exported JSON file and merge it in
    if (importDataButton && importDataFile && typeof DataPortability !== 'undefined') {
        importDataButton.addEventListener('click', () => importDataFile.click());

        importDataFile.addEventListener('change', () => {
            const file = importDataFile.files && importDataFile.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = () => {
                try {
                    const parsed = DataPortability.parse(String(reader.result));
                    const knownNames = new Set(history.map(item => item.username));
                    const addedCount = parsed.history.filter(item => !knownNames.has(item.username)).length;

                    const mergedHistory = DataPortability.merge(history, parsed.history, HISTORY_LIMIT);
                    const mergedFavorites = DataPortability.merge(
                        typeof FavoritesManager !== 'undefined' ? FavoritesManager.getFavorites() : [],
                        parsed.favorites
                    );

                    visibleHistoryCount = Math.max(HISTORY_BATCH_SIZE, Math.min(mergedHistory.length, HISTORY_BATCH_SIZE));
                    persistHistory(mergedHistory);

                    if (typeof FavoritesManager !== 'undefined') {
                        FavoritesManager.setFavorites(mergedFavorites);
                    }
                    if (typeof HistoryFilter !== 'undefined') {
                        HistoryFilter.updateHistory(mergedHistory);
                    }

                    renderHistory();
                    showToast(translate('alert.importSuccess', { count: addedCount }));
                } catch (error) {
                    console.error('Failed to import data', error);
                    showToast(translate('alert.importFailed', { reason: error.message }), 'error');
                }
            };

            reader.onerror = () => {
                showToast(translate('alert.importFailed', { reason: 'read error' }), 'error');
            };

            reader.readAsText(file);
            importDataFile.value = '';
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
