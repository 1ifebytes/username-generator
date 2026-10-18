/**
 * History Store Module
 * Shared read/write helpers for username history.
 */
const HistoryStore = (function() {
    const HISTORY_KEY = 'usernameHistory';
    const HISTORY_LIMIT = 50;

    /**
     * Insert or refresh an entry, keeping the newest first and capped.
     * @param {Array} list - Existing history
     * @param {{username: string, timestamp: number}} entry - Entry to upsert
     * @param {number} [limit] - Maximum number of entries
     * @returns {Array} - New history array
     */
    function upsert(list, entry, limit = HISTORY_LIMIT) {
        const filtered = list.filter(item => item.username !== entry.username);
        filtered.unshift(entry);
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        return filtered.slice(0, limit);
    }

    /**
     * Read the stored history, upsert an entry and write it back.
     * @param {Object} storage - chrome.storage.local compatible object
     * @param {string} username - Username to record
     * @param {Function} [callback] - Called after the write completes
     */
    function add(storage, username, callback) {
        const done = () => {
            if (typeof callback === 'function') callback();
        };

        if (!storage || !username) {
            done();
            return;
        }

        storage.get([HISTORY_KEY], (result) => {
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.error('Failed to load history for quick add', chrome.runtime.lastError);
                done();
                return;
            }

            const list = Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : [];
            const next = upsert(list, { username, timestamp: Date.now() }, HISTORY_LIMIT);

            storage.set({ [HISTORY_KEY]: next }, () => {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                    console.error('Failed to persist history for quick add', chrome.runtime.lastError);
                }
                done();
            });
        });
    }

    return {
        HISTORY_KEY,
        HISTORY_LIMIT,
        upsert,
        add
    };
})();
