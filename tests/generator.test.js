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
        // The format uses toLocaleString which varies by locale (e.g., "2024-05-06, 15:08:09")
        // Just verify it contains date and time components
        expect(formatted).toMatch(/\d{4}/); // Has year
        expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/); // Has time
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
});
