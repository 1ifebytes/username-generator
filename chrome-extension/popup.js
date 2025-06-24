document.addEventListener('DOMContentLoaded', function() {
    const lengthInput = document.getElementById('length');
    const lengthSlider = document.getElementById('length-slider');
    const generatedUsername = document.getElementById('generated-username');
    const generateButton = document.getElementById('generate-username');
    const copyButton = document.getElementById('copy-username');

    function getOptions() {
        return {
            length: parseInt(lengthInput.value),
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
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()';

        // Helper function to build character set
        function buildCharSet(includeLower, includeUpper, includeNumbers, includeSymbols) {
            return [
                includeLower ? lowercase : '',
                includeUpper ? uppercase : '',
                includeNumbers ? numbers : '',
                includeSymbols ? symbols : ''
            ].join('');
        }

        // Helper function to apply case transformation
        function applyCase(char, options) {
            if (options.uppercase && options.lowercase) {
                return Math.random() < 0.5 ? char.toUpperCase() : char.toLowerCase();
            }
            return options.uppercase ? char.toUpperCase() : char.toLowerCase();
        }

        // Helper function for efficient random selection
        function getRandomChar(chars) {
            return chars[Math.floor(Math.random() * chars.length)];
        }

        if (options.easyToSay) {
            return generateEasyToSayUsername(options, numbers, symbols, applyCase, getRandomChar);
        } else if (options.easyToRead) {
            return generateEasyToReadUsername(options, buildCharSet, getRandomChar);
        } else {
            return generateAllCharactersUsername(options, buildCharSet, getRandomChar);
        }
    }

    function generateEasyToSayUsername(options, numbers, symbols, applyCase, getRandomChar) {
        const vowels = 'aeiou';
        const consonants = 'bcdfghjklmnprstvwyz';
        
        // More natural syllable patterns
        const syllablePatterns = [
            'CV', 'CVC', 'VC', 'V',    // Basic patterns
            'CCV', 'CVV', 'VCC',       // Extended patterns for variety
        ];

        // Calculate suffix length more intelligently
        const suffixChars = buildSuffixChars(options, numbers, symbols);
        const maxSuffixLength = Math.min(2, Math.floor(options.length * 0.3));
        const suffixLength = suffixChars.length > 0 ? 
            Math.min(maxSuffixLength, Math.max(0, options.length - 3)) : 0;
        
        const letterLength = options.length - suffixLength;
        let result = '';

        // Generate pronounceable part
        while (result.length < letterLength) {
            const pattern = getRandomChar(syllablePatterns);
            const syllable = generateSyllable(pattern, vowels, consonants, applyCase, options, getRandomChar);
            
            // Add syllable but don't exceed target length
            const remaining = letterLength - result.length;
            result += syllable.slice(0, remaining);
        }

        // Add suffix
        for (let i = 0; i < suffixLength; i++) {
            result += getRandomChar(suffixChars);
        }

        return result.slice(0, options.length);
    }

    function generateSyllable(pattern, vowels, consonants, applyCase, options, getRandomChar) {
        let syllable = '';
        let lastWasConsonant = false;

        for (const charType of pattern) {
            let char;
            if (charType === 'C') {
                // Avoid double consonants for better pronunciation
                if (lastWasConsonant && Math.random() < 0.6) {
                    char = getRandomChar(vowels);
                    lastWasConsonant = false;
                } else {
                    char = getRandomChar(consonants);
                    lastWasConsonant = true;
                }
            } else { // Vowel
                char = getRandomChar(vowels);
                lastWasConsonant = false;
            }
            syllable += applyCase(char, options);
        }
        return syllable;
    }

    function buildSuffixChars(options, numbers, symbols) {
        return (options.numbers ? numbers : '') + (options.symbols ? symbols : '');
    }

    function generateEasyToReadUsername(options, buildCharSet, getRandomChar) {
        let chars = buildCharSet(options.lowercase, options.uppercase, options.numbers, options.symbols);
        
        // Remove ambiguous characters more efficiently
        chars = chars.replace(/[Il1O0]/g, '');
        
        if (!chars) return '';

        // Use Fisher-Yates inspired approach for better distribution
        const charArray = chars.split('');
        let result = '';
        
        for (let i = 0; i < options.length; i++) {
            // Filter out the last character to avoid consecutive duplicates
            const availableChars = i === 0 ? charArray : 
                charArray.filter(c => c.toLowerCase() !== result[i-1].toLowerCase());
            
            if (availableChars.length === 0) {
                // Fallback if no valid characters available
                result += getRandomChar(charArray);
            } else {
                result += getRandomChar(availableChars);
            }
        }
        
        return result;
    }

    function generateAllCharactersUsername(options, buildCharSet, getRandomChar) {
        const chars = buildCharSet(options.lowercase, options.uppercase, options.numbers, options.symbols);
        
        if (!chars) return '';

        // Use array for better performance with large lengths
        const result = new Array(options.length);
        for (let i = 0; i < options.length; i++) {
            result[i] = getRandomChar(chars);
        }
        
        return result.join('');
    }

    function updateUsername() {
        const options = getOptions();
        const username = generateUsername(options);
        generatedUsername.textContent = username;

        // 清除复制成功的提示信息
        const copySuccess = document.getElementById('copy-success');
        copySuccess.style.display = 'none';
    }

    function copyUsername() {
        navigator.clipboard.writeText(generatedUsername.textContent).then(() => {
            // 显示提示信息
            const copySuccess = document.getElementById('copy-success');
            copySuccess.style.display = 'block';
            // 设置3秒后隐藏提示信息
            setTimeout(() => {
                copySuccess.style.display = 'none';
            }, 3000);
        });
    }

    lengthInput.addEventListener('input', function() {
        lengthSlider.value = this.value;
        updateUsername();
    });

    lengthSlider.addEventListener('input', function() {
        lengthInput.value = this.value;
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