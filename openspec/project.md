# Project Context

## Purpose
Chrome MV3 extension for generating customizable usernames. Provides UI controls to tweak readability and character sets, preview the result, and copy to clipboard. Ships as a lightweight, offline tool with minimal permissions.

## Tech Stack
- Chrome Extension Manifest V3
- HTML/CSS/JavaScript (ES2015+; no framework)
- Jest with jsdom for automated tests

## Project Conventions

### Code Style
- ES2015+ JavaScript; prefer `const`/`let` and arrow functions for callbacks
- 4-space indentation, single quotes
- camelCase for variables/functions; PascalCase only for constructors
- UI files live at repo root (`popup.html`, `popup.css`, `popup.js`); reusable fragments under `assets/`
- Event handlers registered inside `DOMContentLoaded` callback
- Manifest must list every new script, HTML page, or asset

### Architecture Patterns
- Simple popup/page UI backed by a single script (`popup.js`) that wires DOM events to generator logic
- Character generation built from configurable sets (readability presets and explicit toggles)
- Assets (icons/images) at root or under `assets/` per manifest needs

### Testing Strategy
- Manual regression checklist after changes: reload extension, toggle each generator option, confirm length slider/number sync, verify clipboard copy and alerts
- Jest unit tests for logic-heavy pieces (e.g., generator options, length validation); tests live in `tests/`

### Git Workflow
- Feature work on branches off `develop`/`main`
- Commit messages imperative and scoped (e.g., `feat: add length validation`, `test: add generator cases`)
- Include manual test steps and UX impact in PR summaries when applicable

## Domain Context
- Username generator with readability presets: Easy to say (letters), Easy to read (ambiguous chars stripped), All characters (letters, numbers, symbols)
- Toggles for uppercase, lowercase, numbers, symbols; length input and slider kept in sync; copy-to-clipboard with user feedback
- Default permission minimal (`storage`) and should remain least-privilege

## Important Constraints
- Manifest V3 compliance; request only necessary permissions
- Sanitize and validate user-facing text; avoid injection risks
- Keep behavior in DOMContentLoaded scope for popup/page scripts
 - Package command: `zip -r dist/usernameGenerator.zip manifest.json page.html popup.css popup.js background.js icon.png`（如有新增资源请追加）

## External Dependencies
- Chrome extension runtime (Manifest V3)
- Clipboard API for copy action
