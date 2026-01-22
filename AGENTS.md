<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

## Project Overview
This is a Manifest V3 Chrome extension for generating usernames. All source files live in `chrome-extension/` with a modular architecture separating core functionality from feature modules.

## Project Structure & Module Organization
```
chrome-extension/
├── manifest.json          # MV3 manifest - register all scripts/pages here
├── background.js          # Service worker for extension lifecycle
├── page.html              # Full-page UI (opened in new tab)
├── popup.html             # Popup UI (alternative entry point)
├── popup.js               # Core logic and DOM event handlers
├── popup.css              # Styles with CSS variables for theming
├── icon.png               # Extension icon
└── modules/               # Feature modules (IIFE pattern)
    ├── csv-exporter.js
    ├── favorites-manager.js
    ├── history-filter.js
    ├── i18n-manager.js
    ├── keyboard-shortcuts.js
    └── theme-manager.js
```

**Key principles:**
- All modules use IIFE (Immediately Invoked Function Expression) pattern with global namespace exposure
- Core logic lives in `popup.js` inside a `DOMContentLoaded` callback
- Modules are included via `<script>` tags in HTML (order matters)
- Each module exposes a global object (e.g., `FavoritesManager`, `ThemeManager`)
- `manifest.json` must register every new script, HTML page, or asset

## Build, Test, and Development Commands

### Testing
```bash
# Run all Jest tests
npm test

# Run a single test file
npm test -- tests/generator.test.js

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Packaging
```bash
# Package extension for distribution
zip -r dist/usernameGenerator.zip \
  chrome-extension/manifest.json \
  chrome-extension/background.js \
  chrome-extension/page.html \
  chrome-extension/popup.html \
  chrome-extension/popup.js \
  chrome-extension/popup.css \
  chrome-extension/icon.png \
  chrome-extension/modules/
```

### Manual Testing
1. Chrome → `chrome://extensions`
2. Enable "Developer mode" toggle (top-right)
3. Click "Load unpacked"
4. Select the `chrome-extension/` directory
5. After code changes: click the reload icon on the extension card

### Regression Checklist (Run after changes)
- [ ] Reload extension in Chrome
- [ ] Toggle each generator mode (Easy to say / Easy to read / All characters)
- [ ] Verify length slider and input box stay synchronized
- [ ] Test clipboard copy (both "Copy Username" and clicking history items)
- [ ] Check history persistence (refresh page, verify history remains)
- [ ] Verify empty states render correctly
- [ ] Test dark/light theme switching
- [ ] Test language switching (if i18n features modified)

## Coding Style & Naming Conventions

### JavaScript
- **ES2015+ only**: Use `const` or `let` (never `var`)
- **Arrow functions**: Prefer for callbacks and short functions
- **Indentation**: 4 spaces (not tabs)
- **Quotes**: Single quotes for strings (except in HTML/JSON)
- **Semicolons**: Required at end of statements
- **Variable naming**: camelCase for variables and functions
- **Constructor naming**: PascalCase only for constructors/classes
- **File naming**: lowercase-hyphenated-words.js (e.g., `csv-exporter.js`)

### Module Pattern (CRITICAL)
All new modules MUST follow this IIFE pattern:
```javascript
/**
 * Module Name
 * Brief description of purpose
 */
const ModuleName = (function() {
    // Private variables
    let privateVar = null;
    
    // Private functions
    function privateHelper() {
        // ...
    }
    
    // Public API
    return {
        init: function(storage, callback) {
            // Initialization logic
        },
        
        publicMethod: function() {
            // Public functionality
        }
    };
})();
```

### Functions & Comments
- **JSDoc comments**: Required for all public module functions
- **Inline comments**: Use sparingly, only when logic is non-obvious
- **Comment style**: `// Single-line` or `/** Multi-line */`
- **Function expressions**: Prefer named functions in object returns for better stack traces

Example:
```javascript
/**
 * Generate a username based on options
 * @param {Object} options - Configuration object
 * @param {number} options.length - Desired username length
 * @returns {string} - Generated username
 */
function generateUsername(options) {
    const length = clampLength(options.length);
    // ... implementation
}
```

### CSS
- **CSS Variables**: Use for all colors, shadows, spacing that varies by theme
- **Selectors**: Descriptive but concise (e.g., `.history-item`, `.brand-text`)
- **Namespacing**: Prefix popup-specific styles with `.popup-` when practical
- **Theme support**: All color values must use CSS variables defined in `:root` and `[data-theme="dark"]`

### HTML
- **Semantic elements**: Use `<main>`, `<section>`, `<header>`, etc.
- **Accessibility**: Include `aria-label` for controls without visible labels
- **Data attributes**: Use `data-i18n` for translatable strings
- **ID conventions**: kebab-case for IDs (e.g., `generated-username`, `clear-history`)

### Error Handling
- **Chrome API errors**: Always check `chrome.runtime.lastError` after async operations
- **Console errors**: Use `console.error()` for failures, not `console.log()`
- **Graceful degradation**: Handle cases where `chrome.storage` might be unavailable
- **User feedback**: Show alerts for clipboard failures or critical errors

Example:
```javascript
storage.get([KEY], (result) => {
    if (chrome.runtime && chrome.runtime.lastError) {
        console.error('Failed to load data', chrome.runtime.lastError);
        // Provide fallback behavior
        return;
    }
    // Process result
});
```

## Testing Guidelines

### Unit Tests (Jest)
- **Location**: All tests go in `tests/` directory
- **Naming**: `<feature>.test.js` (e.g., `generator.test.js`)
- **Environment**: Configure `jsdom` for DOM testing
- **Coverage**: Add tests for all logic-heavy features (generators, validators, utilities)

### Test Structure
```javascript
/**
 * @jest-environment jsdom
 */

describe('feature name', () => {
    beforeAll(() => {
        // One-time setup
    });

    afterEach(() => {
        // Cleanup after each test
        document.body.innerHTML = '';
    });

    test('should do something specific', () => {
        // Arrange
        // Act
        // Assert
    });
});
```

### Test Helpers
The extension exposes test helpers via `window.__usernameGeneratorTestHelpers`:
- `upsertHistory(list, entry, limit)` - History deduplication logic
- `formatTimestamp(timestamp, locale)` - Date formatting
- `generateUsername(options)` - Core generation algorithm
- `getOptions()` - Current UI state

### What to Test
- ✅ Core algorithms (username generation, character sets)
- ✅ Input validation (length clamping, checkbox fallbacks)
- ✅ Data transformations (history upsert, deduplication)
- ✅ Edge cases (empty states, boundary values)
- ❌ DOM rendering (manual testing preferred)
- ❌ Chrome API interactions (use mocks sparingly)

### Documenting Test Gaps
If automation is impractical, document manual test steps:
```javascript
// Manual test required: Verify clipboard API on actual Chrome extension
// Steps:
// 1. Load extension in Chrome
// 2. Click "Copy Username"
// 3. Paste into text editor
// 4. Confirm username matches displayed value
```

## Commit & Pull Request Guidelines

### Commit Messages
- **Format**: `<type>: <description>`
- **Types**: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`
- **Mood**: Imperative (e.g., "add", "fix", "update", not "added", "fixing")
- **Scope**: One logical change per commit
- **Length**: Limit subject line to 72 characters

Examples:
```
feat: add length validation to username generator
fix: prevent duplicate history entries
refactor: extract character set building logic
test: add unit tests for pronounceable mode
docs: update manual testing checklist
```

### Pull Request Content
1. **Summary**: Explain what changed and why (focus on UX impact)
2. **Linked issues**: Reference issue numbers (e.g., "Fixes #42")
3. **Screenshots**: Include before/after for UI changes (GIFs for interactions)
4. **Manual testing**: List steps performed from regression checklist
5. **Follow-up tasks**: Highlight known limitations or future work
6. **Risks**: Call out potential breaking changes or edge cases

## Security & Configuration Tips

### Permissions (Manifest V3)
- **Minimal permissions**: Only request what you need
- **Current permissions**: `["storage"]` - do not add without justification
- **Before adding**: Verify permission aligns with Chrome Web Store policies
- **Review**: Check `manifest.json` whenever touching new Chrome APIs

### Input Sanitization
- **User-facing text**: Sanitize before rendering to DOM (use `textContent`, not `innerHTML`)
- **Clipboard writes**: Validate data before `navigator.clipboard.writeText()`
- **Storage reads**: Validate array/object structure before use (check `Array.isArray()`)

### Storage Best Practices
- **Quota awareness**: `chrome.storage.local` has limits (check before storing large data)
- **Validation**: Always validate structure when reading from storage
- **Migration**: Use versioning for schema changes (see `migrateStorage()` in `popup.js`)

Example storage migration:
```javascript
storage.get(['version'], (result) => {
    const version = result.version || 1;
    if (version < 2) {
        // Migrate to v2 schema
        storage.set({ version: 2, newField: defaultValue });
    }
});
```

### Secure Coding
- **No eval()**: Never use `eval()` or `Function()` constructor
- **Content Security Policy**: Respect MV3 CSP restrictions (no inline scripts in HTML)
- **External resources**: Do not load scripts/styles from CDNs (bundle locally)

## Common Patterns & Gotchas

### Module Initialization Order
Modules depend on each other and must load in this order:
1. i18n-manager.js (translations first)
2. theme-manager.js (theming second)
3. favorites-manager.js (depends on i18n for messages)
4. Other modules (history-filter, keyboard-shortcuts, csv-exporter)

### Global State Communication
Modules communicate via `window.__usernameGeneratorState`:
```javascript
window.__usernameGeneratorState = {
    history,              // Current history array
    locale,               // Current language code
    renderHistory,        // Function to re-render history
    renderFilteredHistory // Function to render filtered subset
};
```

### Character Set Building
The generator has three modes with different character set logic:
- **Easy to say**: Alternating consonants/vowels (no numbers/symbols)
- **Easy to read**: Removes ambiguous chars (`Il1O0S5B8Z2`)
- **All characters**: Full character set (letters, numbers, symbols)

### Checkbox Auto-correction
If user unchecks all checkboxes, `lowercase` is auto-checked as fallback. This prevents generating empty usernames.

### History Lazy Loading
History renders in batches (10 items per batch). Load more via:
- Scroll to bottom of history list (auto-loads next batch)
- Click "Load more" button (manual batch load)

## Anti-Patterns to Avoid

### ❌ DON'T
- Mutate global arrays directly without calling persist functions
- Skip `chrome.runtime.lastError` checks after storage operations
- Use `innerHTML` with user-generated content (XSS risk)
- Add inline event handlers in HTML (violates CSP)
- Create modules without IIFE pattern (namespace pollution)
- Commit sensitive data (API keys, tokens, credentials)

### ✅ DO
- Use `persistHistory()` wrapper for all history mutations
- Check `chrome.runtime.lastError` consistently
- Use `textContent` or `createElement()` for user content
- Register event listeners in JavaScript, not HTML
- Follow IIFE module pattern for encapsulation
- Validate all configuration defaults before use
