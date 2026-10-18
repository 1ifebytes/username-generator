#!/usr/bin/env bash
#
# Build a Chrome Web Store ready zip from chrome-extension/.
# Usage: npm run package   (or: bash scripts/package.sh)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(node -p "require('./chrome-extension/manifest.json').version")"
OUT_DIR="$ROOT_DIR/dist"
OUT_FILE="$OUT_DIR/username-generator-${VERSION}.zip"

if [ ! -f chrome-extension/manifest.json ]; then
    echo "error: chrome-extension/manifest.json not found" >&2
    exit 1
fi

# Fail fast if the manifest points at files that do not exist.
node -e '
const fs = require("fs");
const path = "chrome-extension/";
const manifest = JSON.parse(fs.readFileSync(path + "manifest.json", "utf8"));
const required = [
    manifest.action && manifest.action.default_popup,
    ...Object.values((manifest.action && manifest.action.default_icon) || {}),
    ...Object.values(manifest.icons || {})
].filter(Boolean);

const missing = required.filter(file => !fs.existsSync(path + file));
if (missing.length) {
    console.error("error: manifest references missing files: " + missing.join(", "));
    process.exit(1);
}
console.log("manifest assets verified (" + required.length + " files)");
'

mkdir -p "$OUT_DIR"
rm -f "$OUT_FILE"

# Only ship runtime files. Dev harnesses (test.html) and docs stay out.
(
    cd chrome-extension
    zip -q -r "$OUT_FILE" \
        manifest.json \
        page.html \
        popup.css \
        popup.js \
        popup-quick.html \
        popup-quick.css \
        popup-quick.js \
        icon.png \
        icons \
        modules \
        -x "*.DS_Store" "*__MACOSX*"
)

echo
echo "built: dist/username-generator-${VERSION}.zip"
unzip -Z1 "$OUT_FILE" | grep -v '/$' | sort | sed 's/^/  /'
echo
echo "files: $(unzip -Z1 "$OUT_FILE" | grep -vc '/$')"
echo "size:  $(ls -lh "$OUT_FILE" | awk '{print $5}')"
