# Repository Guidelines

## Project Structure & Module Organization
This MV3 Chrome extension keeps all sources at the repository root. `manifest.json` drives the build and must list every new script, HTML page, or asset. `popup.html`, `popup.css`, and `popup.js` implement the popup UI; ensure handlers are registered inside the `DOMContentLoaded` callback. Place reusable UI fragments alongside the popup files or under `assets/`. Add automated tests in `tests/`, and include new images or icons under `assets/` or the root depending on manifest requirements.

## Build, Test, and Development Commands
- `zip -r dist/usernameGenerator.zip manifest.json popup.html popup.css popup.js icon.png`: package the extension; append any new files you introduce.
- Manual load: open Chrome → `chrome://extensions` → toggle Developer Mode → “Load unpacked…” pointing to this directory. Repeat after each change to validate behavior.

## Coding Style & Naming Conventions
Write ES2015+ JavaScript using `const` or `let` and arrow functions for callbacks. Indent with 4 spaces, prefer single quotes, and favor compact helpers scoped near their usage. Use camelCase for variables and functions, PascalCase only for constructors, and name new files with lowercase hyphenated words (e.g., `options-panel.html`). Keep CSS selectors descriptive but short; namespace popup-specific styles with `.popup-` when practical.

## Testing Guidelines
Run the manual regression checklist after every change: reload the extension, toggle each generator option, confirm the length slider and preview stay in sync, and verify clipboard copy along with alerts. For logic-heavy additions, add Jest tests in `tests/<feature>.test.js` and configure `npm test` before submitting reviews. Document any gaps if tests cannot be automated.

## Commit & Pull Request Guidelines
Use imperative commit messages such as `feat: add length validation` and keep them scoped to one logical change. Pull requests should summarize UX impact, call out linked issues, and include before/after screenshots or GIFs for UI updates. List manual test steps performed and highlight follow-up tasks or risks so reviewers can assess impact quickly.

## Security & Configuration Tips
Request only the permissions you need; revisit `manifest.json` whenever touching APIs or storage scopes. Sanitize any user-facing text before rendering or copying to the clipboard to avoid injection. Validate new configuration defaults and confirm they align with Chrome’s MV3 policies.
