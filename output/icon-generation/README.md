# Icon Generation Notes

Generated with Codex image generation for the Smart TOC and scroll utility extension.

## Boards

- `icon-board-product-routes.png` explores product-led icon routes: side TOC rail, hover preview, active section, adaptive light/dark surfaces, and scroll-to-top affordance.
- `icon-board-symbol-routes.png` explores more abstract symbol routes: compact rails, section markers, upward return gestures, focus rings, and quiet document navigation marks.

## Recommended Direction

The strongest direction is the side-rail plus active-section mark: it reads clearly at small sizes, maps directly to the extension's persistent TOC behavior, and avoids looking like a generic upload, menu, or document app icon.

For a final Chrome extension icon, prefer:

- A white or near-white base with graphite lines and one restrained blue accent.
- A single vertical rail on either edge plus one highlighted section line.
- Minimal depth and soft edge treatment, but no heavy glassmorphism at 16px.
- No text, no source-site references, and no platform-specific marks.

## Next Step

Select one or two candidates from the boards, then convert the chosen route into a deterministic SVG master and export the Chrome extension sizes: 16, 32, 48, and 128 px.
