/**
 * History Filter Module
 * Provides search and filter functionality for username history
 */
const HistoryFilter = (function() {
    let searchInput = null;
    let historyList = null;
    let clearButton = null;
    let searchQuery = '';
    let allHistory = [];

    /**
     * Filter history by search query
     * @returns {Array} - Filtered history items
     */
    function filterHistory() {
        if (!searchQuery.trim()) {
            return allHistory;
        }

        return allHistory.filter(item =>
            item.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    /**
     * Render filtered history items
     * @param {Array} items - Items to render
     */
    function renderFiltered(items) {
        // Call the renderHistory function from the main app with filtered items
        if (window.__usernameGeneratorState && window.__usernameGeneratorState.renderFilteredHistory) {
            window.__usernameGeneratorState.renderFilteredHistory(items);
        }
    }

    /**
     * Handle search input changes
     * @param {Event} event - Input event
     */
    function handleSearchInput(event) {
        searchQuery = event.target.value;
        const filtered = filterHistory();
        renderFiltered(filtered);

        // Show/hide clear button
        if (clearButton) {
            clearButton.style.display = searchQuery ? 'block' : 'none';
        }
    }

    /**
     * Clear the search
     */
    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
            searchQuery = '';
            renderFiltered(allHistory);

            if (clearButton) {
                clearButton.style.display = 'none';
            }

            // Focus back on search input
            searchInput.focus();
        }
    }

    /**
     * Update the full history cache
     * @param {Array} history - Complete history array
     */
    function updateHistoryCache(history) {
        allHistory = history || [];
    }

    return {
        /**
         * Initialize the history filter module
         * @param {HTMLInputElement} inputElement - The search input element
         * @param {HTMLElement} listElement - The history list element
         * @param {HTMLButtonElement} clearBtnElement - The clear button element (optional)
         */
        init: function(inputElement, listElement, clearBtnElement = null) {
            searchInput = inputElement;
            historyList = listElement;
            clearButton = clearBtnElement;

            if (!searchInput) {
                console.warn('HistoryFilter: No search input element provided');
                return;
            }

            // Listen for input changes
            searchInput.addEventListener('input', handleSearchInput);

            // Setup clear button
            if (clearButton) {
                clearButton.addEventListener('click', clearSearch);
                clearButton.style.display = 'none'; // Hide initially
            }

            // Listen for Escape key to clear search
            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    clearSearch();
                }
            });

            // Get initial history from state
            if (window.__usernameGeneratorState && window.__usernameGeneratorState.history) {
                allHistory = window.__usernameGeneratorState.history;
            }
        },

        /**
         * Update the history cache (should be called when history changes)
         * @param {Array} history - Complete history array
         */
        updateHistory: function(history) {
            updateHistoryCache(history);
        },

        /**
         * Get the current search query
         * @returns {string} - Current search query
         */
        getSearchQuery: function() {
            return searchQuery;
        },

        /**
         * Set the search query programmatically
         * @param {string} query - New search query
         */
        setSearchQuery: function(query) {
            searchQuery = query;
            if (searchInput) {
                searchInput.value = query;
            }
            const filtered = filterHistory();
            renderFiltered(filtered);

            if (clearButton) {
                clearButton.style.display = query ? 'block' : 'none';
            }
        },

        /**
         * Clear the search and reset to show all history
         */
        clear: function() {
            clearSearch();
        },

        /**
         * Destroy the filter module and remove event listeners
         */
        destroy: function() {
            if (searchInput) {
                searchInput.removeEventListener('input', handleSearchInput);
            }
            if (clearButton) {
                clearButton.removeEventListener('click', clearSearch);
            }
            searchInput = null;
            historyList = null;
            clearButton = null;
            allHistory = [];
            searchQuery = '';
        }
    };
})();
