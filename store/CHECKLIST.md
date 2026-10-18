# Chrome Web Store submission checklist

Everything needed to publish **Username Generator 1.2.0**.

---

## 1. Build the upload package

```bash
npm test          # 38 tests must pass
npm run package   # writes dist/username-generator-1.2.0.zip
```

Expected: 23 files, ~51 KB, no `test.html`, no `docs/`.

The script also verifies that every file referenced by `manifest.json`
(popup, icons) actually exists before zipping.

---

## 2. Assets

| Asset | Requirement | File | Status |
|---|---|---|---|
| Store icon | 128×128 PNG | `chrome-extension/icon.png` | ✅ |
| Screenshot 1 | 1280×800, 24-bit, no alpha | `store/screenshots/01-light-en.png` | ✅ |
| Screenshot 2 | 1280×800 | `store/screenshots/02-dark-en.png` | ✅ |
| Screenshot 3 | 1280×800 | `store/screenshots/03-batch.png` | ✅ |
| Screenshot 4 | 1280×800 | `store/screenshots/04-zh-tw.png` | ✅ |
| Small promo tile | 440×280 | `store/screenshots/promo-440x280.png` | ✅ |
| Marquee promo | 1400×560 | optional, not included | — |

Screenshots are rendered from `store/promo-tile.html` and the live page via
`python3 -m http.server` + a headless browser. Re-render if the UI changes.

---

## 3. Privacy policy hosting

The Store requires a public URL. `docs/privacy.html` is ready to serve:

1. Repository → **Settings → Pages**
2. Source: **Deploy from a branch** → branch `master`, folder `/docs`
3. Save, wait for the green check
4. URL becomes: `https://1ifebytes.github.io/username-generator/privacy.html`
5. Paste that URL into the Store listing's **Privacy policy** field

---

## 4. Store listing fields

Copy from `store/listing-en.md` (or `store/listing-zh.md`).

| Field | Value |
|---|---|
| Name | `Username Generator — Fast & Readable` |
| Short description | `Generate readable usernames in one click. Presets, history, favorites, 8 languages, dark mode. Works fully offline.` (115 chars) |
| Category | Productivity |
| Language | English |
| Single purpose | `Generate random usernames and copy them to the clipboard.` |

---

## 5. Privacy practices tab

| Question | Answer |
|---|---|
| Does the extension collect user data? | **No** |
| Remote code | **No** |
| Uses `eval()` | **No** |
| Sells data to third parties | **No** |
| Uses data for purposes unrelated to single purpose | **No** |
| Uses data to determine creditworthiness | **No** |

Permission justification:

```
storage — Saves username history, favorites, and display preferences locally, and keeps
favorites and preferences in sync across the user's own devices. No other permissions are
requested.
```

---

## 6. Verify before submitting

- [ ] `npm test` — 38/38 pass
- [ ] `npm run package` — zip builds, 23 files, manifest assets verified
- [ ] Load the **zip** (not the folder) into `chrome://extensions` and smoke test
- [ ] Toolbar icon opens the popup (not a new tab)
- [ ] Generate / Copy / Auto-copy work
- [ ] `More options & history →` opens the full page
- [ ] History does **not** grow when dragging the length slider
- [ ] All 8 languages render (check `繁體中文` and `Deutsch`)
- [ ] Dark mode renders correctly in popup and full page
- [ ] JSON export produces a file; JSON import merges without duplicates
- [ ] Favorites survive a browser restart
- [ ] No console errors on either page
- [ ] `manifest.json` version matches `package.json` (1.2.0)
- [ ] `CHANGELOG.md` has a 1.2.0 entry

---

## 7. Submission

1. <https://chrome.google.com/webstore/devconsole> → **New item**
2. Upload `dist/username-generator-1.2.0.zip`
3. Fill **Store listing** from step 4, upload screenshots from step 2
4. Fill **Privacy practices** from step 5, add the policy URL from step 3
5. Set **Visibility**: Public
6. Set **Distribution**: All regions
7. **Submit for review**

Typical review time: a few hours to 3 business days. Initial review of a new
extension often takes longer than updates.

---

## 8. After approval

- [ ] Tag the release: `git tag -a v1.2.0 -m "Chrome Web Store 1.2.0" && git push origin v1.2.0`
- [ ] Add the Store link to `README.md`
- [ ] Watch the GitHub issue tracker for feedback

---

## Known review risks

| Risk | Mitigation |
|---|---|
| "storage" permission looks broad | Justification explains history, favorites, sync |
| Name contains a hyphen and extra words | Within 45-char limit, no trademark issue, no keyword stuffing |
| Sync storage might be questioned | Listing states history stays local; only favorites/preferences sync |
| Screenshots show English + Chinese | Acceptable; demonstrates the localization claim |
