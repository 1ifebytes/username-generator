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

        document.getElementById('easy-to-say').checked = false;
        document.getElementById('all-characters').checked = false;
        document.getElementById('easy-to-read').checked = true;

        document.getElementById('lowercase').checked = false;
        document.getElementById('uppercase').checked = true;
        document.getElementById('numbers').checked = true;
        document.getElementById('symbols').checked = false;

        const lengthInput = document.getElementById('length');
        lengthInput.value = '10';
        lengthInput.dispatchEvent(new Event('input', { bubbles: true }));

        const username = document.getElementById('generated-username').textContent;

        expect(username.length).toBe(10);
        expect(username).toMatch(/[A-Z]/);
        expect(username).toMatch(/[3-9]/);
        expect(username).not.toMatch(/[Il1O0S5B8Z2]/);
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
});
