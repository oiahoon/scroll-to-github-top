# Chrome Store Icon Assets

These assets capture the water-rise scroll-to-top direction for Chrome Store and
release materials.

## Chrome Web Store Upload Icon

- `chrome-store-icon-128.png`
  - Store icon for the Chrome Developer Dashboard upload field.
  - 128x128 PNG, generated directly from Codex artwork with a light badge
    background, clear 96px-scale central symbol, and quiet edge padding.
  - Use this for the Web Store listing icon instead of the transparent toolbar
    icon if a more finished store presentation is desired.

Source candidates:

- `store-icon-candidate-01-source.png`
  - Selected source for `chrome-store-icon-128.png`.
- `store-icon-candidate-02-source.png`
- `store-icon-candidate-03-source.png`

## Final Chrome-Compliant Mark

- `chrome-compliant-03-source.png`
  - Codex-generated chroma source for the selected symbol mark.
- `chrome-compliant-03-transparent.png`
  - True transparent intermediate after chroma background removal.
- `chrome-compliant-03-1024.png`
  - Selected transparent source used for `icons/icon-source.png`, `icons/logo.png`, and `icons/logo1024.png`.
- `chrome-compliant-03-512.png`
  - Selected 512px logo export.
- `chrome-compliant-03-16.png`, `chrome-compliant-03-32.png`, `chrome-compliant-03-48.png`, `chrome-compliant-03-128.png`
  - Selected Chrome extension icon exports.

The `chrome-compliant-01-*` and `chrome-compliant-02-*` files are alternate
Codex-generated directions kept for comparison. The selected `03` direction has
the clearest small-size silhouette and avoids using a page/card illustration as
the icon itself.

To prepare a new chroma-source image, run:

```bash
node scripts/prepare-icon-assets.mjs <source.png> output/chrome-store-icons/<name>
```

## Previous Transparent Mark

- `water-rise-mark-compact-green-source.png`
  - Chroma-key source used to create the transparent mark.
- `water-rise-mark-compact-transparent.png`
  - Transparent intermediate after background removal.
- `water-rise-mark-compact-1024.png`
  - Final transparent 1024px source export.
- `water-rise-mark-compact-512.png`
  - Final transparent 512px logo export.

The final mark also has standard Chrome extension sizes:

- `water-rise-mark-compact-16.png`
- `water-rise-mark-compact-32.png`
- `water-rise-mark-compact-48.png`
- `water-rise-mark-compact-128.png`

## Exploration Assets

The older `water-rise-icon-*` files are exploration images and retain background
composition details. They should not be used as the extension icon source.
