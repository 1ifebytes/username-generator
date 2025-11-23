/**
 * @jest-environment jsdom
 */

require('../popup.js');

function buildDom() {
    document.body.innerHTML = `
        <div class="container">
            <div class="username-display">
                <span id="generated-username"></span>
            </div>
            <h1>Customize your username</h1>
            <div class="options-container">
                <div class="options-column">
                    <div class="option">
                        <input type="radio" id="easy-to-say" name="readability" checked>
                        <label for="easy-to-say">Easy to say</label>
                    </div>
                    <div class="option">
                        <input type="radio" id="easy-to-read" name="readability">
                        <label for="easy-to-read">Easy to read</label>
                    </div>
                    <div class="option">
                        <input type="radio" id="all-characters" name="readability">
                        <label for="all-characters">All characters</label>
                    </div>
                </div>
                <div class="options-column">
                    <div class="option">
                        <input type="checkbox" id="uppercase">
                        <label for="uppercase">Uppercase</label>
                    </div>
                    <div class="option">
                        <input type="checkbox" id="lowercase" checked>
                        <label for="lowercase">Lowercase</label>
                    </div>
                    <div class="option">
                        <input type="checkbox" id="numbers">
                        <label for="numbers">Numbers</label>
                    </div>
                    <div class="option">
                        <input type="checkbox" id="symbols">
                        <label for="symbols">Symbols</label>
                    </div>
                </div>
            </div>
            <div class="length-container">
                <label for="length">Username Length:</label>
                <input type="number" id="length" min="3" max="30" value="8">
                <input type="range" id="length-slider" min="3" max="30" value="8">
            </div>
            <div class="button-container">
                <button id="generate-username">Generate Username</button>
                <button id="copy-username">Copy Username</button>
            </div>
        </div>
    `;
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
});
