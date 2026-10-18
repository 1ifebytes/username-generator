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

## 3. Privacy policy hosting — done ✅

GitHub Pages is enabled (source: `master` branch, `/docs` folder) and the page is live:

```
https://1ifebytes.github.io/username-generator/privacy.html
```

Verified: HTTP 200, renders in light and dark colour schemes.

`docs/_config.yml` excludes internal notes and product docs, so only the privacy
policy is published (`_CONTEXT.md`, `PRD.md`, `iOS-App-Analysis.md` return 404).

Paste the URL above into the Store listing's **Privacy policy** field.

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

### First decide: new item, or update an existing one?

Open <https://chrome.google.com/webstore/devconsole> and look at the item list.

| What you see | What to do |
|---|---|
| The list is empty, or shows "Add new item" | **First publication.** Click **Add new item**, upload the zip, fill everything in. |
| An existing *Username Generator* item with status Published / Unlisted | **Update.** Open that item → left sidebar **Package** → **Upload new package** → upload the zip. Do **not** create a second item. |

The dashboard only accepts a package whose `manifest.json` version is **higher**
than the currently published one. Ours is `1.2.0`, so it works for both a first
upload and an update from `1.0.x` / `1.1.x`.

### Steps (identical for both paths once the package is uploaded)

1. <https://chrome.google.com/webstore/devconsole>
2. **Add new item** (first release) *or* open the existing item → **Package → Upload new package** (update)
3. Upload `dist/username-generator-1.2.0.zip`
4. **Store listing** tab — paste from `store/listing-en.md`:
   - Name, short description, detailed description, category, language
   - Upload `store/screenshots/01-light-en.png` … `04-zh-tw.png` (order matters, 1–5 allowed)
   - Upload `store/screenshots/promo-440x280.png` as the small promo tile
   - Store icon: `chrome-extension/icon.png` (128×128)
5. **Privacy practices** tab:
   - Single purpose: `Generate random usernames and copy them to the clipboard.`
   - Data usage: everything **No** (no collection, no remote code, no eval)
   - Permission justification: `storage — Saves username history, favorites, and display preferences locally, and keeps favorites and preferences in sync across the user's own devices. No other permissions are requested.`
   - Privacy policy URL: the GitHub Pages link from step 3
6. **Distribution** tab: Visibility **Public**, Regions **All regions**
7. **Submit for review**

Typical review time: a few hours to 3 business days. First review of a new
extension usually takes longer than updates.

### If review comes back with a request for changes

1. Fix the code, bump the version in **both** `manifest.json` and `package.json` (e.g. `1.2.1`)
2. `npm test && npm run package`
3. Upload the new zip to the **same** item
4. `git tag v1.2.1 && git push origin v1.2.1` (never move an existing tag)
5. Reply to the review message, then **Submit for review** again

---

## 8. After approval

- [x] Tag the release (`v1.2.0` already pushed)
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
