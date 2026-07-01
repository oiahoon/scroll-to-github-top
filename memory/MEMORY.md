# Smart TOC & Scroll — Agent Memory

## Project Overview
- Chrome extension, Manifest v3, injects into all pages
- Key files: `catalog.js`, `theme.js`, `toc.css`, `themes.css`, `options.html`, `options.css`
- Design spec: `UI_DESIGN_SPEC.md`; Feature inventory: `FEATURE_INVENTORY.md`
- Current release line: v2.5
- Active branch context: `codex/toc-rail-preview-hover`

## Architecture Notes
- `themes.css` defines CSS custom properties per `.theme-*` class on `#github-toc`
- `toc.css` is the main component stylesheet, consumes CSS variables from `themes.css`
- `theme.js` reads page background and adds a `.theme-*` class to `#github-toc` and `#github-sst`
- `--toc-backdrop-filter` variable defined in theme classes, applied by `.github-toc` in `toc.css`
- 独立回顶按钮 `#github-sst` 现在由 `catalog.js` 创建并参与主注入流程
- 独立回顶按钮历史上曾拆分为 `button.js`，现已并回 `catalog.js`
- `阅读进度目录` 使用透明 rail，不给目录容器本体增加面板背景
- `.toc-rail-preview` 是 `document.body` 下的 fixed layer，不是 `#github-toc` 子节点；这是为了避开 transform ancestor 改变 fixed 定位参照导致的错位
- 阅读进度 rail 局部自适应配色在 `catalog.js` 中采样 rail 附近 surface，并将轻量 CSS 变量应用到 `tocContainer`、`scrollTopButton` 和 `tocRailPreview`
- 阅读进度 hover wave 只更新可视区域附近 item，预计算基础宽度，避免 pointer move 时全量布局读写
- `.toc-rail-link` 必须保持 `overflow: visible`，否则右侧 rail 向左延展时圆角端会被裁切成平角
- 阅读进度独立回顶按钮使用 `.visible` + `.is-near` + `.is-hovered` 状态：远处几乎透明，桌面 idle 不启用 pointer events 以避免不可见点击遮挡，指针接近时显形并播放轻微水面/箭头回弹，坐标命中/hover/focus-visible 用柔和 accent surface 停止跳动并进入稳定选中态；默认/接近态不显示硬圆形边框
- 正式 Chrome icon/logo 使用 Codex 生成的符号化 water-rise mark，而不是直接缩放页面/卡片插画；当前选中源为 `output/chrome-store-icons/chrome-compliant-03-1024.png`，同步到 `icons/icon-source.png`、`icons/logo*.png` 和 manifest 引用的 `icons/icon16/32/48/128.png`
- Chrome Web Store 上传图标单独使用 `output/chrome-store-icons/chrome-store-icon-128.png`：128x128 PNG，Codex 直接生成的 light badge 展示版，不等同于 manifest 的透明 toolbar icon
- 本地视觉/性能测试页：`test-pages/rail-hover-performance.html?position=right&surface=lightstrip`
  - `position=left/right` 用于检查镜像展开和预览方向
  - `surface=light/dark/color/lightstrip` 用于检查局部自适应配色
  - 测试页会清理旧注入 DOM，并对本地 CSS/JS 加 cache busting，避免浏览器残留影响判断

## v2.5 Reading Progress Rail Polish — Completed (2026-06-30)
- Manifest version bumped to `2.5`
- Reading progress hover behavior extends the active bar outward without moving the rail container
- Left rail expands/previews to the right; right rail expands/previews to the left
- Preview bubble is body-level fixed positioning and stays aligned to the hover item center
- Local adaptive tokens keep rail/preview readable on dark, light, colored, and lightstrip surfaces without over-adjusting the page
- Hover cleanup hides previews and removes stale `.is-previewed` state on rerender
- The flat-cap bug was fixed by allowing rail link overflow to remain visible

## Task #4 (themes.css + theme.js refactor) — COMPLETED
- theme.js: replaced text-color-frequency detection with direct background-color read
  - Priority: body bg → html bg → color-scheme attr → prefers-color-scheme → fallback L=100
  - L > 60 → theme-dark (dark overlay on light page); L <= 60 → theme-light
  - Removed 3-color-theme branches; selectTheme() now only outputs theme-light or theme-dark
- Replaced 5 flat-color themes with frosted glass system in themes.css
- `theme-light`: rgba(255,255,255,0.88) + blur(16px) — for dark/mid-color pages
- `theme-dark`: rgba(30,30,30,0.82) + blur(16px) — for light-background pages
- `theme-auto`: new, follows OS prefers-color-scheme
- `theme-blue/green/purple`: kept as CSS classes mapping to `theme-dark` variables (backward compat)
- Added new variables per theme: `--toc-bg-expanded`, `--toc-bg-fallback`, `--toc-backdrop-filter`, `--toc-text-muted`, `--toc-accent`, `--toc-border`, `--toc-border-hover`, `--toc-divider`, `--toc-elevation-rest`, `--toc-elevation-press`
- Added global animation variables: `--ease-expand`, `--ease-collapse`, `--ease-content`, `--ease-standard`, duration vars
- `toc.css` updated: added `-webkit-backdrop-filter` + `backdrop-filter`, border, transparent backgrounds on `.toc-tree` and `.toc-list`

## Conventions
- Use Chinese comments where existing code uses Chinese
- No new dependencies without asking
- All CSS variable references must be correct across all theme classes
