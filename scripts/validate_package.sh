#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGE_FILE="${1:-}"

if [[ -z "$PACKAGE_FILE" ]]; then
  PACKAGE_FILE="$("$ROOT_DIR/scripts/package_extension.sh")"
elif [[ "$PACKAGE_FILE" != /* ]]; then
  PACKAGE_FILE="$ROOT_DIR/$PACKAGE_FILE"
fi

if [[ ! -f "$PACKAGE_FILE" ]]; then
  echo "Package does not exist: $PACKAGE_FILE" >&2
  exit 1
fi

for script in catalog.js theme.js options.js; do
  node --check "$ROOT_DIR/$script"
done

bash -n "$ROOT_DIR/package.sh"
bash -n "$ROOT_DIR/scripts/package_extension.sh"
bash -n "$ROOT_DIR/scripts/validate_package.sh"
unzip -tq "$PACKAGE_FILE"

EXPECTED_VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
PACKAGED_VERSION="$(unzip -p "$PACKAGE_FILE" manifest.json | node -e '
  let input = "";
  process.stdin.on("data", chunk => { input += chunk; });
  process.stdin.on("end", () => {
    const manifest = JSON.parse(input);
    if (manifest.manifest_version !== 3) {
      throw new Error(`Expected Manifest V3, received ${manifest.manifest_version}`);
    }
    process.stdout.write(manifest.version || "");
  });
')"

if [[ "$PACKAGED_VERSION" != "$EXPECTED_VERSION" ]]; then
  echo "Packaged version $PACKAGED_VERSION does not match manifest version $EXPECTED_VERSION." >&2
  exit 1
fi

required_files=(
  manifest.json
  catalog.js
  theme.js
  toc.css
  themes.css
  options.html
  options.css
  options.js
  icons/icon16.png
  icons/icon32.png
  icons/icon48.png
  icons/icon128.png
)

PACKAGE_CONTENTS="$(unzip -Z1 "$PACKAGE_FILE")"
for required_file in "${required_files[@]}"; do
  if ! grep -Fxq "$required_file" <<< "$PACKAGE_CONTENTS"; then
    echo "Packaged extension is missing: $required_file" >&2
    exit 1
  fi
done

if grep -Eq '(^|/)(\.DS_Store|__MACOSX|\.git)(/|$)' <<< "$PACKAGE_CONTENTS"; then
  echo "Package contains development or macOS metadata files." >&2
  exit 1
fi

echo "Validated Smart TOC & Scroll $PACKAGED_VERSION: $PACKAGE_FILE"
