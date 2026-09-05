# Chrome Web Store Listing Copy

> Updated: 2026-09-05 for v2.17
> Use for Chrome Web Store title, short description, long description, screenshot captions, and release notes.

## Positioning

Smart TOC & Scroll is a lightweight reading navigation extension for long articles, blogs, and documentation pages.

It provides two navigation types:

- `Standard TOC Panel`: full outline, active-section highlighting, quick heading jumps, and a compact Top action.
- `Barcode`: a transparent edge rail with subtle hover feedback and low-intrusion scroll-to-top. Choose Wheel, Spotlight, GPT, or a pin-able SSPAI-style outline.

## Short Description

Adaptive reading navigation for long articles and docs: TOC, progress outline, hover preview, smooth jumps, and local-only analysis.

## Long Description

Smart TOC & Scroll adds lightweight reading navigation to long articles, blogs, and documentation pages.

It gives you two navigation types for different reading contexts:

- Standard TOC Panel: a full outline with active-section highlighting, quick heading jumps, and a compact Top action.
- Barcode: a transparent progress rail for immersive long-form reading, with four title previews:
  - Wheel: headings move through a fixed observation window.
  - Spotlight: a compact five-row context window keeps the current heading readable without crowding the article.
  - GPT: the idle rail stays minimal, then hover opens a bordered, scrollable panel containing the complete outline.
  - SSPAI: slim vertical ticks stay anchored beside the content or viewport edge; hover reveals the outline without moving the ticks, and a pin keeps it open.

Key features:

- Builds a clean outline from page headings
- Highlights the section you are currently reading
- Smoothly jumps to headings and back to the top
- Adapts gently to light and dark page surfaces
- Keeps the progress rail transparent and low-intrusion
- Avoids duplicate TOC or back-to-top widgets when a page already provides them
- Supports dynamic pages and single-page app updates
- Runs page analysis locally in your browser

Built for readers who want a clear sense of place without adding clutter to every page.

## 中文文案

### 简短描述

为长文、博客和文档页提供轻量阅读导航：目录面板、阅读进度、hover 预览、平滑跳转和本地分析。

### 详细描述

Smart TOC & Scroll 为长文、博客和文档站点提供轻量阅读导航。

它提供两种导航类型：

- 标准目录面板：展示完整目录、当前章节高亮、快速标题跳转和紧凑的 Top 回顶操作。
- Barcode：以透明边缘刻度表达长文结构，并提供四种标题预览：
  - 滚轮：标题在固定观察窗中滑动。
  - 聚光灯：以当前项上下各 2 项组成紧凑上下文，减少密集文字遮挡。
  - GPT：平时保持纯条形码，悬停后展开带背景和边框的完整可滚动标题面板。
  - 少数派：细竖刻度稳定停在正文外侧或屏幕边缘，悬停时刻度不横移；图钉可固定或释放完整大纲。

核心能力：

- 根据页面标题自动生成清晰目录
- 高亮当前阅读章节
- 平滑跳转到标题或回到顶部
- 根据页面浅色 / 深色背景做克制自适应
- 阅读进度 rail 保持透明、低侵扰
- 页面已有目录或回顶控件时自动避让，减少重复控件
- 支持动态页面与单页应用内容更新
- 页面分析在浏览器本地完成

适合希望在不打断阅读的前提下，快速掌握长文结构和当前位置的用户。

## Screenshot Captions

1. Full outline panel for documentation and technical pages.
2. SSPAI-style Barcode keeps its vertical ticks stable while revealing a pin-able outline.
3. Left-side progress outline with mirrored preview placement.
4. Adaptive contrast on light pages without adding a panel background.
5. Simple settings for navigation type, Barcode preview, placement, and compatibility.

## Screenshot Files

- Store icon: `output/chrome-store-icons/chrome-store-icon-128.png`
- `output/chrome-store/01-standard-toc-panel.png`
- `output/chrome-store/02-right-rail-hover-preview.png`
- `output/chrome-store/03-left-rail-hover-preview.png`
- `output/chrome-store/04-light-page-adaptive-rail.png`
- `output/chrome-store/05-options-reading-navigation.png`

## Privacy Note

Smart TOC & Scroll does not upload page content or collect browsing history. Outline detection and interactions run locally, and preferences are stored in the browser.

## Release Note — v2.17

All five navigation styles now wait for deliberate hover, keep keyboard navigation stable, and dismiss previews consistently with Escape. Back-to-top is a quiet, directly clickable control without looping motion or document-wide proximity sampling. Panels no longer use backdrop blur; SSPAI uses one adaptive red accent. Reduced motion now covers section jumps. Standard adds a visible Close button, and Settings validates display thresholds and preserves edits when saving fails.

## 中文更新说明 — v2.17

五种主题进一步围绕阅读导航打磨：停留后再展开、键盘焦点稳定、Esc 同步收起预览；回顶改为静态可点击入口，移除循环动效与全页距离采样；所有浮层取消背景模糊，少数派统一使用明暗自适应红色。减少动态效果覆盖章节跳转，标准目录增加关闭入口，设置页校验显示阈值并在保存失败时保留更改。
