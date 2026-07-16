# Smart TOC & Scroll Website Design QA

## Comparison target

- Source visual truth:
  - `../output/chrome-store/01-standard-toc-panel.png`
  - `../output/chrome-store/02-right-rail-hover-preview.png`
  - `../output/chrome-store/03-left-rail-hover-preview.png`
  - `../output/chrome-store/04-light-page-adaptive-rail.png`
  - `../output/chrome-store/05-options-reading-navigation.png`
- Rendered implementation: `http://localhost:4174/scroll-to-github-top/`
- Browser-rendered screenshot evidence: `/private/tmp/smart-toc-lighthouse-final.json` (`audits.final-screenshot.details.data`) plus the Chrome DevTools full-page, viewport, and focused-node captures from this QA run.
- Viewports: 1280 × 800 desktop, 1440 × 1000 desktop, and 390 × 844 mobile.
- States: home light, home dark, mobile navigation open, all six routes, 404, mode selectors, theme toggle, and FAQ expanded.

## Full-view comparison evidence

The current 2.13 Barcode screenshot and the rendered hero product image were opened in the same comparison input at the same 1280 × 800 desktop state. The final implementation preserves the source image without redrawing, relabeling, or obscuring it. The surrounding website continues the source system: cool off-white and near-black surfaces, restrained blue accent, system UI typography, compact radii, thin borders, and low-intrusion controls.

The full homepage was also inspected in light and dark themes. The page hierarchy remains clear, product imagery is sharp, and the call-to-action remains visible without competing with the extension interface.

## Focused region comparison evidence

Focused comparison was required for the hero product visual because it contains the product-specific typography, rail geometry, current-section label, and back-to-top control. The final focused node capture retains the complete 16:10 source crop, unmodified text, rail position, bar lengths, active line, preview label, and back-to-top control.

The Options screenshot and left/right rail screenshots are reused directly on Features and Modes, so there are no generated or code-drawn substitutes to compare.

## Required fidelity surfaces

- Fonts and typography: passed. The site uses the extension's system-font stack rather than an unrelated remote display font. Chinese and Latin copy keep clear weight and line-height hierarchy at desktop and mobile sizes.
- Spacing and layout rhythm: passed. Desktop sections use a consistent 1180 px shell; cards, frames, navigation, footer, and mobile menu align to the same spacing scale. No horizontal overflow was found at 1440, 1280, 500, or 390 px.
- Colors and visual tokens: passed. Light and dark surfaces, blue actions, muted copy, borders, and state colors map to the existing options and rail visual language. The light-theme accent was darkened during QA to pass small-text contrast.
- Image quality and asset fidelity: passed. All product images are original 1280 × 800 PNG assets from the current extension; no CSS art, placeholder illustration, handcrafted SVG, or generated substitute is used.
- Copy and content: passed. Feature names, two navigation types, Wheel / Spotlight / GPT behavior, keyboard commands, permissions, local processing, SPA support, and version 2.13 were checked against `manifest.json`, `README.md`, `FEATURE_INVENTORY.md`, and the current screenshots.

## Interaction and browser checks

- Desktop and mobile navigation: passed.
- Direct routes `/`, `/features`, `/modes`, `/guide`, `/privacy`, and `/support`: passed with HTTP 200; unknown routes retain HTTP 404.
- Theme toggle and local persistence: passed.
- Home mode tabs and Barcode selector: passed.
- FAQ disclosure: passed.
- Broken loaded images: none.
- Browser console errors: none.
- Production build route metadata: passed.
- Lighthouse: Performance 97, Accessibility 100, Best Practices 100, SEO 100; LCP 2.6 s, CLS 0, TBT 0 ms.

## Comparison history

### Iteration 1

- [P2] The hero image was rotated and the status caption overlapped the lower-right source UI.
  - Fix: removed the transform and moved the caption into normal flow below the product frame.
  - Post-fix evidence: the focused 1280 × 800 comparison shows the full unrotated source crop with the rail and back-to-top control unobscured.
- [P2] A Google Fonts request introduced visual and runtime drift from the extension's system typography.
  - Fix: removed the remote font import and matched the existing system-font stack.
- [P2] All routes initially shared one document title and description.
  - Fix: added route-specific titles and descriptions, confirmed on the production preview.

### Iteration 2

- [P1] Lighthouse found 4.07–4.37:1 contrast on small blue eyebrow and link text in the light theme.
  - Fix: changed the light-theme accent from `#2f7cc4` to `#2169aa` and its strong token to `#17558b`.
  - Post-fix evidence: Lighthouse accessibility improved from 96 to 100 with no remaining contrast audit failure.

### Iteration 3

- [P1] GitHub Pages initially served known SPA routes with an HTTP 404 status through the generic fallback.
  - Fix: added deterministic static entry points for every known route during the production build while preserving `404.html` for unknown paths.
  - Post-fix evidence: a static-server check returned HTTP 200 for `/`, `/features`, `/modes`, `/guide`, `/privacy`, and `/support`, and HTTP 404 for `/does-not-exist`.

### Iteration 4

- [P1] GitHub Pages redirects static route directories to trailing-slash URLs, and the router can expose either basename-prefixed or basename-relative paths; this initially caused known pages to inherit the 404 document title and description.
  - Fix: removed the configured Vite basename when present, then normalized trailing slashes before resolving route metadata.
  - Post-fix evidence: deployed direct routes render their page-specific title, heading, images, and responsive layout without horizontal overflow.

## Findings

No actionable P0, P1, or P2 differences remain.

## Open questions

None for the requested GitHub Pages release. Chrome Web Store listing publication remains a separate release channel and is not implied by the website deployment.

## Implementation checklist

- [x] Current product screenshots and design language preserved.
- [x] Six requested product/support pages implemented.
- [x] Desktop, mobile, light, dark, and interaction states verified.
- [x] Accessibility and dependency audit issues resolved.
- [x] GitHub Pages build, static route entry points, and unknown-route fallback configured.

## Follow-up polish

- [P3] A future release could add dedicated current screenshots for Spotlight and GPT instead of representing those modes through verified copy and the shared Barcode screenshot.

final result: passed
