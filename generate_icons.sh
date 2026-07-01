#!/bin/bash

SOURCE_FILE="icons/icon-source.png"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "Missing source icon: $SOURCE_FILE"
  exit 1
fi

# Create the icons directory.
mkdir -p icons

# Export transparent logo and Chrome extension icon sizes from the selected
# water-rise mark source.
cp "$SOURCE_FILE" icons/logo.png
cp "$SOURCE_FILE" icons/logo1024.png
sips -z 512 512 "$SOURCE_FILE" --out icons/logo512.png
sips -z 16 16 "$SOURCE_FILE" --out icons/icon16.png
sips -z 32 32 "$SOURCE_FILE" --out icons/icon32.png
sips -z 48 48 "$SOURCE_FILE" --out icons/icon48.png
sips -z 128 128 "$SOURCE_FILE" --out icons/icon128.png

echo "Icons generated in icons directory:"
ls -l icons/
