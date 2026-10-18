/**
 * Data Portability Module
 * Export and import history plus favorites as a JSON file.
 */
const DataPortability = (function() {
    const APP_ID = 'username-generator';
    const SCHEMA_VERSION = 2;

    /**
     * Normalise a single history/favorite entry.
     * @param {*} item - Raw entry from a file
     * @returns {{username: string, timestamp: number}|null} - Clean entry
     */
    function normalizeEntry(item) {
        if (!item || typeof item !== 'object') return null;

        const username = typeof item.username === 'string' ? item.username.trim() : '';
        if (!username) return null;

        const timestamp = Number(item.timestamp);
        return {
            username,
            timestamp: Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now()
        };
    }

    /**
     * Normalise a list, dropping invalid entries and duplicates.
     * @param {*} list - Raw array from a file
     * @returns {Array} - Clean entries, newest first
     */
    function normalizeList(list) {
        if (!Array.isArray(list)) return [];

        const byName = new Map();
        list.forEach(raw => {
            const entry = normalizeEntry(raw);
            if (!entry) return;

            const existing = byName.get(entry.username);
            if (!existing || entry.timestamp > existing.timestamp) {
                byName.set(entry.username, entry);
            }
        });

        return Array.from(byName.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Build the export payload.
     * @param {Array} history - History entries
     * @param {Array} favorites - Favorite entries
     * @returns {Object} - Serialisable payload
     */
    function buildPayload(history, favorites) {
        return {
            app: APP_ID,
            version: SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            history: normalizeList(history),
            favorites: normalizeList(favorites)
        };
    }

    /**
     * Serialise history and favorites to pretty JSON.
     * @param {Array} history - History entries
     * @param {Array} favorites - Favorite entries
     * @returns {string} - JSON text
     */
    function serialize(history, favorites) {
        return JSON.stringify(buildPayload(history, favorites), null, 2);
    }

    /**
     * Parse and validate an exported JSON string.
     * @param {string} text - File contents
     * @returns {{history: Array, favorites: Array}} - Parsed data
     * @throws {Error} When the payload is not a valid export
     */
    function parse(text) {
        let payload;
        try {
            payload = JSON.parse(text);
        } catch (error) {
            throw new Error('File is not valid JSON');
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error('File is not an object');
        }

        const hasLists = Array.isArray(payload.history) || Array.isArray(payload.favorites);
        if (!hasLists) {
            throw new Error('File has no history or favorites');
        }

        if (payload.app && payload.app !== APP_ID) {
            throw new Error('File belongs to a different app');
        }

        return {
            history: normalizeList(payload.history),
            favorites: normalizeList(payload.favorites)
        };
    }

    /**
     * Merge incoming entries into the current list.
     * Keeps the newest timestamp per username, sorts and caps the result.
     * @param {Array} current - Existing entries
     * @param {Array} incoming - Entries to merge in
     * @param {number} [limit] - Maximum entries to keep
     * @returns {Array} - Merged list
     */
    function merge(current, incoming, limit) {
        const merged = normalizeList([...(current || []), ...(incoming || [])]);
        return typeof limit === 'number' ? merged.slice(0, limit) : merged;
    }

    /**
     * Save text as a downloadable file in the current document.
     * @param {string} filename - Suggested file name
     * @param {string} text - File contents
     */
    function download(filename, text) {
        if (typeof document === 'undefined') return;

        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    /**
     * Build a timestamped export file name.
     * @returns {string} - e.g. usernames-2026-10-18.json
     */
    function defaultFilename() {
        const date = new Date();
        const pad = (value) => String(value).padStart(2, '0');
        return `usernames-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
    }

    return {
        APP_ID,
        SCHEMA_VERSION,
        normalizeList,
        buildPayload,
        serialize,
        parse,
        merge,
        download,
        defaultFilename
    };
})();
