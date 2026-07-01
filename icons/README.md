# Icon Assets

The current icon and logo use a Chrome-compliant water-rise mark: a compact TOC
rail paired with a scroll-to-top ripple arrow on a true transparent background.
The artwork is a standalone symbol, not a page/card illustration, with enough
padding to keep the 128px Web Store icon and 16px toolbar icon readable.

- `logo.png` is the large transparent logo artwork.
- `logo512.png` and `logo1024.png` are standard logo exports for store and marketing use.
- `icon-source.png` is the transparent source image used for extension icon exports.
- `icon16.png`, `icon32.png`, `icon48.png`, and `icon128.png` are the Chrome extension icons referenced by `manifest.json`.
- `icon.svg` is a legacy vector source and is not the current visual source.

The selected source came from:

```text
output/chrome-store-icons/chrome-compliant-03-1024.png
```

To regenerate the extension icon sizes from the selected artwork, run:

```bash
./generate_icons.sh
```
