# Chrome Web Store Listing Copy

> Updated: 2026-09-05 for v2.18
> Use for Chrome Web Store title, short description, long description, screenshot captions, and release notes.

## Positioning

Smart TOC & Scroll is a lightweight reading navigation extension for long articles, blogs, and documentation pages.

It provides two navigation types:

- `Standard TOC Panel`: full outline, active-section highlighting, quick heading jumps, and a compact Top action.
- `Barcode`: a transparent edge rail with subtle hover feedback and low-intrusion scroll-to-top. Choose Nearby, Search, or a pinnable Margin outline.

## Short Description

Adaptive reading navigation for long articles and docs: TOC, progress outline, hover preview, smooth jumps, and local-only analysis.

## Long Description

Smart TOC & Scroll adds lightweight reading navigation to long articles, blogs, and documentation pages.

It gives you two navigation types for different reading contexts:

- Standard TOC Panel: a full outline with active-section highlighting, quick heading jumps, and a compact Top action.
- Barcode: a transparent progress rail for immersive long-form reading, with three task-specific styles:
  - Nearby: shows the target heading and one neighbor on each side, with three reused labels and no moving track.
  - Search: filters page headings locally using one or more keywords; arrow keys select results and Enter jumps to the section.
  - Margin: a pinnable outline beside the article, with wrapped titles and a single red location accent.


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
- 边缘导航提供三种用途清晰的样式：
  - 邻节预览：目标标题与前后各一项，移开收起；原滚轮与聚光灯已合并。
  - 检索目录：按多关键词筛选本页标题，方向键选结果、Enter 跳转，不发网络请求。
  - 页边大纲：在页边展开可固定的大纲，长标题换行，红色标记阅读位置。


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

1. Standard panel — see the whole article structure at a glance. / 标准面板：一眼看清全文结构。
2. Nearby preview — just the target heading and its neighbors. / 邻节预览：只看附近，保留上下文。
3. Outline search — find headings with local keywords. / 检索目录：用关键词找回章节。
4. Pinned margin — keep the outline beside your reading. / 页边大纲：固定结构，安心对照阅读。
5. Reading settings — choose when and how navigation appears. / 阅读设置：按自己的节奏出现。

## Screenshot Files

Current set: `output/chrome-store/v2.18/` (five 1280 × 800 RGB PNGs).

- Store icon: `output/chrome-store-icons/chrome-store-icon-128.png`
- `output/chrome-store/v2.18/01-standard-v218.png`
- `output/chrome-store/v2.18/02-nearby-v218.png`
- `output/chrome-store/v2.18/03-search-v218.png`
- `output/chrome-store/v2.18/04-margin-v218.png`
- `output/chrome-store/v2.18/05-settings-v218.png`

The article is original sample content rendered with the actual v2.18 content scripts. These are demonstrations, not claims of installation or testing on a third-party website. Older screenshots in the parent directory are historical assets.

## Privacy Note

Smart TOC & Scroll does not upload page content or collect browsing history. Outline detection and interactions run locally, and preferences are stored in the browser.

## Release Note — v2.18

Reading styles now have distinct jobs: Standard for occasional jumps, Nearby for neighboring sections, Search for keyword lookup, and Margin for pinned reference. Wheel and Spotlight merge into Nearby with existing preferences preserved. Search is local, supports multiple keywords and keyboard navigation, and includes an empty state. Long titles wrap in full outlines. Removed the moving title track and per-heading wave updates; Nearby reuses only three labels.

## 中文更新说明 — v2.18

按阅读任务重整四种模式：标准面板用于偶尔跳转、邻节预览用于附近定位、检索目录用于关键词查找、页边大纲用于固定对照。原滚轮与聚光灯合并并兼容旧设置；新增本地多关键词搜索、空结果提示与结果键盘导航。完整目录支持长标题换行，移除滚轮轨道与逐项波动计算，邻节预览只复用三个节点。
