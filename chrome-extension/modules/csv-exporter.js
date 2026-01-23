/**
 * CSV Exporter Module
 * Exports username history to a CSV file
 */
const CSVExporter = (function() {
    /**
     * Escape a CSV field value
     * @param {string} value - The value to escape
     * @returns {string} - The escaped value
     */
    function escapeCSVValue(value) {
        // Wrap in quotes and escape any existing quotes
        return '"' + String(value).replace(/"/g, '""') + '"';
    }

    /**
     * Format timestamp for CSV
     * @param {number} timestamp - Unix timestamp in milliseconds
     * @param {Function} formatTimestamp - Timestamp formatting function
     * @returns {string} - Formatted date string
     */
    function formatTimestampForCSV(timestamp, formatTimestamp) {
        if (typeof formatTimestamp === 'function') {
            return escapeCSVValue(formatTimestamp(timestamp));
        }
        // Fallback: use ISO format
        return escapeCSVValue(new Date(timestamp).toISOString());
    }

    /**
     * Convert history array to CSV string
     * @param {Array} history - Array of history items
     * @param {Function} formatTimestamp - Timestamp formatting function
     * @returns {string} - CSV string with BOM for Excel compatibility
     */
    function historyToCSV(history, formatTimestamp) {
        if (!history || history.length === 0) {
            return '';
        }

        // CSV headers
        const headers = ['Username', 'Timestamp', 'Date'];

        // Convert history items to CSV rows
        const rows = history.map(item => {
            const username = escapeCSVValue(item.username);
            const timestamp = item.timestamp;
            const formattedDate = formatTimestampForCSV(timestamp, formatTimestamp);

            return [username, timestamp, formattedDate].join(',');
        });

        // Combine headers and rows
        // Add UTF-8 BOM for Excel compatibility
        return ['\uFEFF', headers.join(','), ...rows].join('\n');
    }

    /**
     * Trigger a file download
     * @param {string} content - File content
     * @param {string} filename - Suggested filename
     */
    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up object URL
        URL.revokeObjectURL(url);
    }

    /**
     * Generate filename with current date
     * @returns {string} - Filename in format: username-history-YYYY-MM-DD.csv
     */
    function generateFilename() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `username-history-${year}-${month}-${day}.csv`;
    }

    return {
        /**
         * Export history to CSV file
         * @param {Array} history - Array of history items with {username, timestamp}
         * @param {Function} formatTimestamp - Function to format timestamps for display
         */
        exportToCSV: function(history, formatTimestamp) {
            if (!history || history.length === 0) {
                alert('No history to export.');
                return;
            }

            try {
                const csv = historyToCSV(history, formatTimestamp);
                const filename = generateFilename();
                downloadFile(csv, filename);
            } catch (error) {
                console.error('Failed to export CSV', error);
                alert('Failed to export history. Please try again.');
            }
        },

        /**
         * Export only filtered/searched history
         * @param {Array} filteredHistory - Filtered array of history items
         * @param {Function} formatTimestamp - Function to format timestamps
         * @param {string} suffix - Optional suffix for filename (e.g., "-filtered")
         */
        exportFilteredToCSV: function(filteredHistory, formatTimestamp, suffix = '') {
            if (!filteredHistory || filteredHistory.length === 0) {
                alert('No items to export.');
                return;
            }

            try {
                const csv = historyToCSV(filteredHistory, formatTimestamp);
                const baseFilename = generateFilename().replace('.csv', '');
                const filename = `${baseFilename}${suffix}.csv`;
                downloadFile(csv, filename);
            } catch (error) {
                console.error('Failed to export filtered CSV', error);
                alert('Failed to export. Please try again.');
            }
        }
    };
})();
