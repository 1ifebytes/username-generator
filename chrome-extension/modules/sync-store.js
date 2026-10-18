/**
 * Sync Store Module
 * Storage adapter that overlays chrome.storage.sync on chrome.storage.local.
 *
 * Only device-independent data is synced (favorites and preferences). Username
 * history stays local on purpose so the tool keeps working fully offline.
 */
const SyncStore = (function() {
    const FAVORITES_KEY = 'usernameFavorites';
    const FAVORITES_LIMIT = 100;

    /** Keys mirrored to chrome.storage.sync. */
    const SYNC_KEYS = [
        FAVORITES_KEY,
        'themePreference',
        'languagePreference',
        'quickSettings'
    ];

    /**
     * Read chrome.runtime.lastError without throwing outside the extension.
     * @returns {Object|null} - Last error, if any
     */
    function lastError() {
        if (typeof chrome === 'undefined' || !chrome.runtime) return null;
        return chrome.runtime.lastError || null;
    }

    /**
     * Normalise the key argument accepted by chrome.storage get().
     * @param {string|string[]|null} keys - Requested keys
     * @returns {string[]} - Requested keys
     */
    function normalizeKeys(keys) {
        if (keys === null || keys === undefined) return [];
        return Array.isArray(keys) ? keys.slice() : [keys];
    }

    /**
     * Union two favorite lists, keeping the newest timestamp per username.
     * @param {Array} localList - Favorites stored locally
     * @param {Array} syncList - Favorites stored in sync storage
     * @returns {Array} - Merged favorites, newest first
     */
    function mergeFavorites(localList, syncList) {
        const byName = new Map();

        const add = (item) => {
            if (!item || typeof item !== 'object') return;
            const username = typeof item.username === 'string' ? item.username.trim() : '';
            if (!username) return;

            const timestamp = Number(item.timestamp);
            const safeTimestamp = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
            const existing = byName.get(username);

            if (!existing || safeTimestamp > existing.timestamp) {
                byName.set(username, { username, timestamp: safeTimestamp });
            }
        };

        (Array.isArray(localList) ? localList : []).forEach(add);
        (Array.isArray(syncList) ? syncList : []).forEach(add);

        return Array.from(byName.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, FAVORITES_LIMIT);
    }

    /**
     * Build a storage-like adapter.
     * @param {Object} localArea - chrome.storage.local
     * @param {Object|null} syncArea - chrome.storage.sync, or null to stay local
     * @returns {{get: Function, set: Function, remove: Function}}
     */
    function create(localArea, syncArea) {
        return {
            /**
             * Read values, preferring synced data and merging favorites.
             * @param {string|string[]} keys - Keys to read
             * @param {Function} callback - Receives the merged result
             */
            get(keys, callback) {
                localArea.get(keys, (localResult) => {
                    const local = localResult || {};
                    if (!syncArea) {
                        callback(local);
                        return;
                    }

                    const wanted = normalizeKeys(keys).filter(key => SYNC_KEYS.indexOf(key) !== -1);
                    if (!wanted.length) {
                        callback(local);
                        return;
                    }

                    syncArea.get(wanted, (syncResult) => {
                        const error = lastError();
                        if (error) {
                            console.error('Failed to read synced settings', error);
                            callback(local);
                            return;
                        }

                        const merged = Object.assign({}, local);
                        const remote = syncResult || {};

                        wanted.forEach(key => {
                            if (remote[key] === undefined) return;

                            if (key === FAVORITES_KEY) {
                                // Union so neither device loses favorites.
                                merged[key] = mergeFavorites(local[key], remote[key]);
                            } else {
                                merged[key] = remote[key];
                            }
                        });

                        callback(merged);
                    });
                });
            },

            /**
             * Write values locally, and mirror synced keys to sync storage.
             * @param {Object} items - Key/value pairs
             * @param {Function} [callback] - Called once both writes finish
             */
            set(items, callback) {
                const done = () => {
                    if (typeof callback === 'function') callback();
                };

                localArea.set(items, () => {
                    const localError = lastError();
                    if (localError) {
                        console.error('Failed to persist local settings', localError);
                    }

                    if (!syncArea) {
                        done();
                        return;
                    }

                    const synced = {};
                    Object.keys(items || {}).forEach(key => {
                        if (SYNC_KEYS.indexOf(key) !== -1) synced[key] = items[key];
                    });

                    if (!Object.keys(synced).length) {
                        done();
                        return;
                    }

                    syncArea.set(synced, () => {
                        const syncError = lastError();
                        if (syncError) {
                            // Quota or transient failures must never break local use.
                            console.error('Failed to write synced settings', syncError);
                        }
                        done();
                    });
                });
            },

            /**
             * Remove keys from both stores.
             * @param {string|string[]} keys - Keys to remove
             * @param {Function} [callback] - Called once both removals finish
             */
            remove(keys, callback) {
                const done = () => {
                    if (typeof callback === 'function') callback();
                };

                if (typeof localArea.remove !== 'function') {
                    done();
                    return;
                }

                localArea.remove(keys, () => {
                    if (!syncArea || typeof syncArea.remove !== 'function') {
                        done();
                        return;
                    }

                    const wanted = normalizeKeys(keys).filter(key => SYNC_KEYS.indexOf(key) !== -1);
                    if (!wanted.length) {
                        done();
                        return;
                    }

                    syncArea.remove(wanted, () => {
                        const error = lastError();
                        if (error) console.error('Failed to remove synced keys', error);
                        done();
                    });
                });
            }
        };
    }

    /**
     * Create an adapter backed by the current page's chrome.storage areas.
     * @returns {Object|null} - Adapter, or null when storage is unavailable
     */
    function createStorage() {
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
            return null;
        }

        return create(chrome.storage.local, chrome.storage.sync || null);
    }

    return {
        SYNC_KEYS,
        FAVORITES_KEY,
        mergeFavorites,
        create,
        createStorage
    };
})();
