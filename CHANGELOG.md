# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## [1.2.0] — 2026-10-18

First Chrome Web Store release.

### Added

- **Toolbar popup** (`popup-quick.html`) as the default action, with one-click generate and copy, length control, and a link to the full page.
- **Auto-copy** option: generating also writes the name to the clipboard.
- **Batch generation**: produce 10 distinct candidates and copy the one you pick.
- **Quick presets**: Gaming ID, Social handle, Readable word, Strong.
- **JSON export/import** for history and favorites, with union merge on import.
- **Cross-device sync** of favorites and preferences through `chrome.storage.sync`.
- **Five more interface languages**: 繁體中文, 한국어, Español, Français, Deutsch (8 total).
- **Keyboard hints** in the popup (`Enter` to generate, `Ctrl/Cmd+C` to copy).
- **Empty-state shortcut** to generate directly from an empty history panel.
- Toast notifications replacing blocking `alert()` dialogs.
- GitHub Actions workflow running the test suite on every push and pull request.

### Changed

- Generation logic, history persistence, and toasts moved into shared modules (`modules/generator-core.js`, `modules/history-store.js`, `modules/toast.js`).
- Timestamps now use a locale-independent `YYYY-MM-DD HH:mm:ss` format.
- Version aligned between `manifest.json` and `package.json`.
- The extension action now opens the popup instead of a new tab; the full page is reachable from the popup.

### Fixed

- History was written on every option change (dragging the length slider could add a dozen entries). Preview and commit are now separate.
- Missing null guards on history controls could abort initialisation.
- `window.__usernameGeneratorState.history` captured a stale empty array; it is now a getter.
- History timestamps did not re-render after switching language.
- Number input overflowed its container by 26px in the full page.
- Favorites label `"Favorited"` was hard-coded in English.
- Storage migration could overwrite favorites synced from another device.

### Removed

- Dead `popup.html` and the unused `background.js` service worker.
- `.DS_Store` from version control.

## [1.1.0] — 2026-01-23

- Favorites with star toggle.
- History search and CSV export.
- Dark mode with system preference detection.
- English, Simplified Chinese, and Japanese interfaces.
- Keyboard shortcuts for generate and copy.
- Full-page view replacing the small popup.

## [1.0.0] — 2026-01-20

- Initial release: three generation modes, length control, local history, one-click copy.
