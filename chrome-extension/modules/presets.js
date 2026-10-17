/**
 * Presets Module
 * Named starting points that map to the existing mode + character controls.
 */
const Presets = (function() {
    const PRESETS = {
        gaming: {
            mode: 'easyToRead',
            length: 10,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: false
        },
        social: {
            mode: 'easyToRead',
            length: 12,
            uppercase: false,
            lowercase: true,
            numbers: true,
            symbols: false
        },
        word: {
            mode: 'easyToSay',
            length: 8,
            uppercase: true,
            lowercase: true,
            numbers: false,
            symbols: false
        },
        strong: {
            mode: 'allCharacters',
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true
        }
    };

    /**
     * List preset identifiers in display order.
     * @returns {string[]} - Preset ids
     */
    function ids() {
        return Object.keys(PRESETS);
    }

    /**
     * Get a preset definition.
     * @param {string} id - Preset id
     * @returns {Object|null} - Preset definition
     */
    function get(id) {
        return PRESETS[id] || null;
    }

    /**
     * i18n key for a preset label.
     * @param {string} id - Preset id
     * @returns {string} - Translation key
     */
    function labelKey(id) {
        return `preset.${id}`;
    }

    /**
     * i18n key for a preset tooltip.
     * @param {string} id - Preset id
     * @returns {string} - Translation key
     */
    function tooltipKey(id) {
        return `preset.${id}.tooltip`;
    }

    return { ids, get, labelKey, tooltipKey };
})();
