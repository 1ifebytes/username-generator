/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const pageHtml = fs.readFileSync(path.join(__dirname, '..', 'page.html'), 'utf8');

require('../popup.js');

function buildDom() {
    const bodyMatch = pageHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch && bodyMatch[1] ? bodyMatch[1] : '';
    const stripped = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    document.body.innerHTML = stripped;
}

function bootstrapPopup() {
    buildDom();
    global.chrome = {
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
                set(items) {
                    this._data = { ...this._data, ...items };
                }
            }
        }
    };
    const domLoaded = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
    document.dispatchEvent(domLoaded);
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
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
});
