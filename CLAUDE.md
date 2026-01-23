# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Chrome extension (Manifest V3) that generates customizable usernames. Clicking the extension icon opens a full-page UI (`page.html`) with history management, copy functionality, and various generation modes.

**Key features:** Dual interface (popup + full-page), history persistence via `chrome.storage.local` (up to 50 items with lazy loading), three generation modes (pronounceable, readable, all characters), and cryptographically secure random generation.

## Development Commands

```bash
# Run tests (Jest with jsdom environment)
npm test

# Load extension for development
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select the chrome-extension/ directory

# Package for distribution (manual)
zip -r dist/usernameGenerator.zip chrome-extension/
```

## Architecture

### Entry Points
- **background.js**: Service worker that intercepts extension icon clicks and opens `page.html` in a new tab
- **page.html**: Full-page interface with comprehensive history UI
- **popup.html**: Simplified popup interface (alternative entry point)

### Core Logic (popup.js - shared by both interfaces)

All username generation, history management, and UI state handling lives in `popup.js`. This single file is loaded by both `page.html` and `popup.html`.

**Generation Modes:**
- **Easy to say** (`popup.js:91-139`): Syllable-based patterns using consonant/vowel alternation (CV, CVC, VC). Requires at least one case option; auto-enables lowercase if none selected.
- **Easy to read** (`popup.js:141-152`): Removes ambiguous characters via regex `/[Il1O0S5B8Z2]/g` from selected character sets
- **All characters** (`popup.js:154-165`): Standard random selection from chosen character sets

**History System** (`popup.js:197-265`):
- Uses `chrome.storage.local` with key `usernameHistory`
- Lazy loading: displays 10 items initially, "Load more" button shows batches of 10
- Maximum 50 items total (FIFO eviction)
- Each entry stores: username, timestamp (YYYY-MM-DD HH:mm:ss local time)
- Individual delete, clear all, click-to-copy functionality

**Random Generation** (`popup.js:60-68`):
- Uses `window.crypto.getRandomValues()` when available for cryptographic security
- Falls back to `Math.random()` in non-secure contexts

### Constants and Configuration

```javascript
LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
NUMBERS = '0123456789'
SYMBOLS = '!@#$%^&*()'
VOWELS = 'aeiou'
CONSONANTS = 'bcdfghjklmnpqrstvwxyz'
AMBIGUOUS_PATTERN = /[Il1O0S5B8Z2]/g
HISTORY_LIMIT = 50
HISTORY_BATCH_SIZE = 10
```

### UI Synchronization

Length input and slider are synchronized via `syncLengthInputs()` (`popup.js:40-45`). Both values are clamped to 3-30 characters. Input validation handles NaN defaults to 8.

## Important Design Decisions

1. **Minimal Permissions**: Only `storage` permission is requested; no `activeTab` or host permissions needed
2. **Vanilla JS**: No external dependencies for the extension itself - maximum compatibility and small bundle size
3. **Shared Logic**: Single `popup.js` serves both popup and full-page contexts to avoid code duplication
4. **Chrome Storage Fallback**: Code gracefully handles environments without `chrome.storage.local` (e.g., testing in `test.html`)