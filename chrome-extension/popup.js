document.addEventListener('DOMContentLoaded', function() {
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMBERS = '0123456789';
    const SYMBOLS = '!@#$%^&*()';
    const VOWELS = 'aeiou';
    const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
    const AMBIGUOUS_PATTERN = /[Il1O0S5B8Z2]/g;
    const HISTORY_KEY = 'usernameHistory';
    const HISTORY_LIMIT = 50;
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
        const parsed = parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 8 : parsed;
        return Math.min(30, Math.max(3, safeValue));
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

    function getRandomIndex(max) {
        if (window.crypto && window.crypto.getRandomValues) {
            const buffer = new Uint32Array(1);
            window.crypto.getRandomValues(buffer);
            return buffer[0] % max;
        }

        return Math.floor(Math.random() * max);
    }

    function pickChar(characters) {
        return characters.charAt(getRandomIndex(characters.length));
    }

    function buildCharacterSets(options) {
        const sets = {
            lowercase: LOWERCASE,
            uppercase: UPPERCASE,
            numbers: NUMBERS,
            symbols: SYMBOLS
        };

        if (options.easyToRead) {
            sets.lowercase = sets.lowercase.replace(AMBIGUOUS_PATTERN, '');
            sets.uppercase = sets.uppercase.replace(AMBIGUOUS_PATTERN, '');
            sets.numbers = sets.numbers.replace(AMBIGUOUS_PATTERN, '');
        }

        return sets;
    }

    function buildPronounceableSets(options) {
        let vowels = (options.lowercase ? VOWELS : '') + (options.uppercase ? VOWELS.toUpperCase() : '');
        let consonants = (options.lowercase ? CONSONANTS : '') + (options.uppercase ? CONSONANTS.toUpperCase() : '');

        if (!vowels && !consonants) {
            if (lowercaseCheckbox) lowercaseCheckbox.checked = true;
            vowels = VOWELS;
            consonants = CONSONANTS;
        }

        return { vowels, consonants };
    }

    function generatePronounceableUsername(length, options) {
        const { vowels, consonants } = buildPronounceableSets(options);
        const base = [];
        const hasVowels = vowels.length > 0;
        const hasConsonants = consonants.length > 0;

        if (!hasVowels && !hasConsonants) {
            return '';
        }

        const useConsonantFirst = hasConsonants;
        for (let i = 0; i < length; i++) {
            const useConsonant = (i % 2 === 0) ? useConsonantFirst : !useConsonantFirst;
            if (useConsonant && hasConsonants) {
                base.push(pickChar(consonants));
            } else if (hasVowels) {
                base.push(pickChar(vowels));
            } else {
                base.push(pickChar(consonants));
            }
        }

        return base.join('');
    }

    function resolveSelectedCategories(options, sets) {
        const baseSelection = {
            lowercase: options.easyToSay || options.easyToRead || options.allCharacters,
            uppercase: options.easyToSay || options.easyToRead || options.allCharacters,
            numbers: options.easyToRead || options.allCharacters,
            symbols: options.allCharacters
        };

        const selection = {
            lowercase: baseSelection.lowercase && options.lowercase,
            uppercase: baseSelection.uppercase && options.uppercase,
            numbers: baseSelection.numbers && options.numbers,
            symbols: baseSelection.symbols && options.symbols
        };

        const selectedKeys = Object.keys(selection).filter(key => selection[key] && sets[key].length > 0);

        if (selectedKeys.length === 0) {
            document.getElementById('lowercase').checked = true;
            return ['lowercase'];
        }

        const maxEnforced = Math.max(1, Math.min(selectedKeys.length, clampLength(lengthInput.value)));
        return selectedKeys.slice(0, maxEnforced);
    }

    function shuffleArray(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = getRandomIndex(i + 1);
            [list[i], list[j]] = [list[j], list[i]];
        }

        return list;
    }

    function generateUsername(options) {
        const length = clampLength(options.length);

        if (options.easyToSay) {
            return generatePronounceableUsername(length, options);
        }

        const characterSets = buildCharacterSets(options);
        const selectedCategories = resolveSelectedCategories(options, characterSets);
        const allCharacters = selectedCategories.map(category => characterSets[category]).join('');

        if (!allCharacters.length) {
            return '';
        }

        const requiredChars = selectedCategories.map(category => pickChar(characterSets[category]));
        const usernameChars = requiredChars.slice(0, length);

        for (let i = usernameChars.length; i < length; i++) {
            usernameChars.push(pickChar(allCharacters));
        }

        shuffleArray(usernameChars);
        return usernameChars.join('');
    }

    function formatTimestamp(timestamp, locale = 'en-US') {
        const date = new Date(timestamp);
        return date.toLocaleString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(/\//g, '-');
    }

    function upsertHistory(list, entry, limit = HISTORY_LIMIT) {
        const filtered = list.filter(item => item.username !== entry.username);
        filtered.unshift(entry);
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        return filtered.slice(0, limit);
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
        const locale = window.__usernameGeneratorState?.locale || 'en-US';

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
            time.textContent = formatTimestamp(item.timestamp, locale);

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
                        alert(message);
                    })
                    .catch((error) => {
                        console.error('Failed to copy username', error);
                        const failMessage = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copyFailed') : 'Copy failed. Please try again.';
                        alert(failMessage);
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

    function updateUsername(shouldPersist = true) {
        const options = getOptions();
        const username = generateUsername(options);
        generatedUsername.textContent = username;
        if (shouldPersist) {
            addHistoryEntry(username);
        }
    }

    function copyUsername() {
        navigator.clipboard.writeText(generatedUsername.textContent)
            .then(() => {
                const message = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copySuccess') : 'Username copied to clipboard!';
                alert(message);
            })
            .catch((error) => {
                console.error('Failed to copy username', error);
                const failMessage = typeof I18nManager !== 'undefined' ? I18nManager.t('alert.copyFailed') : 'Copy failed. Please try again.';
                alert(failMessage);
            });
    }

    lengthInput.addEventListener('input', function() {
        syncLengthInputs(this.value);
        updateUsername();
    });

    lengthSlider.addEventListener('input', function() {
        syncLengthInputs(this.value);
        updateUsername();
    });

    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', updateUsername);
    });

    generateButton.addEventListener('click', updateUsername);
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

    clearHistoryButton.addEventListener('click', () => {
        history = [];
        persistHistory(history);
        visibleHistoryCount = HISTORY_BATCH_SIZE;
        renderHistory();
    });

    loadMoreHistoryButton.addEventListener('click', () => {
        visibleHistoryCount = Math.min(history.length, visibleHistoryCount + HISTORY_BATCH_SIZE);
        renderHistory();
    });

    historyList.addEventListener('scroll', maybeLoadMoreOnScroll);

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
            updateUsername();
        });
    });

    if (easyToSayRadio && easyToSayRadio.checked) applyPreset('easyToSay');
    if (easyToReadRadio && easyToReadRadio.checked) applyPreset('easyToRead');
    if (allCharactersRadio && allCharactersRadio.checked) applyPreset('allCharacters');

    // === Module Initialization ===
    // Order matters: i18n -> theme -> favorites -> other modules

    // 1. Initialize i18n manager
    if (typeof I18nManager !== 'undefined') {
        I18nManager.init(storage, () => {
            // Translations loaded
        });

        if (languageSelector) {
            languageSelector.value = I18nManager.getLanguage();
            languageSelector.addEventListener('change', (e) => {
                I18nManager.setLanguage(e.target.value);
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
            generate: updateUsername,
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
            updateUsername(true);
            return;
        }
        const existing = Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
        if (existing.length === 0) {
            updateUsername(true);
        } else {
            history = existing.sort((a, b) => b.timestamp - a.timestamp);
            visibleHistoryCount = Math.min(history.length, HISTORY_BATCH_SIZE);
            renderHistory();
        }
    }) : updateUsername(true);

    // === Expose state and helpers for inter-module communication ===
    if (typeof window !== 'undefined') {
        window.__usernameGeneratorState = {
            history,
            locale: typeof I18nManager !== 'undefined' ? I18nManager.getLanguage() : 'en',
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
