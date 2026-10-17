/**
 * Generator Core Module
 * Shared username generation logic used by the quick popup and the full page.
 */
const UsernameGenerator = (function() {
    const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
    const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const NUMBERS = '0123456789';
    const SYMBOLS = '!@#$%^&*()';
    const VOWELS = 'aeiou';
    const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
    const AMBIGUOUS_PATTERN = /[Il1O0S5B8Z2]/g;
    const MIN_LENGTH = 3;
    const MAX_LENGTH = 30;

    /**
     * Clamp a requested length into the supported range.
     * @param {number|string} value - Requested length
     * @returns {number} - Length between MIN_LENGTH and MAX_LENGTH
     */
    function clampLength(value) {
        const parsed = parseInt(value, 10);
        const safeValue = Number.isNaN(parsed) ? 8 : parsed;
        return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, safeValue));
    }

    /**
     * Pick a random index below max, preferring a cryptographic source.
     * @param {number} max - Exclusive upper bound
     * @returns {number} - Random index
     */
    function getRandomIndex(max) {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
            const buffer = new Uint32Array(1);
            window.crypto.getRandomValues(buffer);
            return buffer[0] % max;
        }

        return Math.floor(Math.random() * max);
    }

    /**
     * Pick one character from a string.
     * @param {string} characters - Character pool
     * @returns {string} - One character
     */
    function pickChar(characters) {
        return characters.charAt(getRandomIndex(characters.length));
    }

    /**
     * Build the character pools for the selected categories.
     * @param {Object} options - Generator options
     * @returns {Object} - Pools keyed by category
     */
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

    /**
     * Build vowel/consonant pools for pronounceable names.
     * @param {Object} options - Generator options
     * @returns {{vowels: string, consonants: string}}
     */
    function buildPronounceableSets(options) {
        let vowels = (options.lowercase ? VOWELS : '') + (options.uppercase ? VOWELS.toUpperCase() : '');
        let consonants = (options.lowercase ? CONSONANTS : '') + (options.uppercase ? CONSONANTS.toUpperCase() : '');

        if (!vowels && !consonants) {
            const lowercaseCheckbox = typeof document !== 'undefined' ? document.getElementById('lowercase') : null;
            if (lowercaseCheckbox) lowercaseCheckbox.checked = true;
            vowels = VOWELS;
            consonants = CONSONANTS;
        }

        return { vowels, consonants };
    }

    /**
     * Generate an alternating consonant/vowel username.
     * @param {number} length - Desired length
     * @param {Object} options - Generator options
     * @returns {string} - Generated username
     */
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

    /**
     * Resolve which character categories can actually be used.
     * @param {Object} options - Generator options
     * @param {Object} sets - Character pools
     * @returns {string[]} - Selected category keys
     */
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
            const lowercaseCheckbox = typeof document !== 'undefined' ? document.getElementById('lowercase') : null;
            if (lowercaseCheckbox) lowercaseCheckbox.checked = true;
            return ['lowercase'];
        }

        const maxEnforced = Math.max(1, Math.min(selectedKeys.length, clampLength(options.length)));
        return selectedKeys.slice(0, maxEnforced);
    }

    /**
     * Shuffle an array in place.
     * @param {Array} list - Array to shuffle
     * @returns {Array} - The same array
     */
    function shuffleArray(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = getRandomIndex(i + 1);
            [list[i], list[j]] = [list[j], list[i]];
        }

        return list;
    }

    /**
     * Generate a username for the given options.
     * @param {Object} options - Length, mode flags and character toggles
     * @returns {string} - Generated username
     */
    function generate(options) {
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

    return {
        MIN_LENGTH,
        MAX_LENGTH,
        clampLength,
        generate
    };
})();
