#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="${DIST_DIR:-$ROOT_DIR/dist}"
VERSION="$(sed -n 's/.*"version": "\(.*\)".*/\1/p' "$ROOT_DIR/manifest.json" | head -n1)"
PACKAGE_NAME="smart-toc-scroll-${VERSION}.zip"
STAGING_DIR="$DIST_DIR/package/smart-toc-scroll-${VERSION}"
PACKAGE_PATH="$DIST_DIR/$PACKAGE_NAME"

if [[ -z "$VERSION" ]]; then
  echo "Unable to read version from manifest.json" >&2
  exit 1
fi

rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR" "$DIST_DIR"

cp "$ROOT_DIR/manifest.json" "$STAGING_DIR/"
cp "$ROOT_DIR/catalog.js" "$STAGING_DIR/"
cp "$ROOT_DIR/theme.js" "$STAGING_DIR/"
cp "$ROOT_DIR/toc.css" "$STAGING_DIR/"
cp "$ROOT_DIR/themes.css" "$STAGING_DIR/"
cp "$ROOT_DIR/options.html" "$STAGING_DIR/"
cp "$ROOT_DIR/options.css" "$STAGING_DIR/"
cp "$ROOT_DIR/options.js" "$STAGING_DIR/"
cp "$ROOT_DIR/LICENSE" "$STAGING_DIR/"
cp "$ROOT_DIR/README.md" "$STAGING_DIR/"
cp "$ROOT_DIR/CHANGELOG.md" "$STAGING_DIR/"
cp -R "$ROOT_DIR/icons" "$STAGING_DIR/"

rm -f "$PACKAGE_PATH"
(
  cd "$STAGING_DIR"
  zip -qr "$PACKAGE_PATH" ./*
)

echo "$PACKAGE_PATH"
