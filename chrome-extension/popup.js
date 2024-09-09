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
        let chars = '';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()';

        if (options.allCharacters) {
            chars = lowercase + uppercase + numbers + symbols;
        } else if (options.easyToSay) {
            chars = lowercase + uppercase;
        } else if (options.easyToRead) {
            chars = (lowercase + uppercase + numbers).replace(/[Il1O0]/g, '');
        } else {
            if (options.lowercase) chars += lowercase;
            if (options.uppercase) chars += uppercase;
            if (options.numbers) chars += numbers;
            if (options.symbols) chars += symbols;
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
    }

    function copyUsername() {
        navigator.clipboard.writeText(generatedUsername.textContent).then(() => {
            alert('Username copied to clipboard!');
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