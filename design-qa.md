# Barcode Preview — Design QA

## v2.15 五主题 UI/UX 打磨与发布验收（2026-08-27）

### Target flow

`测试长文 / Options → 选择、悬停或聚焦导航主题 → 得到差异明确、可读、自适应且键盘可用的导航状态`

### Audit steps

| Step | Experience | Result | Health |
|---|---|---|---|
| 1 | Standard：局部明暗采样、条目数、当前章节、移动底部面板 | Passed | 73 项；390 × 844 面板宽 358px；无横向溢出 |
| 2 | Wheel：柔和焦点带、邻项密度、左右镜像 | Passed | 4 个左右/明暗组合均位于视口内 |
| 3 | Spotlight：五行上下文、当前项层级、邻项渐隐 | Passed | 4 个左右/明暗组合均位于视口内 |
| 4 | GPT：OUTLINE 标题、数量、当前位置、内部滚动与键盘 | Passed | 73 项；唯一 Tab 停靠点；ArrowDown 19 → 20 |
| 5 | SSPAI：固定按钮、红色当前项、刻度稳定、Esc 释放 | Passed | 图钉 fill 为主题红；固定后移开仍展开，Esc 后收起 |
| 6 | Options：四主题 2 × 2 选择器、焦点态、响应式高度 | Passed | 1280 × 900 控件完全落在行内；390 × 844 无横向溢出，保存按钮 44px |

### Matrix and evidence

- Desktop theme matrix: Standard / Wheel / Spotlight / GPT / SSPAI × left / right × light / dark，共 20 个展开状态，全部通过存在、展开、视口内、正确侧边和无横向溢出检查。
- Current-run screenshots: `/private/tmp/smart-toc-v215-audit/13-standard-expanded-after.png` 至 `/private/tmp/smart-toc-v215-audit/20-options-desktop-after.png`。
- Generated visual system reference: `/Users/huangyuyao/.codex/generated_images/01a04309-3155-72e1-9e70-491ab671004f/exec-03dcaba8-874a-429e-b0a0-d990d50619ce.png`。
- Browser console: theme, settings and interaction checks produced no warning or error.

## Final result

final result: passed

---

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

---

## v2.14 全主题与移动设置页复核（2026-08-27）

### Scope

- Live themes: Standard, Wheel, Spotlight, GPT, SSPAI
- Theme states: light / dark; rail positions: left / right where applicable
- Options viewport: 1280 × 800 and 390 × 844
- Browser evidence: `/private/tmp/smart-toc-audit/18-options-standard-desktop-after.png`, `/private/tmp/smart-toc-audit/23-options-barcode-mobile-after.png`, and the five website mode captures under `website/public/product/`

### Findings and fixes

| Check | Result | Evidence |
|---|---|---|
| All five navigation experiences render with current styling | Passed | Dedicated current captures were produced for Standard, Wheel, Spotlight, GPT, and SSPAI |
| Barcode preview switching works | Passed | Wheel / Spotlight / GPT / SSPAI controls update the active state and preview |
| SSPAI pin state remains visible and reachable | Passed | Pin label and active styling remain legible on both sides and both themes |
| Mobile settings layout remains readable | Passed | Fixed row heights were removed; controls no longer overlap at 390 px |
| Mobile save action remains reachable | Passed | Footer follows document flow and the 44 px save button remains visible after scrolling |
| Console health | Passed | No application warning or error during theme, route, and control interaction checks |

## Final result

final result: passed

---

## SSPAI / 固定大纲（2026-08-12）

### Scope

- Reference expanded: `/var/folders/0f/6sngn17x1xx3y65117n2md3r0000gp/T/codex-clipboard-53df2570-572c-4020-901a-13c9d1b0ad76.png`
- Reference idle: `/var/folders/0f/6sngn17x1xx3y65117n2md3r0000gp/T/codex-clipboard-d1b84939-dfcc-4754-9c8b-2e147f26051f.png`
- Implementation expanded: browser-verified local SSPAI test page
- Primary QA viewport: 1280 × 720
- Tested state: Barcode / SSPAI, right and left rail, dark and light surface, 73 TOC rows

### Comparison

| Check | Result | Evidence |
|---|---|---|
| Idle is reduced to vertical ticks | Passed | Labels have zero visible width and opacity; each bar measures 2 × 6px |
| Hover expands the outline in place | Passed | The container keeps a stable edge anchor; rows become 33px without opening a detached panel |
| Typography remains compact and readable | Passed | 13px labels use 21px line-height, single-line ellipsis and 14px inner spacing |
| Current section uses SSPAI red | Passed | Exactly one active row uses `#e6242f` for both label and 2 × 21px bar |
| Pin keeps the outline open | Passed | Native button changes to `aria-pressed=true`; pointer leave preserves the visible labels |
| Unpin restores idle state | Passed | Button returns to `aria-pressed=false`; pointer leave hides all labels while the tick anchor remains fixed |
| Tick/text order matches the reference | Passed | Right rail uses tick then text; left rail mirrors to text then tick |
| Tick anchor remains stable | Passed | Hover changes label opacity and row height without changing the tick's horizontal coordinate; idle transparent space does not capture page clicks |
| Light/dark surfaces remain readable | Passed | Both sampled surfaces preserve label contrast and the same red active state |
| Long outlines remain bounded | Passed | 73 rows reuse the existing rail scroll viewport and do not overflow the browser viewport |
| Settings hierarchy is correct | Passed | SSPAI appears as the fourth Barcode-only preview option and persists through the existing settings path |
| Keyboard and accessible state | Passed | Pin exposes a dynamic accessible name, `aria-pressed`, focus-visible styling and Escape release |
| Reduced-motion coverage | Passed | The existing `.github-toc *` override disables all SSPAI transitions and animations |
| Navigation state | Passed | Clicking a title scrolls to the target, assigns the only active/`aria-current` row and keeps the red indicator aligned |
| Console health | Passed | Fresh pin, unpin, title jump and settings runs report no warning or error |

### Source alignment

The live article assets were inspected before implementation. SSPAI's current directory uses 244px title content, 15px source text, 33px expanded rows, 2 × 6px idle ticks, 2 × 21px expanded ticks, a brand-red active state, and a pin-controlled `pinned` wrapper state. The extension keeps those structural behaviors while using 13px labels to fit its denser cross-site TOC sample and existing rail proportions.

## Final result

final result: passed
