document.addEventListener('DOMContentLoaded', function() {
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMBERS = '0123456789';
    const SYMBOLS = '!@#$%^&*()';
    const AMBIGUOUS_PATTERN = /[Il1O0S5B8Z2]/g;

    const lengthInput = document.getElementById('length');
    const lengthSlider = document.getElementById('length-slider');
    const generatedUsername = document.getElementById('generated-username');
    const generateButton = document.getElementById('generate-username');
    const copyButton = document.getElementById('copy-username');

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

    function updateUsername() {
        const options = getOptions();
        const username = generateUsername(options);
        generatedUsername.textContent = username;
    }

    function copyUsername() {
        navigator.clipboard.writeText(generatedUsername.textContent)
            .then(() => {
                alert('Username copied to clipboard!');
            })
            .catch((error) => {
                console.error('Failed to copy username', error);
                alert('Copy failed. Please try again.');
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

    // Generate initial username
    updateUsername();
});
