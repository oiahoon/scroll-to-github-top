# Chrome Web Store 商店文案草稿

> 更新时间：2026-03-27
> 适用范围：Chrome Web Store 标题、简介、长描述、截图说明与发布说明

## 1. 推荐产品定位

Smart TOC & Scroll 是一个面向长文、博客与文档站点的轻量阅读导航扩展。

它不是单纯的“回到顶部按钮”，而是提供两种互补的阅读导航方式：

- `标准目录面板`
  - 适合文档站、技术博客、知识库
  - 强调完整目录、快速跳转和当前章节高亮
- `阅读进度目录（SSPAI）`
  - 适合内容型长文
  - 强调低侵扰位置感知、悬停查看标题和轻量回顶

## 2. 推荐短描述

用于 Chrome 商店短描述，尽量控制在 132 个字符以内：

> Lightweight reading navigation for long articles and docs. Clean TOC, progress-style outline, smart skip and smooth scroll to top.

## 3. 推荐长描述

### 英文版

Smart TOC & Scroll adds lightweight reading navigation to long articles, blogs, and documentation sites.

Instead of forcing the same UI onto every page, it gives you two navigation styles:

- Standard TOC Panel
  - Great for docs, technical blogs, and knowledge bases
  - Shows a full outline with active-section highlighting
  - Lets you jump between headings quickly
- Reading Progress Outline (SSPAI)
  - Great for immersive long-form reading
  - Uses subtle rail markers to show where you are in the article
  - Expands labels on hover and keeps distraction low

Key features:

- Automatically builds a clean table of contents from page headings
- Highlights the section you are currently reading
- Smooth scroll to headings and back to top
- Smart light/dark adaptation based on page background
- Avoids injecting duplicate widgets when the page already has its own TOC or back-to-top control
- Supports SPA pages and dynamic content updates
- Keyboard-accessible interactions and low-intrusion defaults

Built for users who want fast navigation without clutter.

### 中文版

Smart TOC & Scroll 为长文、博客和文档站点提供轻量阅读导航。

它不是简单的“回到顶部”按钮，而是提供两种互补的导航方式：

- 标准目录面板
  - 适合文档站、技术博客、知识库
  - 展示完整目录、当前章节高亮和快速跳转
- 阅读进度目录（SSPAI）
  - 适合沉浸式长文阅读
  - 默认以低侵扰短横线表达章节位置
  - 悬停时展开标题，尽量减少视觉打扰

核心能力：

- 自动识别正文与标题并生成目录
- 高亮当前阅读章节
- 点击标题平滑跳转
- 平滑回到顶部
- 基于页面背景自动适配浅色 / 深色主题
- 页面已有 TOC 或回顶控件时自动避让，减少重复注入
- 支持 SPA 页面与动态内容更新
- 默认低侵扰，并支持键盘操作

适合希望在不打断阅读的前提下，快速掌握长文结构与当前位置的用户。

## 4. 推荐截图脚本

建议商店截图至少覆盖四类场景：

1. `标准目录面板` 在技术文档页
   - 展示完整 TOC、高亮当前章节、Top 按钮
2. `阅读进度目录（SSPAI）` 在长文页
   - 展示短横线默认态、悬停展开态和当前章节高亮
3. 选项页
   - 展示“阅读导航样式”“兼容策略”“显示条件”等核心设置
4. 兼容性
   - 展示检测到页面已有 TOC 时自动避让的行为

## 5. 推荐发布说明模板

### 常规版本更新说明

> Improved reading navigation, reduced runtime overhead, and better compatibility with sites that already provide their own TOC or back-to-top controls.

### 当次主打更新说明

> Added a new progress-outline reading mode inspired by long-form editorial layouts, improved duplicate-widget avoidance, and reduced TOC update overhead on dynamic pages.

## 6. 隐私与信任说明

商店页建议明确写出：

- 不采集浏览历史
- 不上传页面内容
- 所有 TOC 识别与交互都在本地完成
- 设置仅保存在浏览器本地 / Chrome Sync 中

## 7. 商店素材建议

- 图标：保持简洁、强调“目录 / 导航”而不是“按钮”
- 首图：优先突出“低侵扰阅读导航”而不是功能堆叠
- 文案语气：少说“all in one”，多强调“lightweight”“reading navigation”“low intrusion”
