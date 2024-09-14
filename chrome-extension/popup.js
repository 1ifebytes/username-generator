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
    
        let chars = '';
        let vowels = 'aeiou';
        let consonants = 'bcdfghjklmnpqrstvwxyz';
    
        if (options.allCharacters) {
            chars = (options.lowercase ? lowercase : '') +
                    (options.uppercase ? uppercase : '') +
                    (options.numbers ? numbers : '') +
                    (options.symbols ? symbols : '');
                } else if (options.easyToSay) {
                    const vowels = 'aeiou';
        const easyConsonants = 'bcdfghjklmnprstvwyz';
        const syllables = ['CV', 'CVC', 'VC'];
        
        let username = '';
        let lastCharWasConsonant = false;
    
        while (username.length < options.length) {
            let syllable = syllables[Math.floor(Math.random() * syllables.length)];
            
            for (let char of syllable) {
                if (username.length >= options.length) break;
                
                if (char === 'C') {
                    if (lastCharWasConsonant && Math.random() < 0.7) {
                        char = 'V';
                    } else {
                        lastCharWasConsonant = true;
                    }
                } else {
                    lastCharWasConsonant = false;
                }
    
                let letter;
                if (char === 'C') {
                    letter = easyConsonants.charAt(Math.floor(Math.random() * easyConsonants.length));
                } else {
                    letter = vowels.charAt(Math.floor(Math.random() * vowels.length));
                }
    
                username += options.uppercase ? letter.toUpperCase() : letter;
            }
    
            if (username.length > 1 && Math.random() < 0.3) {
                username += '';
            }
        }
    
        return username.slice(0, options.length);
                } else if (options.easyToRead) {
            chars = (options.lowercase ? lowercase : '') +
                    (options.uppercase ? uppercase : '') +
                    (options.numbers ? numbers : '');
            chars = chars.replace(/[Il1O0]/g, '');
            let username = '';
            let lastChar = '';
            for (let i = 0; i < options.length; i++) {
                let newChar;
                do {
                    newChar = chars.charAt(Math.floor(Math.random() * chars.length));
                } while (newChar === lastChar || (lastChar.toLowerCase() === newChar.toLowerCase()));
                username += newChar;
                lastChar = newChar;
            }
            return username;
        } else {
            if (options.lowercase) chars += lowercase;
            if (options.uppercase) chars += uppercase;
            if (options.numbers) chars += numbers;
            if (options.symbols) chars += symbols;
        }
    
        if (chars === '') {
            return ''; // 如果没有选择任何字符集,返回空字符串
        }
    
        let username = '';
        for (let i = 0; i < options.length; i++) {
            username += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    
        return username;
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
            copySuccess.style.color = 'red'; // 将提示信息改为红色
            // 设置3秒后隐藏提示信息
            setTimeout(() => {
                copySuccess.style.display = 'none';
            }, 5000);
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