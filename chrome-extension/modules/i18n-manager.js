/**
 * i18n Manager Module
 * Manages internationalization for English, Chinese, and Japanese
 */
const I18nManager = (function() {
    const LANGUAGE_KEY = 'languagePreference';
    let currentLanguage = 'en';
    let storage = null;

    // Translation dictionaries
    const translations = {
        en: {
            'app.title': 'Username Generator',
            'app.subtitle': 'Chrome Extension',
            'app.description': 'Customize a readable username, sync length controls, and copy with one click.',
            'customize.title': 'Customize your username',
            'mode.easyToSay': 'Easy to say',
            'mode.easyToRead': 'Easy to read',
            'mode.allCharacters': 'All characters',
            'mode.easyToSay.tooltip': 'Avoid numbers and special characters',
            'mode.easyToRead.tooltip': 'Avoid ambiguous characters like I, l, 1, O, 0, S, 5, B, 8, Z, and 2',
            'mode.allCharacters.tooltip': 'Any character combinations like !, 7, h, K, and l1',
            'char.uppercase': 'Uppercase',
            'char.lowercase': 'Lowercase',
            'char.numbers': 'Numbers',
            'char.symbols': 'Symbols',
            'length.label': 'Username Length',
            'button.generate': 'Generate Username',
            'button.copy': 'Copy Username',
            'history.title': 'History',
            'history.subtitle': 'Recent usernames',
            'history.clear': 'Clear all',
            'history.loadMore': 'Load more',
            'history.export': 'Export CSV',
            'history.search': 'Search history...',
            'history.clearSearch': 'Clear search',
            'history.empty': 'No usernames yet. Generate one to get started.',
            'favorites.title': 'Favorites',
            'favorites.subtitle': 'Saved usernames',
            'favorites.empty': 'No favorites yet. Star a username to save it.',
            'theme.system': 'System',
            'theme.light': 'Light',
            'theme.dark': 'Dark',
            'alert.copySuccess': 'Username copied to clipboard!',
            'alert.copyFailed': 'Copy failed. Please try again.',
            'alert.noHistory': 'No history to export.',
            'alert.favoritesCleared': 'All favorites cleared.',
            'confirm.clearFavorites': 'Are you sure you want to clear all favorites?',
            'shortcut.generated': 'Generated!',
            'shortcut.copied': 'Copied!'
        },
        zh: {
            'app.title': '用户名生成器',
            'app.subtitle': 'Chrome 扩展',
            'app.description': '自定义可读用户名，同步长度控制，一键复制。',
            'customize.title': '自定义您的用户名',
            'mode.easyToSay': '易于发音',
            'mode.easyToRead': '易于阅读',
            'mode.allCharacters': '全部字符',
            'mode.easyToSay.tooltip': '避免数字和特殊字符',
            'mode.easyToRead.tooltip': '避免易混淆字符，如 I、l、1、O、0、S、5、B、8、Z 和 2',
            'mode.allCharacters.tooltip': '任何字符组合，如 !、7、h、K 和 l1',
            'char.uppercase': '大写',
            'char.lowercase': '小写',
            'char.numbers': '数字',
            'char.symbols': '符号',
            'length.label': '用户名长度',
            'button.generate': '生成用户名',
            'button.copy': '复制用户名',
            'history.title': '历史记录',
            'history.subtitle': '最近生成的用户名',
            'history.clear': '全部清空',
            'history.loadMore': '加载更多',
            'history.export': '导出 CSV',
            'history.search': '搜索历史...',
            'history.clearSearch': '清除搜索',
            'history.empty': '暂无用户名。生成一个以开始使用。',
            'favorites.title': '收藏',
            'favorites.subtitle': '已保存的用户名',
            'favorites.empty': '暂无收藏。星标用户名以保存。',
            'theme.system': '跟随系统',
            'theme.light': '浅色',
            'theme.dark': '深色',
            'alert.copySuccess': '用户名已复制到剪贴板！',
            'alert.copyFailed': '复制失败，请重试。',
            'alert.noHistory': '没有历史记录可导出。',
            'alert.favoritesCleared': '所有收藏已清空。',
            'confirm.clearFavorites': '确定要清空所有收藏吗？',
            'shortcut.generated': '已生成！',
            'shortcut.copied': '已复制！'
        },
        ja: {
            'app.title': 'ユーザー名生成ツール',
            'app.subtitle': 'Chrome拡張機能',
            'app.description': '読みやすいユーザー名をカスタマイズし、長さを同期して、ワンクリックでコピー。',
            'customize.title': 'ユーザー名をカスタマイズ',
            'mode.easyToSay': '発音しやすい',
            'mode.easyToRead': '読みやすい',
            'mode.allCharacters': 'すべての文字',
            'mode.easyToSay.tooltip': '数字と特殊文字を避ける',
            'mode.easyToRead.tooltip': 'I、l、1、O、0、S、5、B、8、Z、2 など紛らわしい文字を避ける',
            'mode.allCharacters.tooltip': '!、7、h、K、l1 など任意の文字の組み合わせ',
            'char.uppercase': '大文字',
            'char.lowercase': '小文字',
            'char.numbers': '数字',
            'char.symbols': '記号',
            'length.label': 'ユーザー名の長さ',
            'button.generate': 'ユーザー名を生成',
            'button.copy': 'ユーザー名をコピー',
            'history.title': '履歴',
            'history.subtitle': '最近のユーザー名',
            'history.clear': 'すべてクリア',
            'history.loadMore': 'もっと見る',
            'history.export': 'CSVエクスポート',
            'history.search': '履歴を検索...',
            'history.clearSearch': '検索をクリア',
            'history.empty': 'まだユーザー名がありません。生成を始めてください。',
            'favorites.title': 'お気に入り',
            'favorites.subtitle': '保存されたユーザー名',
            'favorites.empty': 'お気に入りはまだありません。スターで保存してください。',
            'theme.system': 'システム',
            'theme.light': 'ライト',
            'theme.dark': 'ダーク',
            'alert.copySuccess': 'ユーザー名をクリップボードにコピーしました！',
            'alert.copyFailed': 'コピーに失敗しました。もう一度お試しください。',
            'alert.noHistory': 'エクスポートする履歴がありません。',
            'alert.favoritesCleared': 'すべてのお気に入りをクリアしました。',
            'confirm.clearFavorites': 'すべてのお気に入りをクリアしてもよろしいですか？',
            'shortcut.generated': '生成しました！',
            'shortcut.copied': 'コピーしました！'
        }
    };

    /**
     * Get locale code for date formatting
     * @param {string} language - Language code
     * @returns {string} - Locale code (e.g., 'zh-CN', 'ja-JP')
     */
    function getLocaleCode(language) {
        const localeMap = {
            'en': 'en-US',
            'zh': 'zh-CN',
            'ja': 'ja-JP'
        };
        return localeMap[language] || 'en-US';
    }

    /**
     * Persist language preference to storage
     * @param {string} language - Language to persist
     */
    function persistLanguage(language) {
        if (!storage) return;

        storage.set({ [LANGUAGE_KEY]: language }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to persist language preference', chrome.runtime.lastError);
            }
        });
    }

    return {
        /**
         * Initialize the i18n manager
         * @param {Object} storageInstance - Chrome storage instance
         * @param {Function} callback - Callback after initialization
         */
        init: function(storageInstance, callback) {
            storage = storageInstance;

            if (!storage) {
                this.setLanguage('en');
                if (callback) callback();
                return;
            }

            storage.get([LANGUAGE_KEY], (result) => {
                if (chrome.runtime && chrome.runtime.lastError) {
                    console.error('Failed to load language preference', chrome.runtime.lastError);
                    currentLanguage = 'en';
                } else {
                    currentLanguage = result[LANGUAGE_KEY] || 'en';
                }

                this.updateUITranslations();
                if (callback) callback();
            });
        },

        /**
         * Set the current language
         * @param {string} language - Language code ('en', 'zh', or 'ja')
         */
        setLanguage: function(language) {
            if (!translations[language]) {
                console.warn(`Language ${language} not supported, falling back to en`);
                language = 'en';
            }

            currentLanguage = language;
            persistLanguage(language);
            this.updateUITranslations();
            this.updateDateLocale();
        },

        /**
         * Get the current language
         * @returns {string} - Current language code
         */
        getLanguage: function() {
            return currentLanguage;
        },

        /**
         * Get a translation by key
         * @param {string} key - Translation key
         * @returns {string} - Translated text
         */
        t: function(key) {
            return translations[currentLanguage]?.[key] || translations['en'][key] || key;
        },

        /**
         * Update all UI elements with translations
         */
        updateUITranslations: function() {
            // Update text content
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                el.textContent = this.t(key);
            });

            // Update placeholders
            document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
                const key = el.getAttribute('data-i18n-placeholder');
                el.placeholder = this.t(key);
            });

            // Update titles
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                el.title = this.t(key);
            });

            // Update aria-labels
            document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
                const key = el.getAttribute('data-i18n-aria-label');
                el.setAttribute('aria-label', this.t(key));
            });
        },

        /**
         * Update date formatting locale
         */
        updateDateLocale: function() {
            if (window.__usernameGeneratorState) {
                window.__usernameGeneratorState.locale = getLocaleCode(currentLanguage);
            }
        },

        /**
         * Get all supported languages
         * @returns {Array} - Array of language codes
         */
        getSupportedLanguages: function() {
            return Object.keys(translations);
        },

        /**
         * Get language display name
         * @param {string} code - Language code
         * @returns {string} - Display name
         */
        getLanguageName: function(code) {
            const names = {
                'en': 'English',
                'zh': '中文',
                'ja': '日本語'
            };
            return names[code] || code;
        }
    };
})();
