# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension that generates customized usernames based on user-specified criteria. The extension provides a popup interface with various options for username generation including character types, length, and readability preferences.

## Architecture

The project follows a simple Chrome extension structure:

- **manifest.json**: Chrome extension configuration (Manifest V3)
- **popup.html**: Main UI interface with form controls for customization
- **popup.js**: Core logic for username generation and UI interactions
- **popup.css**: Styling for the popup interface
- **icon.png**: Extension icon

### Key Components

**Username Generation Logic** (`popup.js:21-157`):
- Three generation modes: "Easy to say" (syllable-based), "Easy to read" (removes ambiguous characters), and "All characters"
- Character sets: lowercase, uppercase, numbers, symbols
- Configurable length (3-30 characters)

**UI Controls** (`popup.html`):
- Radio buttons for readability modes
- Checkboxes for character type selection
- Length input with synchronized number input and range slider
- Generate and copy buttons

## Development

### File Structure
```
chrome-extension/
├── manifest.json      # Extension configuration
├── popup.html         # Main UI
├── popup.js          # Generation logic and event handlers
├── popup.css         # Styling
└── icon.png          # Extension icon
```

### Testing the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `chrome-extension` directory
4. Test by clicking the extension icon in the toolbar

### Key Functions
- `generateUsername(options)`: Main generation logic with three different algorithms
- `getOptions()`: Extracts current UI state
- `updateUsername()`: Regenerates and displays new username
- `copyUsername()`: Copies generated username to clipboard using Chrome's clipboard API

### Character Generation Strategies
- **Easy to say**: Uses syllable patterns (CV, CVC, VC) with vowels and consonants
- **Easy to read**: Excludes ambiguous characters (I, l, 1, O, 0)
- **All characters**: Standard random selection from chosen character sets