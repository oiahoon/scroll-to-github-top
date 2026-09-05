#!/bin/bash

set -euo pipefail

SOURCE_FILE="icons/icon-source.png"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Missing source icon: $SOURCE_FILE"
  exit 1
fi

# Create the icons directory.
mkdir -p icons

# Export transparent logo and Chrome extension icon sizes from the selected
# abstract reading-position mark source.
cp "$SOURCE_FILE" icons/logo.png
sips -z 1024 1024 "$SOURCE_FILE" --out icons/logo1024.png
sips -z 512 512 "$SOURCE_FILE" --out icons/logo512.png
sips -z 16 16 "$SOURCE_FILE" --out icons/icon16.png
sips -z 32 32 "$SOURCE_FILE" --out icons/icon32.png
sips -z 48 48 "$SOURCE_FILE" --out icons/icon48.png
sips -z 128 128 "$SOURCE_FILE" --out icons/icon128.png

# Keep extension, website and store listing exports in sync.
mkdir -p website/public/brand output/chrome-store-icons
cp icons/icon128.png website/public/brand/icon128.png
cp icons/icon128.png website/public/brand/icon128-v218.png
cp icons/logo512.png website/public/brand/logo512.png
cp icons/icon128.png output/chrome-store-icons/chrome-store-icon-128.png
echo "Extension, website and store icon exports updated."
