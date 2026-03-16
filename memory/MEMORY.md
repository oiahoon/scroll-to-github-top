# Smart TOC & Scroll — Agent Memory

## Project Overview
- Chrome extension, Manifest v3, injects into all pages
- Key files: `catalog.js`, `theme.js`, `toc.css`, `themes.css`, `options.html`, `options.css`
- Design spec: `UI_DESIGN_SPEC.md`; Feature inventory: `FEATURE_INVENTORY.md`
- Current refactor branch: v2.3

## Architecture Notes
- `themes.css` defines CSS custom properties per `.theme-*` class on `#github-toc`
- `toc.css` is the main component stylesheet, consumes CSS variables from `themes.css`
- `theme.js` reads page background and adds a `.theme-*` class to `#github-toc` and `#github-sst`
- `--toc-backdrop-filter` variable defined in theme classes, applied by `.github-toc` in `toc.css`
- 独立回顶按钮 `#github-sst` 现在由 `catalog.js` 创建并参与主注入流程
- 独立回顶按钮历史上曾拆分为 `button.js`，现已并回 `catalog.js`

## v2.3 Refactor — In Progress (2026-03-16)
- 主体 UI、主题系统与 options 页面已重构
- 独立回顶按钮已重新整合到主注入流程
- 仍需收口版本号、manifest 与遗留文件整理

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
