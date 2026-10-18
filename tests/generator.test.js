/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const pageHtml = fs.readFileSync(path.join(__dirname, '..', 'chrome-extension', 'page.html'), 'utf8');
const quickHtml = fs.readFileSync(path.join(__dirname, '..', 'chrome-extension', 'popup-quick.html'), 'utf8');

/**
 * Load an IIFE browser module into the Node global scope.
 * @param {string} file - File name under chrome-extension/modules
 * @param {string} exportName - Name of the const exported by the module
 */
function loadModule(file, exportName) {
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'chrome-extension', 'modules', file),
        'utf8'
    );
    const factory = new Function(source + '\nreturn ' + exportName + ';');
    global[exportName] = factory();
}

loadModule('generator-core.js', 'UsernameGenerator');
loadModule('history-store.js', 'HistoryStore');
loadModule('toast.js', 'Toast');
loadModule('i18n-manager.js', 'I18nManager');
loadModule('presets.js', 'Presets');
loadModule('data-portability.js', 'DataPortability');

require('../chrome-extension/popup.js');

function createStorageMock() {
    return {
        storage: {
            local: {
                _data: {},
                get(keys, cb) {
                    const keyArray = Array.isArray(keys) ? keys : [keys];
                    const result = {};
                    keyArray.forEach(k => {
                        result[k] = this._data[k];
                    });
                    cb(result);
                },
                set(items, cb) {
                    this._data = { ...this._data, ...items };
                    if (cb) cb();
                }
            }
        }
    };
}

function buildDom(html) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch && bodyMatch[1] ? bodyMatch[1] : '';
    const stripped = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    document.body.innerHTML = stripped;
}

function bootstrapPopup() {
    buildDom(pageHtml);
    global.chrome = createStorageMock();
    const domLoaded = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
    document.dispatchEvent(domLoaded);
}

function bootstrapQuickPopup() {
    buildDom(quickHtml);
    global.chrome = createStorageMock();
    const source = fs.readFileSync(
        path.join(__dirname, '..', 'chrome-extension', 'popup-quick.js'),
        'utf8'
    );
    new Function(source)();
}

describe('username generator popup', () => {
    beforeAll(() => {
        Object.defineProperty(global.navigator, 'clipboard', {
            value: {
                writeText: jest.fn().mockResolvedValue()
            },
            configurable: true
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    test('clamps length inputs and keeps slider in sync', () => {
        bootstrapPopup();
        const lengthInput = document.getElementById('length');
        const lengthSlider = document.getElementById('length-slider');

        lengthInput.value = '1';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));

        const username = document.getElementById('generated-username').textContent;

        expect(lengthInput.value).toBe('3');
        expect(lengthSlider.value).toBe('3');
        expect(username.length).toBe(3);
    });

    test('falls back to lowercase when no categories are selected', () => {
        bootstrapPopup();

        ['lowercase', 'uppercase', 'numbers', 'symbols'].forEach(id => {
            document.getElementById(id).checked = false;
        });

        document.getElementById('generate-username').click();
        const username = document.getElementById('generated-username').textContent;

        expect(document.getElementById('lowercase').checked).toBe(true);
        expect(username).toMatch(/^[a-z]+$/);
    });

    test('includes required categories and strips ambiguous characters in easy-to-read mode', () => {
        bootstrapPopup();

        document.getElementById('easy-to-read').checked = true;
        document.getElementById('easy-to-read').dispatchEvent(new Event('change', { bubbles: true }));

        const lengthInput = document.getElementById('length');
        lengthInput.value = '10';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));

        const username = document.getElementById('generated-username').textContent;

        expect(username.length).toBe(10);
        expect(username).toMatch(/[A-Z]/);
        expect(username).toMatch(/[3-9]/);
        expect(username).not.toMatch(/[Il1O0S5B8Z2]/);
    });

    test('easy-to-say uses pronounceable pattern with letters only', () => {
        bootstrapPopup();

        const easyToSay = document.getElementById('easy-to-say');
        easyToSay.checked = true;
        easyToSay.dispatchEvent(new Event('change', { bubbles: true }));

        const lengthInput = document.getElementById('length');
        lengthInput.value = '8';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));

        const username = document.getElementById('generated-username').textContent;
        const isVowel = (ch) => 'aeiouAEIOU'.includes(ch);

        expect(username).toMatch(/^[A-Za-z]+$/);
        expect(username.length).toBe(8);
        for (let i = 1; i < username.length; i++) {
            expect(isVowel(username[i]) !== isVowel(username[i - 1])).toBe(true);
        }
    });

    test('preset change syncs checkboxes', () => {
        bootstrapPopup();

        const easyToRead = document.getElementById('easy-to-read');
        easyToRead.checked = true;
        easyToRead.dispatchEvent(new Event('change', { bubbles: true }));

        expect(document.getElementById('uppercase').checked).toBe(true);
        expect(document.getElementById('lowercase').checked).toBe(true);
        expect(document.getElementById('numbers').checked).toBe(true);
        expect(document.getElementById('symbols').checked).toBe(false);
    });

    test('preview changes do not write history, explicit generate does', () => {
        bootstrapPopup();

        // The initial seed writes exactly one entry.
        expect(window.__usernameGeneratorState.history.length).toBe(1);

        const lengthInput = document.getElementById('length');
        lengthInput.value = '9';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));
        lengthInput.value = '12';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('uppercase').click();

        // Browsing options only updates the preview.
        expect(window.__usernameGeneratorState.history.length).toBe(1);

        document.getElementById('generate-username').click();
        expect(window.__usernameGeneratorState.history.length).toBe(2);
    });

    test('page HTML includes required controls', () => {
        bootstrapPopup();

        expect(document.getElementById('generated-username')).not.toBeNull();
        expect(document.getElementById('easy-to-say')).not.toBeNull();
        expect(document.getElementById('easy-to-read')).not.toBeNull();
        expect(document.getElementById('all-characters')).not.toBeNull();
        expect(document.getElementById('generate-username')).not.toBeNull();
        expect(document.getElementById('copy-username')).not.toBeNull();
    });

    test('history helpers upsert and limit to 50 with deduplication', () => {
        bootstrapPopup();
        const { upsertHistory } = window.__usernameGeneratorTestHelpers;

        const initial = Array.from({ length: 50 }, (_, i) => ({
            username: `user-${i}`,
            timestamp: i
        }));

        const updated = upsertHistory(initial, { username: 'user-10', timestamp: 999 }, 50);

        expect(updated[0]).toEqual({ username: 'user-10', timestamp: 999 });
        expect(updated.length).toBe(50);
        expect(updated.filter(item => item.username === 'user-10').length).toBe(1);

        const added = upsertHistory(updated, { username: 'user-51', timestamp: 1000 }, 50);
        expect(added.length).toBe(50);
        expect(added[0].username).toBe('user-51');
        expect(added.find(item => item.username === 'user-0')).toBeUndefined();
    });

    test('formatTimestamp uses local time in expected format', () => {
        bootstrapPopup();
        const { formatTimestamp } = window.__usernameGeneratorTestHelpers;
        const date = new Date(Date.UTC(2024, 4, 6, 7, 8, 9)); // May 6 2024 07:08:09 UTC
        const formatted = formatTimestamp(date.getTime());
        // Locale-independent, always YYYY-MM-DD HH:mm:ss in local time.
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    test('generator core clamps length and supports all modes', () => {
        expect(UsernameGenerator.clampLength('1')).toBe(3);
        expect(UsernameGenerator.clampLength('99')).toBe(30);
        expect(UsernameGenerator.clampLength('abc')).toBe(8);

        const easyToSay = UsernameGenerator.generate({
            length: 8, easyToSay: true, easyToRead: false, allCharacters: false,
            uppercase: true, lowercase: true, numbers: false, symbols: false
        });
        expect(easyToSay).toMatch(/^[A-Za-z]{8}$/);

        const allChars = UsernameGenerator.generate({
            length: 12, easyToSay: false, easyToRead: false, allCharacters: true,
            uppercase: true, lowercase: true, numbers: true, symbols: true
        });
        expect(allChars.length).toBe(12);
    });

    test('history store caps entries and dedupes', () => {
        const list = Array.from({ length: 50 }, (_, i) => ({ username: `u${i}`, timestamp: i }));
        const next = HistoryStore.upsert(list, { username: 'u10', timestamp: 999 }, 50);

        expect(next.length).toBe(50);
        expect(next[0]).toEqual({ username: 'u10', timestamp: 999 });
        expect(next.filter(item => item.username === 'u10').length).toBe(1);
    });

    test('quick popup generates and records history on generate', () => {
        bootstrapQuickPopup();
        const output = document.getElementById('quick-output');

        expect(output.textContent.length).toBeGreaterThanOrEqual(3);

        document.getElementById('quick-generate').click();
        const generated = output.textContent;
        const stored = global.chrome.storage.local._data.usernameHistory;

        expect(Array.isArray(stored)).toBe(true);
        expect(stored[0].username).toBe(generated);
    });

    test('quick popup copies the displayed username and records it', () => {
        bootstrapQuickPopup();
        const output = document.getElementById('quick-output');

        document.getElementById('quick-copy').click();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(output.textContent);
        expect(global.chrome.storage.local._data.usernameHistory[0].username).toBe(output.textContent);
    });

    test('every supported language defines all translation keys', () => {
        const keys = [
            'app.title', 'app.subtitle', 'app.description',
            'quick.moreOptions', 'quick.mode', 'quick.length',
            'quick.autoCopy', 'quick.hint.enter', 'quick.hint.copy',
            'history.generateOne', 'a11y.copy',
            'preset.label',
            'preset.gaming', 'preset.gaming.tooltip',
            'preset.social', 'preset.social.tooltip',
            'preset.word', 'preset.word.tooltip',
            'preset.strong', 'preset.strong.tooltip',
            'batch.generate',
            'history.exportJson', 'history.importJson',
            'alert.importSuccess', 'alert.importFailed', 'alert.exportSuccess',
            'customize.title',
            'mode.easyToSay', 'mode.easyToRead', 'mode.allCharacters',
            'mode.easyToSay.tooltip', 'mode.easyToRead.tooltip', 'mode.allCharacters.tooltip',
            'char.uppercase', 'char.lowercase', 'char.numbers', 'char.symbols',
            'length.label', 'button.generate', 'button.copy',
            'history.title', 'history.subtitle', 'history.clear', 'history.loadMore',
            'history.export', 'history.search', 'history.clearSearch', 'history.empty',
            'favorites.title', 'favorites.subtitle', 'favorites.empty', 'favorites.favorited',
            'theme.system', 'theme.light', 'theme.dark',
            'alert.copySuccess', 'alert.copyFailed', 'alert.noHistory',
            'alert.favoritesCleared', 'confirm.clearFavorites',
            'shortcut.generated', 'shortcut.copied'
        ];

        const languages = I18nManager.getSupportedLanguages();
        expect(languages).toEqual(['en', 'zh', 'zh-TW', 'ja', 'ko', 'es', 'fr', 'de']);

        languages.forEach(code => {
            keys.forEach(key => {
                expect(I18nManager.hasTranslation(code, key)).toBe(true);
            });
        });
    });

    test('language selectors list every supported language', () => {
        bootstrapPopup();
        const select = document.getElementById('language-selector');
        const values = Array.from(select.options).map(option => option.value);
        const labels = Array.from(select.options).map(option => option.textContent);

        expect(values).toEqual(I18nManager.getSupportedLanguages());
        expect(labels).toContain('繁體中文');
        expect(labels).toContain('한국어');
    });

    test('quick popup language selector is populated', () => {
        bootstrapQuickPopup();
        const select = document.getElementById('quick-language');

        expect(select).not.toBeNull();
        expect(Array.from(select.options).map(option => option.value))
            .toEqual(I18nManager.getSupportedLanguages());
    });

    test('switching language updates the UI', () => {
        bootstrapQuickPopup();
        const select = document.getElementById('quick-language');

        select.value = 'zh-TW';
        select.dispatchEvent(new Event('change', { bubbles: true }));

        expect(document.querySelector('.quick-title').textContent).toBe('使用者名稱產生器');
        expect(select.options.length).toBe(I18nManager.getSupportedLanguages().length);

        I18nManager.setLanguage('en');
    });

    test('auto-copy copies right after generating when enabled', async () => {
        bootstrapQuickPopup();
        navigator.clipboard.writeText.mockClear();

        const toggle = document.getElementById('quick-auto-copy');
        expect(toggle.checked).toBe(false);

        toggle.checked = true;
        toggle.dispatchEvent(new Event('change', { bubbles: true }));

        document.getElementById('quick-generate').click();
        await Promise.resolve();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
            document.getElementById('quick-output').textContent
        );
    });

    test('auto-copy stays off by default', async () => {
        bootstrapQuickPopup();
        navigator.clipboard.writeText.mockClear();

        document.getElementById('quick-generate').click();
        await Promise.resolve();

        expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    test('empty history offers a generate shortcut', () => {
        bootstrapPopup();

        // Clear the seeded entry so the empty state shows.
        document.getElementById('clear-history').click();

        const emptyState = document.getElementById('empty-history');
        const action = document.getElementById('generate-from-empty');

        expect(emptyState.style.display).toBe('flex');
        expect(action).not.toBeNull();

        const before = window.__usernameGeneratorState.history.length;
        action.click();

        expect(window.__usernameGeneratorState.history.length).toBe(before + 1);
    });

    test('history rows expose a keyboard-focusable copy target', () => {
        bootstrapPopup();

        const text = document.querySelector('#history-list .history-item .history-text');
        expect(text).not.toBeNull();
        expect(text.getAttribute('tabindex')).toBe('0');
        expect(text.getAttribute('role')).toBe('button');
        expect(text.getAttribute('aria-label')).toContain('Copy username');
        expect(document.querySelector('#history-list .history-item').getAttribute('role')).toBe('listitem');
    });

    test('preset chips render one button per preset', () => {
        bootstrapPopup();

        const chips = document.querySelectorAll('#preset-chips .preset-chip');
        expect(chips.length).toBe(Presets.ids().length);
        expect(Array.from(chips).map(chip => chip.dataset.preset)).toEqual(Presets.ids());
        expect(chips[0].textContent.length).toBeGreaterThan(0);
    });

    test('strong preset selects all characters and length 16', () => {
        bootstrapPopup();

        document.querySelector('#preset-chips [data-preset="strong"]').click();

        expect(document.getElementById('all-characters').checked).toBe(true);
        expect(document.getElementById('uppercase').checked).toBe(true);
        expect(document.getElementById('lowercase').checked).toBe(true);
        expect(document.getElementById('numbers').checked).toBe(true);
        expect(document.getElementById('symbols').checked).toBe(true);
        expect(document.getElementById('length').value).toBe('16');
        expect(document.getElementById('length-slider').value).toBe('16');
        expect(document.querySelector('#preset-chips [data-preset="strong"]').getAttribute('aria-pressed')).toBe('true');
    });

    test('social preset is lowercase and numbers only', () => {
        bootstrapPopup();

        document.querySelector('#preset-chips [data-preset="social"]').click();

        expect(document.getElementById('easy-to-read').checked).toBe(true);
        expect(document.getElementById('uppercase').checked).toBe(false);
        expect(document.getElementById('lowercase').checked).toBe(true);
        expect(document.getElementById('numbers').checked).toBe(true);
        expect(document.getElementById('symbols').checked).toBe(false);

        const username = document.getElementById('generated-username').textContent;
        expect(username).toMatch(/^[a-z0-9]+$/);
    });

    test('word preset disables numbers and symbols', () => {
        bootstrapPopup();

        document.querySelector('#preset-chips [data-preset="word"]').click();

        expect(document.getElementById('easy-to-say').checked).toBe(true);
        expect(document.getElementById('numbers').disabled).toBe(true);
        expect(document.getElementById('symbols').disabled).toBe(true);

        const username = document.getElementById('generated-username').textContent;
        expect(username).toMatch(/^[A-Za-z]+$/);
    });

    test('switching a manual option clears the active preset', () => {
        bootstrapPopup();

        document.querySelector('#preset-chips [data-preset="strong"]').click();
        expect(document.querySelector('#preset-chips [data-preset="strong"]').getAttribute('aria-pressed')).toBe('true');

        const uppercase = document.getElementById('uppercase');
        uppercase.checked = false;
        uppercase.dispatchEvent(new Event('change', { bubbles: true }));

        document.querySelectorAll('#preset-chips .preset-chip').forEach(chip => {
            expect(chip.getAttribute('aria-pressed')).toBe('false');
        });
    });

    test('batch generation produces ten distinct candidates', () => {
        bootstrapPopup();

        document.getElementById('generate-batch').click();

        const items = document.querySelectorAll('#batch-results .batch-item');
        const names = Array.from(items).map(item => item.textContent);

        expect(items.length).toBe(10);
        expect(new Set(names).size).toBe(10);
    });

    test('clicking a batch candidate copies it and records history', () => {
        bootstrapPopup();
        navigator.clipboard.writeText.mockClear();

        document.getElementById('generate-batch').click();
        const item = document.querySelector('#batch-results .batch-item');
        const name = item.textContent;
        item.click();

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(name);
        expect(window.__usernameGeneratorState.history[0].username).toBe(name);
    });

    test('export payload survives a serialize/parse roundtrip', () => {
        const history = [
            { username: 'alpha', timestamp: 1000 },
            { username: 'beta', timestamp: 2000 }
        ];
        const favorites = [{ username: 'beta', timestamp: 3000 }];

        const parsed = DataPortability.parse(DataPortability.serialize(history, favorites));

        expect(parsed.history).toEqual([
            { username: 'beta', timestamp: 2000 },
            { username: 'alpha', timestamp: 1000 }
        ]);
        expect(parsed.favorites).toEqual([{ username: 'beta', timestamp: 3000 }]);
    });

    test('parse rejects non-JSON and unrelated files', () => {
        expect(() => DataPortability.parse('not json')).toThrow(/valid JSON/);
        expect(() => DataPortability.parse('{"foo":1}')).toThrow(/no history or favorites/);
        expect(() => DataPortability.parse('{"app":"other","history":[]}')).toThrow(/different app/);
    });

    test('normalizeList drops invalid entries and keeps the newest duplicate', () => {
        const list = DataPortability.normalizeList([
            { username: 'dup', timestamp: 100 },
            { username: 'dup', timestamp: 900 },
            { username: '', timestamp: 500 },
            null,
            { username: 'solo' }
        ]);

        expect(list.map(item => item.username).sort()).toEqual(['dup', 'solo']);
        expect(list.find(item => item.username === 'dup').timestamp).toBe(900);
        // Entries without a timestamp fall back to now().
        expect(list.find(item => item.username === 'solo').timestamp).toBeGreaterThan(0);
    });

    test('merge cannot exceed the history limit', () => {
        const current = Array.from({ length: 40 }, (_, i) => ({ username: `cur-${i}`, timestamp: i + 1 }));
        const incoming = Array.from({ length: 40 }, (_, i) => ({ username: `new-${i}`, timestamp: 1000 + i }));

        const merged = DataPortability.merge(current, incoming, 50);

        expect(merged.length).toBe(50);
        expect(merged[0].username).toBe('new-39');
        expect(merged.some(item => item.username === 'cur-0')).toBe(false);
    });

    test('page HTML exposes JSON export and import controls', () => {
        bootstrapPopup();

        expect(document.getElementById('export-data')).not.toBeNull();
        expect(document.getElementById('import-data')).not.toBeNull();
        expect(document.getElementById('import-data-file')).not.toBeNull();
        expect(document.getElementById('import-data-file').getAttribute('accept')).toContain('json');
    });
});
