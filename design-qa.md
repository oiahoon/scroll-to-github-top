# Barcode GPT — Design QA

## Scope

- Reference idle: `/var/folders/0f/6sngn17x1xx3y65117n2md3r0000gp/T/codex-clipboard-2dbf5a19-4d04-4299-9361-550033c76b12.png`
- Reference expanded: `/var/folders/0f/6sngn17x1xx3y65117n2md3r0000gp/T/codex-clipboard-086073d0-b86c-43a6-8632-3d1b74e6ce90.png`
- Implementation expanded: `/private/tmp/smart-toc-v213-gpt.png`
- Implementation options: `/private/tmp/smart-toc-v213-options.png`
- QA viewport: 1280 × 720
- Tested state: Barcode / GPT, right and left rail, dark and light surface, 73 TOC rows

## Comparison

| Check | Result | Evidence |
|---|---|---|
| Idle remains a minimal barcode | Passed | GPT test page shows only transparent rail and short bars before interaction |
| Hover expands into a bordered surface | Passed | 320px wide, up to 446px high, 16px radius, 1px adaptive border |
| Panel resembles the supplied ChatGPT directory | Passed | High-opacity charcoal surface, compact rows, subtle current-row fill, thin scrollbar |
| Complete outline is available | Passed | 73 of 73 TOC items are created once in `.toc-gpt-preview-list` |
| Long outline scrolls inside the panel | Passed | Panel list height is bounded and scroll position updates independently |
| Current item is revealed and highlighted | Passed | Item 18 is automatically visible and receives the only `.is-current` state |
| Left/right layouts mirror | Passed | Right rail opens left; left rail opens right with mirrored transform origin |
| Light/dark surfaces remain readable | Passed | Dark uses `rgba(48, 48, 48, 0.97)`; light uses `rgba(255, 255, 255, 0.97)` |
| Settings hierarchy is correct | Passed | GPT appears beside Wheel and Spotlight only when Barcode is selected |
| Existing Barcode previews regressions | Passed | Wheel retains 73-row track; Spotlight retains 35 visible rows in sample and no title border |
| Reduced-motion CSS coverage | Passed | GPT panel and descendants are included in the existing reduced-motion override |
| Keyboard focus model | Passed | 73 rows expose exactly one Tab stop; ArrowDown moves current/focus from item 18 to 19 |
| Animation responsiveness | Passed | rail wave transform / opacity respond in 90ms and avoid transition-all |
| Runtime performance | Passed | Scroll avg 0.02ms; Rail Pointer avg 0.07ms; Adaptive Theme avg 0.98ms, max 2.30ms |
| Console health | Passed | Wheel, Spotlight, GPT and Options report no app warning/error |

## Interaction notes

- A 16px bridge plus 96ms pointer-exit grace prevents the rail-to-panel gap from closing the panel during normal cursor movement.
- Browser QA uses a rail click to establish the same expanded state because the automation surface does not expose hover directly. The blue ring visible around the selected bar is the deliberate `:focus-visible` accessibility state, not the normal pointer-hover treatment.
- GPT uses roving tabindex: hidden rows and non-current visible rows stay at `-1`; the current row is the sole `0` entry and supports Arrow / Home / End navigation.

## Final result

final result: passed
