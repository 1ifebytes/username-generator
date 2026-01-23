/**
 * Favorites Manager Module
 * Manages favorited usernames with storage persistence
 */
const FavoritesManager = (function() {
    const FAVORITES_KEY = 'usernameFavorites';
    let favorites = [];
    let storage = null;

    /**
     * Create a favorite item
     * @param {string} username - The username to favorite
     * @returns {Object} - Favorite item object
     */
    function createFavoriteItem(username) {
        return {
            username: username,
            timestamp: Date.now()
        };
    }

    /**
     * Persist favorites to storage
     */
    function persistFavorites() {
        if (!storage) return;

        storage.set({ [FAVORITES_KEY]: favorites }, () => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to persist favorites', chrome.runtime.lastError);
            }
        });
    }

    /**
     * Load favorites from storage
     * @param {Function} callback - Callback function after loading
     */
    function loadFavorites(callback) {
        if (!storage) {
            favorites = [];
            if (callback) callback();
            return;
        }

        storage.get([FAVORITES_KEY], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to load favorites', chrome.runtime.lastError);
                favorites = [];
            } else {
                favorites = Array.isArray(result[FAVORITES_KEY]) ? result[FAVORITES_KEY] : [];
            }
            if (callback) callback();
        });
    }

    return {
        /**
         * Initialize the favorites manager
         * @param {Object} storageInstance - Chrome storage instance
         * @param {Function} callback - Callback after initialization
         */
        init: function(storageInstance, callback) {
            storage = storageInstance;
            loadFavorites(callback);
        },

        /**
         * Check if a username is favorited
         * @param {string} username - The username to check
         * @returns {boolean} - True if favorited
         */
        isFavorite: function(username) {
            return favorites.some(fav => fav.username === username);
        },

        /**
         * Toggle favorite status for a username
         * @param {Object} historyItem - History item with username and timestamp
         */
        toggleFavorite: function(historyItem) {
            const existingIndex = favorites.findIndex(
                fav => fav.username === historyItem.username
            );

            if (existingIndex >= 0) {
                // Remove from favorites
                favorites.splice(existingIndex, 1);
            } else {
                // Add to favorites
                const newItem = createFavoriteItem(historyItem.username);
                favorites.unshift(newItem);
            }

            persistFavorites();
            this.renderFavorites();

            // Trigger history re-render to update star icons
            if (window.__usernameGeneratorState && window.__usernameGeneratorState.renderHistory) {
                window.__usernameGeneratorState.renderHistory();
            }
        },

        /**
         * Remove a username from favorites
         * @param {string} username - The username to remove
         */
        removeFavorite: function(username) {
            const index = favorites.findIndex(fav => fav.username === username);
            if (index >= 0) {
                favorites.splice(index, 1);
                persistFavorites();
                this.renderFavorites();

                // Trigger history re-render to update star icons
                if (window.__usernameGeneratorState && window.__usernameGeneratorState.renderHistory) {
                    window.__usernameGeneratorState.renderHistory();
                }
            }
        },

        /**
         * Get all favorites
         * @returns {Array} - Array of favorite items
         */
        getFavorites: function() {
            return [...favorites];
        },

        /**
         * Render favorites to the DOM
         */
        renderFavorites: function() {
            const favoritesList = document.getElementById('favorites-list');
            const emptyFavorites = document.getElementById('empty-favorites');

            if (!favoritesList) return;

            favoritesList.innerHTML = '';

            if (favorites.length === 0) {
                if (emptyFavorites) emptyFavorites.style.display = 'block';
                return;
            }

            if (emptyFavorites) emptyFavorites.style.display = 'none';

            favorites.forEach(item => {
                const row = this.createFavoriteRow(item);
                favoritesList.appendChild(row);
            });
        },

        /**
         * Create a DOM element for a favorite item
         * @param {Object} item - Favorite item
         * @returns {HTMLElement} - DOM element for the favorite item
         */
        createFavoriteRow: function(item) {
            const row = document.createElement('div');
            row.className = 'history-item favorite-item';
            row.setAttribute('data-username', item.username);

            const text = document.createElement('div');
            text.className = 'history-text';

            const name = document.createElement('div');
            name.className = 'history-username';
            name.textContent = item.username;

            const time = document.createElement('div');
            time.className = 'history-timestamp';
            time.textContent = 'Favorited';

            text.appendChild(name);
            text.appendChild(time);

            const actions = document.createElement('div');
            actions.className = 'history-actions-inline';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'history-delete';
            deleteButton.textContent = '✕';
            deleteButton.title = 'Remove from favorites';
            deleteButton.addEventListener('click', (event) => {
                event.stopPropagation();
                this.removeFavorite(item.username);
            });

            actions.appendChild(deleteButton);

            row.addEventListener('click', () => {
                const username = item.username;
                navigator.clipboard.writeText(username)
                    .then(() => {
                        const message = 'Username copied to clipboard!';
                        alert(message);
                    })
                    .catch((error) => {
                        console.error('Failed to copy username', error);
                        alert('Copy failed. Please try again.');
                    });
            });

            row.appendChild(text);
            row.appendChild(actions);
            return row;
        },

        /**
         * Clear all favorites
         */
        clearAll: function() {
            if (favorites.length === 0) return;

            if (confirm('Are you sure you want to clear all favorites?')) {
                favorites = [];
                persistFavorites();
                this.renderFavorites();

                // Trigger history re-render to update star icons
                if (window.__usernameGeneratorState && window.__usernameGeneratorState.renderHistory) {
                    window.__usernameGeneratorState.renderHistory();
                }
            }
        },

        /**
         * Get the count of favorites
         * @returns {number} - Number of favorites
         */
        getCount: function() {
            return favorites.length;
        }
    };
})();
