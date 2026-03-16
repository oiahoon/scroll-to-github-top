# Smart TOC & Scroll — UI/UX 优化设计规范

> **版本**：v2.3 已落地整理版
> **生成日期**：2026-03-16
> **适用文件**：toc.css、themes.css、options.html、options.css

---

## 目录

1. [设计原则与目标](#1-设计原则与目标)
2. [组件层级结构](#2-组件层级结构)
3. [浮标（Collapsed State）视觉优化](#3-浮标collapsed-state视觉优化)
4. [展开面板视觉优化](#4-展开面板视觉优化)
5. [TOC 条目排版与可读性](#5-toc-条目排版与可读性)
6. [动画优化](#6-动画优化)
7. [主题系统重新设计](#7-主题系统重新设计)
8. [滚动到顶部按钮优化](#8-滚动到顶部按钮优化)
9. [Options 设置页面现代化](#9-options-设置页面现代化)
10. [响应式适配](#10-响应式适配)
11. [无障碍（A11y）规范](#11-无障碍a11y规范)
12. [CSS 变量完整规范](#12-css-变量完整规范)
13. [视觉状态速查表](#13-视觉状态速查表)

---

## 1. 设计原则与目标

### 1.1 核心设计原则

本扩展作为注入到任意第三方页面的浮层 UI，须遵循以下优先级排序的设计原则：

```
第一优先级：低侵扰性（Non-Intrusive）
  → 浮层默认状态下尽量"消失"，不抢夺用户视觉焦点
  → 任何时候不遮挡正文内容的阅读区域

第二优先级：普适融合性（Universal Blending）
  → 在深色、浅色、彩色背景页面上均和谐共存
  → 避免与宿主页面配色产生强烈冲突

第三优先级：功能明确性（Functional Clarity）
  → 交互意图清晰，学习成本为零
  → 展开/折叠状态有明确的视觉反馈
```

### 1.2 重构前主要问题归纳

经代码审查，v2.2 基线版本存在以下可优化点：

| 问题类别 | 具体问题 | 影响程度 |
|---|---|---|
| 浮标尺寸 | 56px 圆形在许多页面上偏大、存在感强 | 高 |
| 主题逻辑 | 彩色主题（蓝/绿/紫）背景色过于鲜艳，与页面内容产生视觉竞争 | 高 |
| 主题检测 | 基于文字颜色频率推断背景色，逻辑间接且易误判 | 中 |
| 展开面板 | 标题字号 20px 偏大，标题区与列表区层次感不足 | 中 |
| 动画时序 | 10 个条目累计最大延迟 0.5s，长列表的最后几项等待感明显 | 中 |
| 滚动按钮 | 独立回顶按钮与 TOC 图标视觉语言不统一 | 中 |
| 滚动条 | 8px 宽度在收缩状态下仍偏粗 | 低 |
| Options 页 | 缺少 hover/focus 状态细化，无深色模式适配 | 低 |

---

## 2. 组件层级结构

### 2.1 TOC 浮层完整树形结构

```
#github-toc  (.github-toc)
├── .toc-icon                          ← 浮标图标（汉堡菜单 SVG）
│   └── svg
└── .toc-tree                          ← 展开面板主体
    ├── .toc-header                    ← 面板顶栏
    │   ├── .toc-title                 ← "Outline" 标题文字
    │   └── .toc-top-button            ← "Top" 快捷回顶按钮
    └── .toc-list  (ul)                ← 目录条目列表
        ├── li.toc-item.level-1
        │   └── a
        ├── li.toc-item.level-2
        │   └── a
        └── li.toc-item.no-headers     ← 空状态
            └── .no-headers-message
                ├── svg
                ├── span
                └── p
```

### 2.2 独立滚动按钮结构

```
#github-sst  (.github-sst)
└── svg                                ← 向上箭头图标
```

### 2.3 设置页面结构

```
body
└── main.page
    ├── header.page-header
    │   ├── .page-header-icon          ← 新增：扩展图标
    │   ├── h1
    │   └── p.page-subtitle
    ├── section.card  (交互方式)
    │   ├── .card-header
    │   │   ├── .card-icon             ← 新增：区块图标
    │   │   └── h2
    │   └── .field
    ├── section.card  (显示条件)
    ├── section.card  (位置与禁用)
    └── .actions
        ├── button#save
        └── span#status
```

---

## 3. 浮标（Collapsed State）视觉优化

### 3.1 当前问题分析

- 尺寸：56px 直径，在 1440px 宽屏页面的角落占据显著视觉空间
- 透明度：默认 opacity 0.6，hover 升至 1.0，变化幅度大（0.4 的差值），hover 时突然"跳出"感强
- 阴影：直接使用 Material Design elevation-1（多层叠加阴影），在浅色页面的白色背景上阴影不明显，在深色页面上阴影过重
- 图标：汉堡菜单 SVG 宽高各 30px，在 56px 容器内比例偏大（30/56 ≈ 54%），压迫感强

### 3.2 优化方案

#### 3.2.1 尺寸缩小

将浮标直径从 56px 缩小至 **44px**，与 iOS/Android 最小可点击目标尺寸（44pt）对齐，在保证可操作性的同时减少页面占用。

```css
/* 新规范 */
.github-toc {
  width: 44px;
  height: 44px;
  /* 底部间距从 20px 调整为 24px，给视觉留出更多"呼吸空间" */
  bottom: 24px;
  right: 24px;
}
```

#### 3.2.2 透明度曲线重新设计

当前问题：默认 0.6 → hover 1.0，跳跃幅度 0.4。
优化思路：提高基础透明度下限，缩小 hover 跳跃幅度，同时引入 `transition-timing-function` 差异化。

```css
.github-toc {
  opacity: 0.45;                          /* 默认：比当前 0.6 更低调 */
  transition: opacity 0.25s ease,
              box-shadow 0.25s ease,
              width 0.32s var(--ease-expand),
              height 0.32s var(--ease-expand),
              border-radius 0.32s var(--ease-expand);
}

.github-toc:hover {
  opacity: 0.85;                          /* hover：不再是完全不透明 */
}

.github-toc.expanded {
  opacity: 1;                             /* 展开时完全不透明 */
}
```

**视觉状态定义：**

| 状态 | opacity | box-shadow | 备注 |
|---|---|---|---|
| default（静止） | 0.45 | --toc-elevation-rest | 页面正常浏览时几乎"退后" |
| hover（悬停） | 0.85 | --toc-elevation-hover | 用户意图接近时升起 |
| active（点击按压） | 0.95 | --toc-elevation-press | 轻微压下感 |
| expanded（展开） | 1.0 | --toc-elevation-expanded | 完全前景化 |
| 页面有输入框获焦 | 0.3 | --toc-elevation-rest | 主动退后，避免干扰 |

#### 3.2.3 图标尺寸比例调整

图标 SVG 从 30×30 缩小至 **20×20**，在 44px 容器内占比 20/44 ≈ 45%，视觉上更轻盈。

```css
.toc-icon {
  width: 20px;
  height: 20px;
}
```

#### 3.2.4 阴影重新设计（去除 Material Design 强依赖）

当前 elevation-1 在某些页面背景下"消失"或"过重"。改用自适应阴影——利用 CSS 变量控制阴影颜色，并区分亮色/暗色主题：

```css
/* 新增阴影变量（替代 --elevation-1/2/3） */
:root {
  /* 亮色主题阴影：基于黑色 */
  --shadow-rest-light:     0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08);
  --shadow-hover-light:    0 4px 8px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.10);
  --shadow-press-light:    0 1px 2px rgba(0,0,0,0.10);
  --shadow-expanded-light: 0 8px 24px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.10);

  /* 暗色主题阴影：基于更深的黑色 */
  --shadow-rest-dark:      0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.20);
  --shadow-hover-dark:     0 4px 8px rgba(0,0,0,0.40), 0 2px 4px rgba(0,0,0,0.25);
  --shadow-press-dark:     0 1px 2px rgba(0,0,0,0.25);
  --shadow-expanded-dark:  0 8px 24px rgba(0,0,0,0.50), 0 4px 8px rgba(0,0,0,0.30);
}
```

#### 3.2.5 形状细节

保持圆形浮标设计，但增加 `border` 微描边，增强与任意背景的对比度分离感：

```css
.github-toc {
  border: 1px solid var(--toc-border);   /* 新增：微描边 */
  border-radius: 50%;
}
```

`--toc-border` 按主题定义（见第 7 节）。

---

## 4. 展开面板视觉优化

### 4.1 当前问题分析

- 面板尺寸 320×480px 固定，在小屏笔记本（1280px 宽）上占屏比例约 25%，较大
- 标题区 `font-size: 20px` 偏大，与列表条目 14px 对比悬殊
- 面板内 `padding: 16px` 上下左右均等，顶部视觉密度高
- `toc-top-button` 背景使用 `--toc-highlight` 与条目 hover 背景相同，点击感弱
- `toc-list` 的 `max-height: calc(100% - 60px)` 计算值偏经验，若标题区发生变化会溢出

### 4.2 展开尺寸优化

```css
.github-toc.expanded {
  width: 280px;          /* 从 320px 缩小到 280px */
  height: auto;          /* 从固定 480px 改为自适应高度 */
  max-height: min(480px, calc(100vh - 64px));   /* 不超过视口高度减去 64px */
  border-radius: 12px;   /* 从 8px 增大到 12px，更现代圆润 */
}
```

**尺寸响应式规则（见第 10 节）：**
- 视口宽度 >= 1440px：宽度 280px
- 视口宽度 1024px–1439px：宽度 260px
- 视口宽度 768px–1023px：宽度 240px
- 视口宽度 < 768px：宽度 92vw，最大 320px（近全屏底部弹层）

### 4.3 面板内排版层次重设计

#### 4.3.1 顶栏（.toc-header）

将 `.toc-title` 重命名/重构为 `.toc-header`，明确包含标题文字和操作按钮：

```
布局：flex, align-items: center, justify-content: space-between
内边距：12px 16px 10px 16px（顶部稍小，视觉重心下移）
底部分隔线：1px solid var(--toc-divider)
```

标题文字规格：
- `font-size: 11px`（从 20px 大幅缩小，改为"标签"风格）
- `font-weight: 600`
- `letter-spacing: 0.08em`
- `text-transform: uppercase`（全大写标签风格，如 "OUTLINE"）
- `color: var(--toc-text-muted)`（弱化，不抢夺视觉焦点）

#### 4.3.2 "Top" 按钮重设计

当前 `toc-top-button` 用 `--toc-highlight` 背景（hover 背景），视觉识别度低。改为幽灵按钮样式：

```
形态：ghost button（无填充背景，仅描边）
尺寸：高度 24px，内边距 0 8px
字号：11px，font-weight: 500
边框：1px solid var(--toc-border)
圆角：6px
颜色：var(--toc-text-muted)
```

视觉状态：

| 状态 | 背景 | 文字颜色 | 边框 |
|---|---|---|---|
| default | transparent | --toc-text-muted | --toc-border |
| hover | var(--toc-highlight) | --toc-text | --toc-border-hover |
| active | var(--toc-highlight-active) | --toc-text | --toc-border-hover |
| focus-visible | transparent | --toc-text | --toc-accent（2px outline offset） |

#### 4.3.3 滚动条优化

将宽度从 8px 缩小至 **4px**，视觉上更精巧：

```css
.toc-list::-webkit-scrollbar {
  width: 4px;
}

.toc-list::-webkit-scrollbar-track {
  background: transparent;    /* 轨道透明，更简洁 */
  border-radius: 2px;
}

.toc-list::-webkit-scrollbar-thumb {
  background: var(--toc-scrollbar-thumb);
  border-radius: 2px;
  /* 仅在悬停列表时显示滚动条 */
}

.toc-list {
  scrollbar-width: thin;         /* Firefox */
  scrollbar-color: var(--toc-scrollbar-thumb) transparent;
}
```

#### 4.3.4 空状态（No Headers）视觉优化

```
布局：flex column, align-items: center, gap: 6px
内边距：24px 16px
图标：20px，opacity: 0.4（更淡，降低压迫感）
标题文字：13px，font-weight: 500，color: var(--toc-text-muted)
说明文字：12px，line-height: 1.5，opacity: 0.6，text-align: center
```

---

## 5. TOC 条目排版与可读性

### 5.1 当前问题分析

- 条目间距 `margin: 8px 0` 在标题数量多时（10+ 条）显得列表过长
- 链接 `padding: 8px 16px` 上下内边距偏大
- 层级缩进固定 16px/级，第 4–6 级总缩进 48–80px，在 280px 面板内严重压缩可读文字宽度
- 当前激活指示条（左侧 3px 高亮竖线）未配合缩进，所有层级的指示条都贴在面板最左边，不直观
- 字体 `'Roboto', 'Segoe UI'` 在中文标题场景下无中文字重，依赖系统回退字体

### 5.2 间距与内边距优化

```css
.toc-item {
  margin: 1px 0;          /* 从 8px 缩小至 1px，依靠 padding 撑开高度 */
}

.toc-item a {
  padding: 6px 12px 6px 8px;   /* 上下从 8px 缩为 6px，左边距缩为 8px */
  font-size: 13px;              /* 从 14px 缩小为 13px */
  line-height: 1.4;
  border-radius: 6px;           /* 从 4px 增大至 6px */
}
```

### 5.3 层级缩进重新设计

问题：深层级（4–6）缩进 48–80px 在 280px 面板中过大，可读文字只剩约 130px。

优化方案：减小缩进基准，并设上限：

```css
.toc-item.level-1 { padding-left: 8px; }
.toc-item.level-2 { padding-left: 20px; }     /* 缩进 12px */
.toc-item.level-3 { padding-left: 32px; }     /* 缩进 12px */
.toc-item.level-4 { padding-left: 40px; }     /* 缩进 8px（收敛） */
.toc-item.level-5 { padding-left: 48px; }     /* 缩进 8px（收敛） */
.toc-item.level-6 { padding-left: 48px; }     /* 与 level-5 同，不再深入 */
```

注意：缩进通过 `padding-left` 在 `a` 标签上实现（而非 `margin-left` 在 `li` 上），这样 hover 背景能完整覆盖整行宽度，视觉更统一。

### 5.4 激活状态指示条重设计

当前问题：指示条固定在 `left: 0`，与条目层级缩进无关联，深层级条目的指示条显示在空白处。

优化方案：指示条跟随条目左边距：

```css
/* 移除原有 .toc-item.active::before 的 left: 0 固定定位 */
/* 改为在 a 标签上使用 border-left */

.toc-item.active > a {
  border-left: 2px solid var(--toc-accent);    /* 从 3px 细化为 2px */
  padding-left: calc(当前层级缩进值 - 2px);    /* 补偿 border 占用空间 */
  color: var(--toc-accent);
  background: var(--toc-highlight-active);
  font-weight: 500;
}
```

具体实现需为每个层级分别声明（因 CSS 无法动态计算 padding-left 偏差），示例：

```css
.toc-item.level-1.active > a {
  border-left: 2px solid var(--toc-accent);
  padding-left: 6px;     /* 8px - 2px */
}
.toc-item.level-2.active > a {
  border-left: 2px solid var(--toc-accent);
  padding-left: 18px;    /* 20px - 2px */
}
/* ...level-3 至 level-6 依此类推 */
```

### 5.5 字体栈中文优化

在现有字体栈前补充中文优先字体：

```css
.github-toc, .github-toc * {
  font-family:
    -apple-system,               /* macOS/iOS 系统字体 */
    'PingFang SC',               /* macOS 中文 */
    'Microsoft YaHei',           /* Windows 中文 */
    'Roboto',
    'Segoe UI',
    'Helvetica Neue',
    Arial,
    sans-serif !important;
}
```

### 5.6 长标题截断优化

现有截断方案（`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`）正确，但需增加 `title` 属性支持 tooltip——这是 JS 层的建议，开发者在生成 `a` 标签时应添加 `a.title = text`。

---

## 6. 动画优化

### 6.1 当前问题分析

- 展开动画同时过渡 width、height、border-radius，三者使用同一 `0.3s ease-out`，实际视觉效果是"等速膨胀"，缺乏弹性感
- 条目入场延迟最大 0.5s（第 10 条），若标题多于 10 条则后续无延迟，视觉不一致
- 折叠（收缩）动画没有额外优化，当前与展开用同一曲线，收缩时内容"消失"不够利落
- 自定义 `scrollTo` 使用线性递归（每 10ms 步进），非 easing，滚动感生硬

### 6.2 展开/折叠动画曲线重设计

区分"展开"和"折叠"使用不同曲线（非对称动画）：

```css
:root {
  --ease-expand:   cubic-bezier(0.34, 1.56, 0.64, 1);  /* 带轻微弹出感 */
  --ease-collapse: cubic-bezier(0.4, 0, 0.6, 1);        /* 快速收缩，无弹出 */
  --ease-content:  cubic-bezier(0.0, 0.0, 0.2, 1);      /* 内容淡入，Material 标准 */
}
```

实现思路：通过 JS 在展开/折叠时给容器切换不同的 class（`.is-collapsing`），使 CSS 可以针对两种状态分别指定 transition：

```css
/* 展开状态：使用弹出曲线 */
.github-toc.expanded {
  transition:
    width 0.30s var(--ease-expand),
    height 0.30s var(--ease-expand),
    border-radius 0.25s var(--ease-expand),
    opacity 0.20s ease,
    box-shadow 0.25s ease;
}

/* 折叠中：使用收缩曲线（JS 临时添加此 class） */
.github-toc.is-collapsing {
  transition:
    width 0.22s var(--ease-collapse),
    height 0.22s var(--ease-collapse),
    border-radius 0.20s var(--ease-collapse),
    opacity 0.15s ease,
    box-shadow 0.20s ease;
}
```

### 6.3 条目入场动画时序优化

问题：固定 10 条目的 50ms 阶梯，超过 10 条没有延迟，且最大等待 0.5s 体验慢。

优化方案：压缩阶梯间隔，限制最大延迟，并让所有条目都有延迟：

```css
/* 新时序：间隔 30ms，最大延迟 200ms（约 7 条后不再增加）*/
.toc-item:nth-child(1)  { transition-delay: 0.03s; }
.toc-item:nth-child(2)  { transition-delay: 0.06s; }
.toc-item:nth-child(3)  { transition-delay: 0.09s; }
.toc-item:nth-child(4)  { transition-delay: 0.12s; }
.toc-item:nth-child(5)  { transition-delay: 0.15s; }
.toc-item:nth-child(6)  { transition-delay: 0.17s; }
.toc-item:nth-child(7)  { transition-delay: 0.19s; }
.toc-item:nth-child(8)  { transition-delay: 0.20s; }
.toc-item:nth-child(n+9){ transition-delay: 0.20s; } /* 8 条后不再增加 */
```

折叠时所有条目的延迟需清零，防止折叠时条目还在"入场"：

```css
.github-toc:not(.expanded) .toc-item {
  transition-delay: 0s !important;
}
```

### 6.4 条目入场方向优化

当前：`translateX(-10px)` 从左侧滑入。

优化：改为 `translateY(4px)` 从下方轻微升起，与面板从下角展开的方向语义一致：

```css
.toc-item {
  transform: translateY(4px);   /* 从 translateX(-10px) 改为 translateY(4px) */
  opacity: 0;
}

.github-toc.expanded .toc-item {
  transform: translateY(0);
  opacity: 1;
}
```

### 6.5 页面滚动过渡改进建议

当前自定义 `scrollTo` 函数使用线性递归（`perTick = difference / duration * 10`），等速滚动。建议改用浏览器原生 `scrollIntoView({ behavior: 'smooth' })` 或 `window.scrollTo({ top: 0, behavior: 'smooth' })`，利用浏览器内置的 easing 曲线（通常为 ease-in-out），滚动手感更自然。这是 JS 层建议，不在 CSS 范畴内，供开发者参考。

---

## 7. 主题系统重新设计

### 7.1 当前问题的根本原因

当前主题系统存在两个核心设计问题：

**问题 A：主题颜色是"彩色背景"而非"融入背景"**
- `theme-blue`（#1976d2）、`theme-green`（#2e7d32）、`theme-purple`（#512da8）这三个主题使用纯色背景，在普通浅色页面上显得突兀刺眼
- 这三个主题的出现场景（中亮度色相页面）恰恰是最需要低调的时候

**问题 B：主题检测策略的间接性**
- 通过统计文字颜色频率来推断背景深浅，存在误判风险（如深色字体在深色页面上的使用）
- 未利用更直接的背景色信号（`document.body` 背景色、`background-color`）

### 7.2 新主题系统设计理念

**核心转变：从"彩色品牌主题"改为"自适应中性主题"**

不再使用固定的蓝/绿/紫色，而是设计两类核心主题：
1. **light-adaptive（亮色自适应）**：用于深色/中色背景页面，面板呈半透明磨砂白
2. **dark-adaptive（暗色自适应）**：用于浅色背景页面，面板呈半透明磨砂深灰

通过 `backdrop-filter: blur()` 实现磨砂玻璃效果，使面板自然融入任意背景。

### 7.3 新主题 CSS 变量规范

#### 主题 A：light（面向深色页面——原 theme-light，现升级为磨砂玻璃）

```css
.theme-light {
  /* 背景：半透明白色 + 磨砂模糊 */
  --toc-bg:               rgba(255, 255, 255, 0.88);
  --toc-bg-expanded:      rgba(255, 255, 255, 0.95);
  --toc-backdrop-filter:  blur(16px) saturate(180%);

  /* 文字 */
  --toc-text:             #1a1a1a;
  --toc-text-muted:       rgba(26, 26, 26, 0.50);
  --toc-text-hover:       #000000;
  --toc-accent:           #0969da;       /* 激活态强调色（GitHub 蓝） */

  /* 高亮 */
  --toc-highlight:        rgba(0, 0, 0, 0.05);
  --toc-highlight-active: rgba(9, 105, 218, 0.08);

  /* 描边 */
  --toc-border:           rgba(0, 0, 0, 0.10);
  --toc-border-hover:     rgba(0, 0, 0, 0.20);
  --toc-divider:          rgba(0, 0, 0, 0.07);

  /* 滚动条 */
  --toc-scrollbar-thumb:  rgba(0, 0, 0, 0.18);

  /* 阴影 */
  --toc-elevation-rest:     0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06);
  --toc-elevation-hover:    0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08);
  --toc-elevation-press:    0 1px 2px rgba(0,0,0,0.08);
  --toc-elevation-expanded: 0 8px 32px rgba(0,0,0,0.14), 0 4px 8px rgba(0,0,0,0.08);
}
```

#### 主题 B：dark（面向浅色页面——原 theme-dark，现升级为磨砂玻璃）

```css
.theme-dark {
  /* 背景：半透明深色 + 磨砂模糊 */
  --toc-bg:               rgba(30, 30, 30, 0.82);
  --toc-bg-expanded:      rgba(28, 28, 28, 0.94);
  --toc-backdrop-filter:  blur(16px) saturate(150%);

  /* 文字 */
  --toc-text:             rgba(255, 255, 255, 0.90);
  --toc-text-muted:       rgba(255, 255, 255, 0.40);
  --toc-text-hover:       #ffffff;
  --toc-accent:           #58a6ff;       /* 深色模式下的蓝色（GitHub 风格） */

  /* 高亮 */
  --toc-highlight:        rgba(255, 255, 255, 0.06);
  --toc-highlight-active: rgba(88, 166, 255, 0.12);

  /* 描边 */
  --toc-border:           rgba(255, 255, 255, 0.10);
  --toc-border-hover:     rgba(255, 255, 255, 0.20);
  --toc-divider:          rgba(255, 255, 255, 0.07);

  /* 滚动条 */
  --toc-scrollbar-thumb:  rgba(255, 255, 255, 0.18);

  /* 阴影 */
  --toc-elevation-rest:     0 1px 4px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.20);
  --toc-elevation-hover:    0 4px 12px rgba(0,0,0,0.45), 0 2px 4px rgba(0,0,0,0.25);
  --toc-elevation-press:    0 1px 2px rgba(0,0,0,0.25);
  --toc-elevation-expanded: 0 8px 32px rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.30);
}
```

#### 主题 C：auto（媒体查询自动跟随操作系统偏好——新增）

```css
.theme-auto {
  color-scheme: light dark;
}

@media (prefers-color-scheme: light) {
  .theme-auto {
    /* 继承 .theme-dark 变量（浅色系统 → 深色浮层） */
    --toc-bg:               rgba(30, 30, 30, 0.82);
    /* ... 其余变量同 .theme-dark */
  }
}

@media (prefers-color-scheme: dark) {
  .theme-auto {
    /* 继承 .theme-light 变量（深色系统 → 浅色浮层） */
    --toc-bg:               rgba(255, 255, 255, 0.88);
    /* ... 其余变量同 .theme-light */
  }
}
```

### 7.4 backdrop-filter 应用方式

```css
.github-toc {
  background: var(--toc-bg) !important;
  -webkit-backdrop-filter: var(--toc-backdrop-filter);
  backdrop-filter: var(--toc-backdrop-filter);
}

/* backdrop-filter 不支持时的降级 */
@supports not (backdrop-filter: blur(1px)) {
  .github-toc {
    /* 降级：提高背景不透明度补偿 */
    background: var(--toc-bg-fallback) !important;
  }

  /* 在 :root 中定义 fallback 值 */
  .theme-light { --toc-bg-fallback: rgba(255, 255, 255, 0.98); }
  .theme-dark  { --toc-bg-fallback: rgba(28, 28, 28, 0.98); }
}
```

### 7.5 主题检测策略改进建议（JS 层）

建议 `theme.js` 改为直接检测背景色，而非文字颜色频率：

1. 优先取 `document.body` 的 `background-color`
2. 次选 `document.documentElement` 的 `background-color`
3. 若均为透明（`rgba(0,0,0,0)`），则检测 `<html>` 上的 `color-scheme` 属性
4. 兜底：检测 `prefers-color-scheme` 媒体查询
5. 最终兜底：应用 `theme-dark`（假设页面是浅色背景，使用深色浮层更保险）

新逻辑只需在 `hsl.l > 60` 时应用 `theme-dark`，其余应用 `theme-light`，去除蓝/绿/紫色主题。

---

## 8. 滚动到顶部按钮优化

### 8.1 重构前问题分析

- 历史实现中，独立按钮与 TOC 浮标属于两条分离路径，视觉语言不统一
- 独立按钮曾缺少与主题系统一致的样式变量承接
- 独立按钮早期显示/隐藏依赖直接切换显示状态，缺少统一过渡动画

### 8.2 独立按钮（#github-sst）样式规范

独立按钮与 TOC 浮标现已共享视觉语言，形成"配对"感：

```
尺寸：40px × 40px（比 TOC 浮标 44px 略小，暗示从属关系）
形状：圆形（border-radius: 50%）
定位：position: fixed, bottom: 24px, right: 80px（TOC 浮标右侧左移，避免重叠）
     注：若 TOC 浮标在左侧时，按钮改为 left: 80px
背景：与 TOC 浮标共享相同主题变量
     background: var(--toc-bg)
     backdrop-filter: var(--toc-backdrop-filter)
border：1px solid var(--toc-border)
阴影：var(--toc-elevation-rest)
opacity：0.45（与 TOC 浮标默认 opacity 一致）
z-index：9998（比 TOC 的 9999 低一级，让 TOC 始终在前）
```

**视觉状态：**

| 状态 | opacity | box-shadow | transform |
|---|---|---|---|
| default | 0.45 | --toc-elevation-rest | none |
| hover | 0.85 | --toc-elevation-hover | translateY(-2px)（轻微上浮） |
| active（点击） | 0.95 | --toc-elevation-press | translateY(0)（弹回） |
| 隐藏中 | 0 | none | scale(0.8) |
| 显示中 | 0.45 | --toc-elevation-rest | scale(1) |

### 8.3 显示/隐藏过渡动画

替代 `style.display = 'block/none'` 的直接切换，通过 CSS class 控制：

```css
.github-sst {
  opacity: 0;
  transform: scale(0.8) translateY(8px);
  pointer-events: none;
  transition:
    opacity 0.20s ease,
    transform 0.20s var(--ease-expand);
}

.github-sst.visible {
  opacity: 0.45;
  transform: scale(1) translateY(0);
  pointer-events: auto;
}

.github-sst.visible:hover {
  opacity: 0.85;
  transform: scale(1) translateY(-2px);
}
```

当前实现：由 `catalog.js` 统一创建 `#github-sst`，并通过切换 `.visible` class 控制显隐。

### 8.4 图标规格优化

将独立按钮 SVG 从 30×30 缩小至 **18×18**，在 40px 容器中占比 45%，与 TOC 图标在 44px 容器中 20px 的比例（45%）保持一致：

```
SVG 外层容器：宽高 18px
图标路径：上箭头路径，fill 继承 var(--toc-text)
```

---

## 9. Options 设置页面现代化

### 9.1 当前问题分析

- 页面头部过于简单，无扩展标识
- 各卡片无图标区分，视觉扫描效率低
- 表单控件（input/select/textarea）缺少 focus ring 细化
- `button#save` hover/active/focus 状态未定义
- `#status` 文字仅颜色变化，无动效反馈
- 页面无暗色模式支持

### 9.2 页面整体布局调整

```
最大宽度：640px（从 720px 缩小，内容更聚焦）
外边距：40px auto 80px（顶部留白增大）
横向内边距：24px（移动端适配，见第 10 节）
```

### 9.3 页面头部（.page-header）

```
布局：flex, align-items: flex-start, gap: 14px
内边距：0 0 32px 0
分隔线：底部 1px solid var(--border) 分隔头部与内容

扩展图标区块：
  - 尺寸：44px × 44px
  - 圆角：10px
  - 背景：linear-gradient(135deg, #0969da 0%, #218bff 100%)
  - 内含白色 SVG 图标（书签/列表类型）
  - 阴影：0 2px 8px rgba(9, 105, 218, 0.30)

标题文字：
  - h1: font-size: 22px, font-weight: 700, color: var(--text), margin: 0 0 4px
  - 副标题: font-size: 13px, color: var(--muted), line-height: 1.5
```

### 9.4 卡片（.card）细化

```css
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0;              /* 移除外层 padding，改为内部分区控制 */
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;        /* 确保圆角裁剪子元素 */
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--icon-bg);    /* 每个卡片不同 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-body {
  padding: 16px 20px;
}
```

各卡片图标颜色建议：
- 交互方式：蓝色系，`--icon-bg: rgba(9, 105, 218, 0.10)`，图标色 `#0969da`
- 显示条件：橙色系，`--icon-bg: rgba(227, 119, 12, 0.10)`，图标色 `#e3770c`
- 位置与禁用：灰色系，`--icon-bg: rgba(100, 110, 120, 0.10)`，图标色 `#6b7280`

### 9.5 表单控件视觉状态

#### Select / Input / Textarea

```css
.field input,
.field select,
.field textarea {
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 14px;
  background: var(--input-bg);
  color: var(--text);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  outline: none;
  width: 100%;
}
```

各状态规范：

| 状态 | border-color | box-shadow | background |
|---|---|---|---|
| default | var(--border) `#e5e7eb` | none | #ffffff |
| hover | `#d1d5db` | none | #ffffff |
| focus | var(--accent) `#1f6feb` | 0 0 0 3px rgba(31, 111, 235, 0.15) | #ffffff |
| disabled | `#f3f4f6` | none | `#f9fafb` |
| error（如输入非法域名） | `#dc2626` | 0 0 0 3px rgba(220, 38, 38, 0.12) | #fff5f5 |

#### Checkbox 样式升级

用自定义 CSS 替代原生 checkbox 外观（保留原生 checkbox 功能，通过 `appearance: none` 隐藏默认样式）：

```
尺寸：18px × 18px
圆角：5px
未勾选：background: #fff, border: 1.5px solid var(--border)
已勾选：background: var(--accent), border-color: var(--accent)
       内有白色勾号 SVG（通过 background-image 或 ::after 实现）
focus-visible：box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.20)
disabled：opacity: 0.45, cursor: not-allowed
```

**Checkbox 禁用状态**（对应 `avoidExistingWidgets` 在 `forceShow` 勾选后禁用）：
```
整个 .field 添加 .is-disabled class
.is-disabled label { opacity: 0.45; cursor: not-allowed; }
.is-disabled label 添加 title="已由「始终显示」选项接管"
```

### 9.6 保存按钮（#save）完整状态规范

```css
button#save {
  background: var(--accent);     /* #1f6feb */
  color: #ffffff;
  border: none;
  border-radius: 8px;            /* 从 999px 改为 8px，更现代 */
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease,
              box-shadow 0.15s ease,
              transform 0.10s ease;
}
```

各状态：

| 状态 | background | box-shadow | transform |
|---|---|---|---|
| default | `#1f6feb` | 0 1px 3px rgba(31,111,235,0.30) | none |
| hover | `#1b63d3`（加深 5%） | 0 3px 8px rgba(31,111,235,0.35) | translateY(-1px) |
| active | `#1859bf`（加深 10%） | 0 1px 2px rgba(31,111,235,0.20) | translateY(0) |
| focus-visible | `#1f6feb` | 0 0 0 3px rgba(31,111,235,0.35) | none |
| disabled | `#93b4f5` | none | none |
| loading（保存中） | `#1f6feb` | — | 按钮内显示旋转圆圈图标 |

### 9.7 状态提示（#status）动效

当前文字直接出现/消失，建议增加 fade + slide 动效：

```css
#status {
  font-size: 13px;
  color: #16a34a;            /* 成功绿色（从灰色 --muted 改为语义色） */
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.20s ease, transform 0.20s ease;
}

#status.visible {
  opacity: 1;
  transform: translateX(0);
}
```

"已保存"状态应在文字前加一个绿色勾选图标（SVG inline，16px）。

### 9.8 暗色模式（options 页面）

在 `options.css` 中增加暗色变量覆盖：

```css
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg:     #0d1117;
    --card:   #161b22;
    --text:   #e6edf3;
    --muted:  #7d8590;
    --accent: #58a6ff;
    --border: #30363d;
    --input-bg: #0d1117;
  }

  button#save {
    background: #238636;     /* GitHub 暗色模式绿色保存按钮 */
  }

  button#save:hover {
    background: #2ea043;
  }
}
```

---

## 10. 响应式适配

### 10.1 断点定义

采用移动优先策略：

| 断点名 | 最小宽度 | 目标设备 |
|---|---|---|
| sm | 640px | 大屏手机横屏 |
| md | 768px | 平板竖屏 |
| lg | 1024px | 平板横屏 / 小笔记本 |
| xl | 1440px | 标准桌面显示器 |

### 10.2 TOC 浮层响应式规则

#### 视口宽度 < 768px（手机端）

手机端浮标和展开面板的交互策略需要调整：

```
浮标状态：
  - 尺寸：44px（保持不变，满足最小触控目标）
  - 定位：bottom: 16px, right: 16px（更靠近角落）
  - opacity 默认值：0.5（比桌面略高，因触控无 hover 提示）

展开状态：
  - 宽度：calc(100vw - 32px)（全宽减两侧 16px 各留白）
  - 最大宽度：360px
  - 高度：auto，最大高度：50vh
  - 定位：相对视口底部对齐（transform-origin: bottom right）
  - 圆角：16px（更圆润，符合移动端风格）
```

展开时的遮挡问题：手机端面板展开可能覆盖大量内容。建议在手机端改为"底部弹层"布局（从底边展开，类似 Bottom Sheet），而非从角落扩展。此为较大架构变更，可作为后续迭代目标，当前版本可保持角落展开，但缩小 max-height 为 40vh。

#### 视口宽度 768px–1023px（平板）

```
展开宽度：240px
max-height：min(420px, calc(100vh - 80px))
```

#### 视口宽度 1024px–1439px（小桌面）

```
展开宽度：260px
max-height：min(460px, calc(100vh - 64px))
```

#### 视口宽度 >= 1440px（标准桌面）

```
展开宽度：280px
max-height：min(480px, calc(100vh - 64px))
```

### 10.3 Options 页面响应式规则

```css
.page {
  max-width: 640px;
  margin: 40px auto 80px;
  padding: 0 24px;
}

/* 移动端：减少外边距 */
@media (max-width: 640px) {
  .page {
    margin: 16px auto 40px;
    padding: 0 16px;
  }

  .card-header {
    padding: 14px 16px;
  }

  .card-body {
    padding: 14px 16px;
  }
}
```

---

## 11. 无障碍（A11y）规范

### 11.1 TOC 浮层无障碍

#### ARIA 角色与属性

```html
<!-- TOC 容器 -->
<div
  id="github-toc"
  role="complementary"
  aria-label="页面目录导航"
  aria-expanded="false"       <!-- JS 动态更新 -->
>
  <!-- 浮标图标按钮 -->
  <div
    class="toc-icon"
    role="button"
    tabindex="0"
    aria-label="展开目录（或按 Tab 直接进入目录列表）"
    aria-haspopup="true"
  >
    <svg aria-hidden="true" focusable="false">...</svg>
  </div>

  <!-- 展开面板 -->
  <div
    class="toc-tree"
    aria-hidden="true"          <!-- 折叠时隐藏 -->
  >
    <div class="toc-header">
      <span class="toc-title" aria-hidden="true">OUTLINE</span>
      <button
        class="toc-top-button"
        type="button"
        aria-label="回到页面顶部"
      >Top</button>
    </div>

    <ul
      class="toc-list"
      role="list"
      aria-label="文章目录"
    >
      <li class="toc-item level-2" role="listitem">
        <a href="#section-1" aria-current="location"><!-- 当前章节 --></a>
      </li>
    </ul>
  </div>
</div>
```

展开时的 ARIA 状态更新（JS 层需同步）：
- `#github-toc[aria-expanded]` 从 `"false"` 改为 `"true"`
- `.toc-tree[aria-hidden]` 从 `"true"` 改为 `"false"`
- 当前激活条目的 `a` 标签添加 `aria-current="location"`

#### 键盘导航

| 键位 | 行为 |
|---|---|
| Tab | 焦点进入浮标图标按钮 |
| Enter / Space（在图标上） | 展开/折叠面板（hover 模式下同样支持键盘展开） |
| Tab（面板已展开） | 依次聚焦：Top 按钮 → 各条目链接 |
| Escape（面板已展开） | 折叠面板，焦点回到图标按钮 |
| Arrow Up / Down（在条目链接上） | 在条目间上下移动焦点 |

#### Focus Ring 规范

所有可交互元素在获得键盘焦点时须显示可见的 focus ring：

```css
/* 浮标图标（整体容器作为按钮时） */
.toc-icon:focus-visible {
  outline: 2px solid var(--toc-accent);
  outline-offset: 3px;
  border-radius: 50%;
}

/* 条目链接 */
.toc-item a:focus-visible {
  outline: 2px solid var(--toc-accent);
  outline-offset: -2px;
  border-radius: 6px;
}

/* Top 按钮 */
.toc-top-button:focus-visible {
  outline: 2px solid var(--toc-accent);
  outline-offset: 2px;
}

/* 全局：确保 outline 不被宿主页面重置 */
.github-toc *:focus-visible {
  outline: 2px solid var(--toc-accent) !important;
}
```

#### 颜色对比度

所有文字/背景组合须满足 WCAG 2.1 AA 级（正文 4.5:1，大字 3:1）：

| 主题 | 文字颜色 | 背景颜色 | 对比度 | 是否达标 |
|---|---|---|---|---|
| theme-light 正文 | #1a1a1a | rgba(255,255,255,0.95) ≈ #f2f2f2 | ~14:1 | AA |
| theme-light 静音文字 | rgba(26,26,26,0.50) ≈ #8d8d8d | #f2f2f2 | ~3.3:1 | 大字 AA |
| theme-dark 正文 | rgba(255,255,255,0.90) ≈ #e6e6e6 | rgba(28,28,28,0.94) ≈ #1e1e1e | ~12:1 | AA |
| theme-light 激活链接 | #0969da | rgba(255,255,255,0.95) | ~4.9:1 | AA |
| theme-dark 激活链接 | #58a6ff | rgba(28,28,28,0.94) | ~5.2:1 | AA |

注意：`--toc-text-muted` 对比度仅约 3.3:1，只用于装饰性标签（如"OUTLINE"标题、"Top" 按钮默认状态），不用于正文链接文字。

#### 减少动态效果（Reduced Motion）

```css
@media (prefers-reduced-motion: reduce) {
  .github-toc,
  .github-toc *,
  .toc-icon,
  .toc-tree,
  .toc-item,
  .toc-title {
    transition: none !important;
    animation: none !important;
    transition-delay: 0s !important;
  }

  /* 展开/折叠立即生效，无动画 */
  .github-toc.expanded {
    /* 仅保留最终状态，无过渡 */
  }
}
```

### 11.2 独立滚动按钮无障碍

```html
<div
  id="github-sst"
  class="github-sst"
  role="button"
  tabindex="0"
  aria-label="回到页面顶部"
>
  <svg aria-hidden="true" focusable="false">...</svg>
</div>
```

键盘支持：`Enter` / `Space` 触发滚动到顶部。

```css
.github-sst:focus-visible {
  outline: 2px solid var(--toc-accent, #0969da);
  outline-offset: 3px;
  border-radius: 50%;
}
```

### 11.3 Options 页面无障碍

#### Label 与控件关联

所有 `<label>` 通过 `for` 属性与对应控件关联（现有实现已满足）。需补充：
- `showAfterScrollScreens` 输入框增加 `aria-describedby` 指向说明文字
- 禁用状态的 `avoidExistingWidgets` 复选框增加 `aria-disabled="true"` 和说明文字

#### 状态提示

```html
<span
  id="status"
  role="status"         <!-- 已有，正确 -->
  aria-live="polite"    <!-- 已有，正确 -->
  aria-atomic="true"    <!-- 新增：整体播报 -->
>
</span>
```

#### 焦点顺序

设置页面的 Tab 顺序应为：
1. 页面标题区（只读，不可聚焦）
2. 卡片内各表单控件（顺序与视觉顺序一致）
3. 保存按钮
4. 状态提示（只读，不可聚焦）

---

## 12. CSS 变量完整规范

### 12.1 全局基础变量（:root）

```css
:root {
  /* === 动画曲线 === */
  --ease-expand:   cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-collapse: cubic-bezier(0.40, 0.00, 0.60, 1);
  --ease-content:  cubic-bezier(0.00, 0.00, 0.20, 1);
  --ease-standard: cubic-bezier(0.40, 0.00, 0.20, 1);

  /* === 动画时长 === */
  --duration-expand:   0.30s;
  --duration-collapse: 0.22s;
  --duration-fade:     0.20s;
  --duration-hover:    0.15s;
}
```

### 12.2 浮层主题变量（theme-light / theme-dark）

完整变量列表（每个主题均需定义以下所有变量）：

```
背景类：
  --toc-bg                 浮标/面板背景色（半透明）
  --toc-bg-expanded        面板展开时背景色（稍高不透明度）
  --toc-bg-fallback        backdrop-filter 不支持时的降级背景
  --toc-backdrop-filter    磨砂模糊滤镜值

文字类：
  --toc-text               主文字颜色（链接、正文）
  --toc-text-muted         静音/辅助文字颜色
  --toc-text-hover         悬停时文字颜色
  --toc-accent             强调色（激活状态链接、Focus ring）

交互高亮类：
  --toc-highlight          条目 hover 背景
  --toc-highlight-active   激活条目背景

描边类：
  --toc-border             默认描边颜色
  --toc-border-hover       悬停描边颜色
  --toc-divider            面板内分隔线颜色

滚动条类：
  --toc-scrollbar-thumb    滚动条滑块颜色

阴影类：
  --toc-elevation-rest     静止阴影
  --toc-elevation-hover    悬停阴影
  --toc-elevation-press    按下阴影
  --toc-elevation-expanded 展开阴影
```

### 12.3 Options 页面变量（options.css）

```css
:root {
  color-scheme: light dark;
  --bg:        #f5f6f8;
  --card:      #ffffff;
  --text:      #1f2328;
  --muted:     #6b7280;
  --accent:    #1f6feb;
  --border:    #e5e7eb;
  --input-bg:  #ffffff;
  --icon-bg-1: rgba(9, 105, 218, 0.10);     /* 交互卡片图标背景 */
  --icon-bg-2: rgba(227, 119, 12, 0.10);    /* 显示条件卡片图标背景 */
  --icon-bg-3: rgba(100, 110, 120, 0.10);   /* 位置禁用卡片图标背景 */
}
```

---

## 13. 视觉状态速查表

### 13.1 TOC 浮标（Collapsed）

| 状态 | opacity | border-radius | box-shadow | 图标 opacity |
|---|---|---|---|---|
| 隐藏（display:none） | — | — | — | — |
| 默认可见 | 0.45 | 50% | --toc-elevation-rest | 1.0 |
| hover（桌面） | 0.85 | 50% | --toc-elevation-hover | 1.0 |
| active（按下） | 0.95 | 50% | --toc-elevation-press | 1.0 |
| focus-visible | 0.85 | 50% | --toc-elevation-hover + 2px accent outline | 1.0 |
| 输入框聚焦时 | 0.30 | 50% | --toc-elevation-rest | 0.6 |

### 13.2 TOC 面板（Expanded）

| 元素 | 默认 | hover | active/selected | focus-visible |
|---|---|---|---|---|
| 面板容器 | opacity:1, radius:12px | — | — | — |
| .toc-title | color:--toc-text-muted | — | — | — |
| .toc-top-button | ghost style | bg:--toc-highlight | bg:--toc-highlight-active | 2px accent outline |
| .toc-item a（普通） | color:--toc-text, bg:transparent | bg:--toc-highlight, color:--toc-text-hover | — | 2px accent outline |
| .toc-item a（激活） | color:--toc-accent, bg:--toc-highlight-active, weight:500, left-border:2px accent | — | — | 2px accent outline |

### 13.3 独立滚动按钮（#github-sst）

| 状态 | opacity | transform | box-shadow |
|---|---|---|---|
| 隐藏 | 0 | scale(0.8) translateY(8px) | none |
| 显示（默认） | 0.45 | scale(1) | --toc-elevation-rest |
| hover | 0.85 | translateY(-2px) | --toc-elevation-hover |
| active | 0.95 | translateY(0) | --toc-elevation-press |
| focus-visible | 0.85 | none | 2px accent outline |

### 13.4 Options 保存按钮

| 状态 | background | transform | box-shadow |
|---|---|---|---|
| 默认 | #1f6feb | none | 0 1px 3px rgba(31,111,235,0.30) |
| hover | #1b63d3 | translateY(-1px) | 0 3px 8px rgba(31,111,235,0.35) |
| active | #1859bf | translateY(0) | 0 1px 2px rgba(31,111,235,0.20) |
| focus-visible | #1f6feb | none | 0 0 0 3px rgba(31,111,235,0.35) |
| disabled | #93b4f5 | none | none |

---

## 附录：优先级排序与实施建议

### 高优先级（核心体验，建议优先实施）

1. **浮标透明度调整**（0.6 → 0.45，hover 到 0.85）— 改动最小，效果立竿见影
2. **主题系统重构**（去除彩色主题，改为半透明磨砂玻璃）— 解决最主要的侵扰感问题
3. **浮标尺寸缩小**（56px → 44px）— 减少物理占用
4. **展开面板尺寸**（320×480 → 280×auto）— 改善小屏体验

### 中优先级（体验提升）

5. **动画曲线重设计**（非对称展开/折叠，条目入场时序压缩）
6. **TOC 条目间距收紧**（margin:8px → margin:1px + padding调整）
7. **层级缩进缩小**（16px/级 → 12/8px 收敛）
8. **独立按钮（#github-sst）样式统一**

### 低优先级（精打磨）

9. **Options 页面现代化**（卡片图标、表单状态细化、暗色模式）
10. **A11y 完善**（ARIA 属性、键盘导航完整性）
11. **scrollbar 宽度**（8px → 4px）
12. **中文字体栈补充**

---

*本规范基于 Smart TOC & Scroll v2.2 基线问题分析形成，并已按 v2.3 当前落地状态整理，日期：2026-03-16。*
