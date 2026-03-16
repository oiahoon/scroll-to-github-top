# Smart TOC & Scroll — 功能清单（Feature Inventory）

> **版本**：2.3
> **用途**：本文档是重构前的功能基线，涵盖扩展全部行为、交互、配置项与边界情况。重构完成后须逐条核对，确保零功能回归。
> **生成日期**：2026-03-16

---

## 目录

1. [TOC 目录生成与展示](#1-toc-目录生成与展示)
2. [滚动到顶部](#2-滚动到顶部)
3. [主题自适应](#3-主题自适应)
4. [交互模式](#4-交互模式)
5. [设置与配置](#5-设置与配置)
6. [页面导航与 SPA 支持](#6-页面导航与-spa-支持)
7. [性能监控](#7-性能监控)
8. [样式与动画](#8-样式与动画)
9. [智能内容检测](#9-智能内容检测)
10. [域名管理与控制](#10-域名管理与控制)

---

## 1. TOC 目录生成与展示

### 1.1 标准标题提取

**功能描述**：从内容容器中提取 H1–H6 标准 HTML 标题元素，构建目录列表。

**用户故事**：作为一个阅读长篇文章的用户，我希望扩展能自动识别页面中的所有标题，以便在目录面板中快速跳转到任意章节。

**验收标准**：

- Given 页面内容容器中包含 H1–H6 标签，When 扩展初始化完成，Then 目录列表中应出现对应的所有标题条目，且顺序与页面文档顺序一致。
- Given 某个标题的 CSS 样式为 `display: none` 或 `visibility: hidden`，When 扩展提取标题，Then 该标题不应出现在目录中。
- Given 标题元素位于 `nav`、`header`、`footer`、`.sidebar` 等排除容器内，When 扩展提取标题，Then 该标题不应出现在目录中。
- Given 同一标题文本、标签名、offsetTop 组合已被处理过，When 再次触发更新，Then 该标题不应被重复加入目录（去重机制）。
- Given 页面无任何标题，When 扩展生成目录，Then 目录面板内显示"No headers found"空状态提示，包含图标、标题文字与说明段落。

**边界情况**：
- 标题 `textContent` 为空字符串时，跳过该条目，不生成链接。
- 标题没有 `id` 属性时，扩展自动生成 id：将文本转小写后把非字母数字字符替换为 `-`（如 `Hello World!` → `hello-world-`）。
- 重构时需保留去重集合 `lastProcessedHeaders` 在每次 `updateTOC` 前清空的逻辑。

---

### 1.2 自定义标题提取（非标准元素）

**功能描述**：除 H1–H6 外，还识别 class 含 `title`、`heading`、`header` 关键词的元素，按字体大小与粗细推断层级。

**用户故事**：作为使用自定义 CSS 框架（无原生标题标签）的文档网站读者，我希望扩展能识别视觉上的"标题"，以便生成有意义的目录。

**验收标准**：

- Given 页面存在 class 含 `title`/`heading`/`header` 的元素，且 `fontSize >= 16px`、`fontWeight >= 500`，When 扩展提取标题，Then 该元素应出现在目录中。
- Given 自定义标题元素字体尺寸 `>= 24px`，When 构建目录，Then 层级映射为 level-1。
- Given 自定义标题元素字体尺寸在 20–23px，When 构建目录，Then 层级映射为 level-2。
- Given 自定义标题元素字体尺寸在 18–19px，When 构建目录，Then 层级映射为 level-3。
- Given 自定义标题元素字体尺寸在 16–17px，When 构建目录，Then 层级映射为 level-4。
- Given 自定义标题元素字体尺寸低于 16px 或 fontWeight 低于 500，When 扩展提取，Then 该元素不被视为自定义标题。

**边界情况**：
- 自定义标题与标准 H 标签合并后，按文档位置排序（compareDocumentPosition）。
- 自定义标题同样受排除容器规则约束。

---

### 1.3 层级缩进展示

**功能描述**：目录条目按标题层级以 16px 为单位逐级缩进，最多支持 6 级。

**用户故事**：作为阅读多层次文档的用户，我希望目录能以视觉缩进反映文章的层级结构，以便一眼判断章节的从属关系。

**验收标准**：

- Given 目录中存在 level-1 至 level-6 的条目，When 面板展开，Then level-1 无缩进，level-2 缩进 16px，level-3 缩进 32px，level-4 缩进 48px，level-5 缩进 64px，level-6 缩进 80px。
- Given 目录列表内容超出面板高度（max-height: calc(100% - 60px)），When 面板展开，Then 列表区域出现纵向滚动条，支持滚动浏览。

---

### 1.4 当前章节高亮

**功能描述**：滚动页面时，目录中与当前视口最近的标题对应条目高亮显示，并附带左侧指示条。

**用户故事**：作为正在阅读长文章的用户，我希望目录能实时标出我当前所读的章节，以便随时掌握阅读位置。

**验收标准**：

- Given 目录面板已展开且页面包含多个标题，When 用户向下滚动使某标题进入视口顶部（top <= 100px），Then 该标题对应的目录条目获得 `active` class，其他条目移除 `active` class。
- Given 用户点击某个目录链接触发平滑滚动，When 滚动结束，Then 被点击的条目立即获得 `active` class（点击时即时响应，不等待滚动结束）。
- Given 活动条目存在，When 渲染，Then 条目链接文字颜色为 `--toc-text-active`（默认 #0366d6），背景色为 `--toc-highlight-active`（默认 rgba(3,102,214,0.1)），字重 500，左侧有宽 3px、高 16px 的圆角指示条。
- Given 没有任何标题的 top <= 100px（用户在页面顶部），When 调用 updateActiveHeader，Then 不更新任何 active 状态（activeHeader 为 null）。

**边界情况**：
- 距离计算使用 `Math.abs(rect.top)`，取最小距离且 `rect.top <= 100` 的标题；页面顶部时无标题满足条件，active 状态保持不变。
- 滚动监听通过 `requestAnimationFrame` 节流，避免高频触发。

---

### 1.5 目录面板显示条件

**功能描述**：目录面板仅在满足"已滚动超过 N 屏"且"标题数量 >= 最低标题数"两个条件时才显示。

**用户故事**：作为浏览包含少量内容或短页面的用户，我希望扩展不要在不必要的情况下显示目录面板，以免干扰阅读。

**验收标准**：

- Given `minHeaders = 3`，`showAfterScrollScreens = 1`，页面有 5 个标题，When 用户向下滚动超过 1 个屏幕高度，Then 目录容器 `display: block`。
- Given 页面标题数量少于 `minHeaders` 设定值，When 用户无论滚动多少，Then 目录容器保持 `display: none`。
- Given 用户未滚动超过阈值（`scrollTop <= innerHeight * showAfterScrollScreens`），When 页面加载完成，Then 目录容器保持 `display: none`。
- Given 用户滚动超过阈值后又向上滚回顶部，When scroll 事件触发，Then 目录容器重新隐藏（`display: none`）。

**边界情况**：
- `showAfterScrollScreens` 可配置为 0，此时页面一加载即可显示（只要标题数量满足）。
- `minHeaders` 可配置为 0，此时标题数量不作限制。
- 滚动位置取 `document.body.scrollTop + document.documentElement.scrollTop` 之和，兼容不同浏览器滚动模型。

---

### 1.6 目录平滑跳转

**功能描述**：点击目录条目链接后，页面以平滑动画滚动至对应标题位置，而不是瞬间跳转。

**用户故事**：作为阅读文章的用户，我希望点击目录链接时页面平滑滚动到对应章节，以便保持阅读上下文感知。

**验收标准**：

- Given 用户点击某个目录链接，When click 事件触发，Then 调用 `header.scrollIntoView({ behavior: 'smooth' })`，页面平滑滚动至目标标题。
- Given 用户点击目录链接，When click 事件触发，Then 浏览器默认锚点跳转行为（`e.preventDefault()`）被阻止。
- Given 点击后平滑滚动开始，When 滚动进行中，Then 被点击条目立即获得 active 高亮，并调用 `updateActiveHeader` 刷新状态。

---

## 2. 滚动到顶部

### 2.1 独立回到顶部按钮（catalog.js）

**功能描述**：`catalog.js` 在主注入流程中创建一个独立的回到顶部按钮（`#github-sst`），与 TOC 面板互相独立，仅在页面滚动超过 468px 时显示。

**用户故事**：作为浏览长页面的用户，我希望在页面右下角看到一个回到顶部按钮，以便一键返回页面顶部，无需手动滚动。

**验收标准**：

- Given 页面加载完成且 `#github-sst` 尚不存在，When `catalog.js` 执行 `createScrollTopButton()`，Then 在 `document.body` 末尾创建 id 为 `github-sst`、class 为 `github-sst` 的 `div` 元素。
- Given 页面 scrollTop 总计 <= 468px，When scroll 事件触发，Then 按钮 `display: none`。
- Given 页面 scrollTop 总计 > 468px，When scroll 事件触发，Then 按钮 `display: block`。
- Given 按钮可见，When 用户点击按钮，Then 页面以时长 348ms 的自定义缓动动画平滑滚动回顶部（scrollTop = 0）。
- Given `#github-sst` 已经存在于 DOM 中，When `catalog.js` 再次执行 `createScrollTopButton()`，Then 复用现有节点并同步位置 class，不重复创建按钮。

**边界情况**：
- 滚动监听通过 `requestAnimationFrame` 节流（`cancelAnimationFrame` + 新帧），防止高频回调。
- 滚动位置兼容写法：`document.body.scrollTop + document.documentElement.scrollTop`。
- 自定义 `scrollTo` 实现：每 10ms 递归执行，按 `perTick = difference / duration * 10` 步进，`duration <= 0` 时终止；滚动目标元素根据 `document.body.scrollTop === 0` 来判断选 `documentElement` 还是 `body`。

---

### 2.2 TOC 面板内回到顶部按钮（tocTopButton）

**功能描述**：TOC 展开面板顶部标题行右侧有一个"Top"按钮，点击后平滑滚动回页面顶部。

**用户故事**：作为正在查看目录的用户，我希望不需要关闭目录就能直接点击"Top"按钮回到页面顶部，以便快捷操作。

**验收标准**：

- Given TOC 面板已展开，When 用户点击 `.toc-top-button`（文字"Top"），Then 调用 `scrollToTop()`，页面以 348ms 动画平滑滚回顶部，默认浏览器行为被阻止。
- Given 在 `press`（长按）交互模式下，When 用户点击 `.toc-top-button`，Then `tocTree` 上的 click 事件不折叠面板（因为目标是 `.toc-top-button`，被显式排除在折叠逻辑之外）。

---

### 2.3 按钮图标规格

**功能描述**：独立按钮（`#github-sst`）使用 18×18 的向上箭头 SVG 图标；TOC 图标使用 20×20 的三横线菜单 SVG 图标。

**验收标准**：

- Given 独立按钮已注入，When 检查 innerHTML，Then 包含 `viewBox="0 0 1024 1024"` 的向上箭头路径 SVG（宽高各 18px）。
- Given TOC 容器已创建，When 检查 iconContainer，Then 包含 `viewBox="0 0 24 24"` 的三横线菜单 SVG（宽高各 20px）。

---

## 3. 主题自适应

### 3.1 页面主色提取

**功能描述**：`theme.js` 扫描页面所有 `p, h1–h6, span, div` 元素的 `color` computed style，统计出现次数最多的颜色作为页面主色。

**用户故事**：作为在各种风格网站上使用扩展的用户，我希望 TOC 面板能自动匹配页面的整体色调，以便视觉上不显突兀。

**验收标准**：

- Given 页面包含大量文本元素，When `theme.js` 执行，Then 统计所有文本元素的 `getComputedStyle(el).color`，取出现次数最高的颜色作为主色。
- Given 页面无任何文本元素或无法获取颜色，When `selectTheme` 执行，Then 默认返回 `theme-light`。

---

### 3.2 RGB 转 HSL 颜色分析

**功能描述**：将提取到的 RGB 主色转换为 HSL，根据亮度（L）和色相（H）选择最合适的主题。

**验收标准**：

- Given RGB 字符串格式，When 调用 `rgbToHsl`，Then 返回包含 `h`（0–360）、`s`（0–100）、`l`（0–100）的对象。
- Given RGB 字符串无法解析（match 返回 null），When 调用 `rgbToHsl`，Then 返回 `null`，`selectTheme` 回退到 `theme-light`。

---

### 3.3 主题选择规则

**功能描述**：根据 HSL 亮度和色相自动选择 5 种主题之一。

**用户故事**：作为用户，我希望扩展在深色网站上显示浅色面板、在浅色网站上显示深色面板，以保证 TOC 始终清晰可见。

**验收标准**：

- Given 主色亮度 L > 70（浅色文字，通常意味着深色背景），When 选择主题，Then 应用 `theme-light`（白色背景）。
- Given 主色亮度 L < 30（深色文字，通常意味着浅色背景），When 选择主题，Then 应用 `theme-dark`（深灰 #424242 背景）。
- Given 主色亮度在 30–70 之间，色相 H 在 0–60（红/黄色系），When 选择主题，Then 应用 `theme-green`（绿色 #2e7d32 背景）。
- Given 主色亮度在 30–70 之间，色相 H 在 60–180（绿/青色系），When 选择主题，Then 应用 `theme-purple`（紫色 #512da8 背景）。
- Given 主色亮度在 30–70 之间，色相 H 在 180–300（蓝/紫色系），When 选择主题，Then 应用 `theme-blue`（蓝色 #1976d2 背景）。
- Given 主色亮度在 30–70 之间，色相 H 在 300–360 范围，When 选择主题，Then 回退到 `theme-light`。

**重要实现细节**：主题名称作为 CSS class 添加到 `#github-toc` 容器上；应用新主题前先移除所有 5 种主题 class（`theme-dark`, `theme-light`, `theme-blue`, `theme-green`, `theme-purple`），再添加新 class。

---

### 3.4 主题实时响应 DOM 变化

**功能描述**：`theme.js` 通过 `MutationObserver` 监听 `document.body` 的 childList 和 subtree 变化，在页面内容更新时重新检测并应用主题。

**验收标准**：

- Given 页面通过 JavaScript 动态替换了主要内容区域（如 SPA 路由切换），When DOM 发生变化，Then `applyTheme` 重新执行，TOC 主题随之更新。
- Given 扩展注入完成，When 页面初始加载，Then `applyTheme` 立即调用一次（初始应用）。

---

### 3.5 五种主题的 CSS 变量规范

**功能描述**：每种主题通过 CSS 自定义属性（变量）定义背景色、文字色、高亮色、滚动条颜色与三级阴影。

| 主题 | `--toc-bg` | `--toc-text` |
|---|---|---|
| theme-light | #ffffff | #000000 |
| theme-dark | #424242 | #ffffff |
| theme-blue | #1976d2 | #ffffff |
| theme-green | #2e7d32 | #ffffff |
| theme-purple | #512da8 | #ffffff |

**验收标准**：

- Given 任意主题 class 应用于 `#github-toc`，When 检查 CSS 变量，Then `--toc-elevation`、`--toc-elevation-hover`、`--toc-elevation-expanded` 分别对应 Material Design 三级阴影（elevation-1/2/3）。
- Given 主题应用，When TOC 展开，Then 阴影升级为 `--toc-elevation-expanded`（elevation-3：最高层级）。

---

## 4. 交互模式

### 4.1 悬停展开模式（hover）

**功能描述**：鼠标悬停在 TOC 容器上时自动展开面板，移开鼠标后自动折叠；此模式下点击图标触发回到顶部而非展开。

**用户故事**：作为桌面端用户，我希望鼠标悬停就能自动展开目录，无需多余点击，以便快速浏览章节列表。

**验收标准**：

- Given `expandMode = 'hover'`，When 鼠标 mouseenter 至 `.github-toc`，Then `toggleExpanded(true)` 被调用，容器获得 `expanded` class，iconContainer opacity 设为 0。
- Given `expandMode = 'hover'`，When 鼠标 mouseleave 离开 `.github-toc`，Then `toggleExpanded(false)` 被调用，容器移除 `expanded` class，iconContainer opacity 恢复为 1。
- Given `expandMode = 'hover'`，When 用户点击 `.toc-icon`，Then 调用 `scrollToTop()`（回到顶部），不触发展开/折叠。
- Given `expandMode = 'hover'`，When 面板处于展开状态，点击 `.toc-tree` 中非链接、非 `.toc-top-button` 区域，Then 调用 `toggleExpanded(false)`，面板折叠。

---

### 4.2 点击展开模式（click）

**功能描述**：点击 TOC 容器任意区域展开/折叠面板；未展开状态下点击图标（`!expanded`）时触发回到顶部。

**用户故事**：作为触控板用户或偏好精确控制的桌面用户，我希望手动点击才展开目录，避免误触悬停自动展开。

**验收标准**：

- Given `expandMode = 'click'`，When 用户点击 `.github-toc` 非链接区域，Then 调用 `toggleExpanded()`（切换），若已展开则折叠，若已折叠则展开。
- Given `expandMode = 'click'`，面板未展开，When 用户点击 `.toc-icon` 区域，Then 调用 `scrollToTop()`，不展开面板。
- Given `expandMode = 'click'`，When 用户点击 `.toc-item a` 链接，Then click 事件不触发展开/折叠（`isClickOnTocLink` 返回 true，直接 return）。
- Given `expandMode = 'click'`，面板已展开，When 用户点击 `.toc-tree` 中非链接、非 `.toc-top-button` 区域，Then 面板折叠。

---

### 4.3 长按展开模式（press）

**功能描述**：长按（pointerdown 持续 450ms）触发展开/折叠；短按（快速释放）触发回到顶部；离开目标区域取消计时器。

**用户故事**：作为移动端或触摸屏用户，我希望通过长按手势展开目录，通过短按快速回到顶部，以便在触摸设备上高效操作。

**验收标准**：

- Given `expandMode = 'press'`，When 用户 pointerdown 并持续超过 450ms，Then `longPressTriggered = true`，调用 `toggleExpanded()`（切换展开状态）。
- Given `expandMode = 'press'`，When 用户 pointerdown 后在 450ms 内 pointerup（短按），Then `longPressTriggered` 仍为 false，调用 `scrollToTop()`（回到顶部）。
- Given `expandMode = 'press'`，面板已展开，When 短按 `.toc-icon` 区域（pointerup），Then 调用 `toggleExpanded(false)` 折叠面板，不触发 scrollToTop。
- Given 用户 pointerdown 后手指/指针移出容器（pointerleave），When pointerleave 触发，Then 长按计时器被清除，不触发 toggleExpanded。
- Given `expandMode = 'press'`，When 用户点击 `.toc-item a` 链接，Then `isClickOnTocLink` 检查通过，pointerdown 不启动计时器（直接 return）。

**重要状态变量**：`longPressTimer`（setTimeout 引用）、`longPressTriggered`（Boolean，每次 pointerdown 时重置为 false）。

---

### 4.4 输入框焦点自动折叠

**功能描述**：当页面上任意 INPUT 或 TEXTAREA 获得焦点时，TOC 面板自动折叠，避免遮挡输入内容。

**用户故事**：作为在包含搜索框或表单的页面上使用扩展的用户，我希望在点击输入框时 TOC 自动收起，以免遮挡我的输入区域。

**验收标准**：

- Given TOC 面板当前处于展开状态，When 页面上任意 `INPUT` 或 `TEXTAREA` 元素触发 `focusin` 事件，Then `toggleExpanded(false)` 被调用，面板折叠。
- Given 焦点进入其他非输入类元素（如 div、button），When focusin 触发，Then 面板不自动折叠。

---

### 4.5 toggleExpanded 核心逻辑

**功能描述**：统一的展开/折叠控制函数，支持强制指定状态或切换当前状态。

**验收标准**：

- Given 调用 `toggleExpanded(true)`，When 执行，Then `.github-toc` 获得 `expanded` class，`iconContainer.style.opacity = '0'`。
- Given 调用 `toggleExpanded(false)`，When 执行，Then `.github-toc` 移除 `expanded` class，`iconContainer.style.opacity = '1'`。
- Given 调用 `toggleExpanded()`（无参数），When 执行，Then 检测当前是否含 `expanded` class，进行切换。
- Given `tocContainer` 为 null（UI 尚未创建），When 调用 `toggleExpanded`，Then 立即 return，不抛出异常。

---

## 5. 设置与配置

### 5.1 设置页面（options.html）布局

**功能描述**：扩展设置页面包含三个卡片区域：交互方式、显示条件、位置与禁用，以及底部保存按钮和状态提示。

**用户故事**：作为扩展用户，我希望通过一个清晰分组的设置页面管理所有配置项，以便找到并修改我需要的选项。

**验收标准**：

- Given 用户打开扩展设置页，When 页面加载，Then 展示"交互方式"、"显示条件"、"位置与禁用"三个卡片，以及"保存设置"按钮和状态提示区域。
- Given 设置页面加载，When `loadSettings()` 返回数据，Then 所有表单字段（expandMode、minHeaders、showAfterScrollScreens、position、disabledDomains、avoidExistingWidgets、forceShow）填充已保存的值。
- Given `chrome.storage.sync` 不可用（非扩展环境），When 设置页面加载，Then 使用默认值填充表单，不抛出异常。

---

### 5.2 目录展开方式（expandMode）

**功能描述**：下拉选择框，三个选项：悬停展开（hover，默认）、长按展开（press）、点击展开（click）。

**验收标准**：

- Given 页面加载完成，When 已保存值为 `hover`/`press`/`click` 之一，Then 下拉框选中对应选项。
- Given 用户保存非法值（非 `hover`/`press`/`click`），When `normalizeSettings` 执行，Then 重置为默认值 `hover`。

---

### 5.3 滚动后显示屏数（showAfterScrollScreens）

**功能描述**：数字输入框，最小值 0，步长 0.5，控制 TOC 面板在滚动多少屏后才显示。

**验收标准**：

- Given 用户输入 `1.5`，When 保存，Then 存储值为数字 `1.5`，TOC 在 `scrollTop > window.innerHeight * 1.5` 时显示。
- Given 用户输入负数，When `normalizeSettings` 执行，Then 值被 `Math.max(0, value)` 截断为 0。
- Given 输入非有限数（NaN、Infinity），When `normalizeSettings` 执行，Then 重置为默认值 `1`。

---

### 5.4 最少标题数量（minHeaders）

**功能描述**：数字输入框，最小值 0，步长 1，控制页面至少需要多少个标题才显示 TOC。

**验收标准**：

- Given 用户设置 `minHeaders = 5`，当前页面只有 3 个标题，When `shouldShowToc()` 执行，Then 返回 false，TOC 不显示。
- Given 用户设置 `minHeaders = 0`，When 页面有 1 个标题，Then 标题数量条件满足（`1 >= 0`）。
- Given 输入负数，When `normalizeSettings` 执行，Then 截断为 0。
- Given 输入非有限数，When `normalizeSettings` 执行，Then 重置为默认值 `3`。

---

### 5.5 浮层位置（position）

**功能描述**：下拉选择框，两个选项：右下角（right，默认）、左下角（left），控制 TOC 容器的固定定位位置。

**验收标准**：

- Given `position = 'right'`，When UI 创建，Then `.github-toc` 同时具有 `position-right` class（`right: 20px; left: auto`）。
- Given `position = 'left'`，When UI 创建，Then `.github-toc` 具有 `position-left` class（`left: 20px; right: auto`）。
- Given 保存非法 position 值（非 `left`/`right`），When `normalizeSettings` 执行，Then 重置为默认值 `right`。

---

### 5.6 禁用域名（disabledDomains）

**功能描述**：多行文本输入框，接受逗号分隔的域名列表；内容会被解析为字符串数组（去除空白、过滤空项）并存储。

**验收标准**：

- Given 用户输入 `"example.com, docs.example.org"`，When 保存，Then `disabledDomains` 存储为 `["example.com", "docs.example.org"]`。
- Given 用户输入含多余空格或空条目（如 `" , example.com, , "`），When `normalizeDomains` 执行，Then 结果为 `["example.com"]`（trim + filter 空字符串）。
- Given `disabledDomains` 从存储中读取为非数组类型，When `normalizeSettings` 执行，Then 重置为空数组 `[]`。
- Given 加载设置时域名数组存在，When `bindForm` 执行，Then textarea 内容为数组以 `", "` 分隔拼接的字符串。

---

### 5.7 避开已有控件（avoidExistingWidgets）

**功能描述**：复选框，默认勾选；当页面已存在 TOC 或回到顶部按钮时，扩展自动跳过注入。

**验收标准**：

- Given `avoidExistingWidgets = true` 且 `forceShow = false`，页面已有符合条件的 TOC 或回到顶部按钮，When `shouldSkipInjection()` 执行，Then 返回 true，`start()` 函数直接 return，不注入任何 UI。
- Given `avoidExistingWidgets = false`，When `shouldSkipInjection()` 执行，Then 返回 false（不管页面有无已有控件）。
- Given `forceShow = true`，When `shouldSkipInjection()` 执行，Then 直接返回 false（`forceShow` 优先级高于 `avoidExistingWidgets`）。

---

### 5.8 始终显示（forceShow）

**功能描述**：复选框，默认不勾选；勾选后即使页面已有 TOC/回到顶部按钮也强制注入扩展 UI。

**用户故事**：作为在有内置 TOC 的文档网站上偏好使用扩展自有面板的用户，我希望能强制显示扩展 TOC，以便使用统一的交互体验。

**验收标准**：

- Given `forceShow` 复选框被勾选，When `syncForceShow()` 执行，Then `avoidExistingWidgets` 复选框被强制取消勾选并 `disabled = true`。
- Given `forceShow` 复选框被取消勾选，When `syncForceShow()` 执行，Then `avoidExistingWidgets` 复选框重新启用（`disabled = false`）。
- Given `forceShow = true`，`avoidExistingWidgets = true`，When `shouldSkipInjection()` 执行，Then 因为 `forceShow` 优先级最高直接返回 false，照常注入 UI。

**注意**：`forceShow` 与 `avoidExistingWidgets` 为互斥配置，设置页面在 UI 层强制互斥，但存储层两者独立保存。

---

### 5.9 保存与状态提示

**功能描述**：点击"保存设置"按钮后将当前表单数据写入 `chrome.storage.sync`，并在按钮旁显示"已保存"提示 1500ms 后自动消失。

**验收标准**：

- Given 用户修改任意设置项，When 点击"保存设置"，Then `chrome.storage.sync.set` 被调用，写入所有 7 个字段的最新值。
- Given 保存操作完成，When `renderStatus('已保存')` 被调用，Then `#status` 元素显示"已保存"文字，1500ms 后文字自动清空。
- Given `chrome.storage.sync` 不可用，When 点击保存，Then `saveSettings` 直接 resolve，不抛出异常，状态提示仍然显示。

---

### 5.10 默认设置值

所有配置项的默认值（用于 `normalizeSettings` 的 fallback 和 storage 初始读取）：

| 配置项 | 默认值 | 类型 |
|---|---|---|
| expandMode | `'hover'` | string |
| minHeaders | `3` | number |
| showAfterScrollScreens | `1` | number |
| position | `'right'` | string |
| disabledDomains | `[]` | string[] |
| avoidExistingWidgets | `true` | boolean |
| forceShow | `false` | boolean |

---

## 6. 页面导航与 SPA 支持

### 6.1 History API 拦截

**功能描述**：重写 `history.pushState` 和 `history.replaceState`，在路由切换后 100ms 延迟重新初始化 TOC。

**用户故事**：作为使用 React Router、Vue Router 等前端路由框架的 SPA 用户，我希望导航到新页面后 TOC 能自动更新，以便始终反映当前页面的章节结构。

**验收标准**：

- Given 应用调用 `history.pushState`，When 调用后，Then 原始 `pushState` 正常执行，同时 100ms 后触发 `reinitializeTOC()`。
- Given 应用调用 `history.replaceState`，When 调用后，Then 原始 `replaceState` 正常执行，同时 100ms 后触发 `reinitializeTOC()`。
- Given 用户点击浏览器后退/前进按钮，When `popstate` 事件触发，Then 100ms 后触发 `reinitializeTOC()`。

---

### 6.2 GitHub 专用 PJAX/Turbo 监听

**功能描述**：在 `github.com` 域名下额外监听 `pjax:start`、`pjax:end`、`turbo:load`、`ajaxComplete` 事件，以应对 GitHub 的 Turbo/Pjax 导航机制。

**用户故事**：作为 GitHub 用户，我希望在点击仓库文件树、切换分支等 GitHub 内部导航操作后，TOC 能自动更新为新页面的章节，以便在 GitHub 上流畅使用扩展。

**验收标准**：

- Given 当前域名为 `github.com`，When `pjax:start` 事件触发，Then 调用 `cleanup()`（断开 MutationObserver，清除 timeout，清空 lastProcessedHeaders）。
- Given 当前域名为 `github.com`，When `pjax:end` 事件触发，Then 100ms 后触发 `reinitializeTOC()`。
- Given 当前域名为 `github.com`，When `turbo:load` 事件触发，Then 100ms 后触发 `reinitializeTOC()`。
- Given 当前域名为 `github.com`，When `ajaxComplete` 事件触发，Then 100ms 后触发 `reinitializeTOC()`。
- Given 当前域名不是 `github.com`，When `setupGitHubListener()` 调用，Then 上述事件监听器一律不添加。

---

### 6.3 GitHub 容器轮询检测

**功能描述**：在 `github.com` 上启动每秒一次的轮询，检测内容容器是否发生变化，若变化则重新初始化 TOC。

**验收标准**：

- Given 当前域名为 `github.com`，When `initialize()` 被调用，Then 启动 `setInterval`，每 1000ms 执行一次容器检测。
- Given 轮询中检测到 `findContentContainer()` 返回值与 `contentContainer` 不同，When 下次轮询，Then 调用 `reinitializeTOC()`，更新 contentContainer。
- Given 当前域名不是 `github.com`，When `initialize()` 被调用，Then 不启动轮询。

---

### 6.4 MutationObserver DOM 变化监听

**功能描述**：监听整个 `document.documentElement` 的 childList、subtree、characterData 变化，检测到 DOM 变化或 URL 变化后延迟更新 TOC。

**验收标准**：

- Given MutationObserver 已挂载，When 页面 DOM 发生 childList 或 subtree 变化，Then 经过 250ms 防抖后，100ms 延迟触发 `reinitializeTOC()`。
- Given MutationObserver 已挂载，When 检测到 URL 发生变化（`checkUrlChange()` 返回 true），Then 触发 `reinitializeTOC()`。
- Given `reinitializeTOC()` 调用，When 执行，Then 先调用 `cleanup()` 断开旧 observer，再 `findContentContainer()`，再 `setupObserver()`，再 `updateTOC()`。

**边界情况**：
- `debounce` 延迟为 250ms，防止页面频繁 DOM 更新导致 TOC 反复重建。
- 每次 `updateTOC` 前清空 `lastProcessedHeaders` Set，确保重新扫描所有标题。

---

### 6.5 防重复注入

**功能描述**：脚本执行时首先检查 `#github-toc` 是否已存在，已存在则立即退出整个 IIFE，避免重复注入。

**验收标准**：

- Given `#github-toc` 已存在于 DOM 中，When `catalog.js` 再次执行，Then 立即 return，不创建新的 TOC 容器，不重复绑定事件。
- Given `#github-sst` 已存在于 DOM 中，When `catalog.js` 再次执行 `createScrollTopButton()`，Then 复用现有按钮节点，不创建新按钮。

---

## 7. 性能监控

### 7.1 性能指标采集

**功能描述**：使用 `measurePerformance` 函数包裹三类关键操作：TOC 生成（`tocGeneration`）、TOC 更新（`tocUpdate`）、滚动性能（`scrollPerformance`），记录每次操作的耗时（ms）与内存变化（bytes）。

**用户故事**：作为扩展开发者，我希望能在页面上实时查看 TOC 各操作的性能统计，以便识别性能瓶颈并做针对性优化。

**验收标准**：

- Given `measurePerformance('tocUpdate', callback)` 被调用，When callback 执行，Then 记录 `{timestamp, duration, memoryDelta, memoryUsage}` 到 `performanceMetrics.tocUpdate` 数组。
- Given `performance.memory` 不可用（非 Chromium 环境），When `measurePerformance` 执行，Then `startMemory` 和 `endMemory` 均为 0，`memoryDelta = 0`，不抛出异常。
- Given 某个指标数组长度超过 100 条，When 新记录写入，Then 移除最老的一条（`shift()`），保持最多 100 条。

---

### 7.2 性能统计面板

**功能描述**：在页面左下角注入一个隐藏的性能统计浮层（`#toc-performance-stats`），通过快捷键 Ctrl+Shift+P 切换显示/隐藏，每秒刷新一次统计数据。

**验收标准**：

- Given 扩展初始化完成，When `displayPerformanceStats()` 被调用，Then `#toc-performance-stats` 元素被添加到 `document.body`，初始 `display: none`。
- Given 性能面板已注入，When 用户按下 Ctrl+Shift+P，Then 面板在 `display: none` 和 `display: block` 之间切换。
- Given 面板处于 `display: block`，When 每秒定时刷新，Then 面板 innerHTML 更新，显示 Generation、Updates、Scroll Performance 三组统计（count、avgDuration、minDuration、maxDuration、memoryUsage/memoryDelta），以 MB 为单位格式化内存，以 ms 为单位格式化时间（保留 2 位小数）。
- Given 所有指标均无数据（全为 null），When 定时刷新，Then 面板内容不更新（`if (!stats.generation && !stats.update && !stats.scroll) return`）。

---

### 7.3 性能统计计算

**功能描述**：`getPerformanceStats` 根据历史记录计算 count、平均耗时、最短/最长耗时、平均内存变化、最新内存占用。

**验收标准**：

- Given 某指标数组为空，When `getPerformanceStats` 被调用，Then 返回 `null`。
- Given 某指标数组有 N 条记录，When `getPerformanceStats` 被调用，Then 返回包含 count=N、avgDuration（所有 duration 均值）、minDuration（最小值）、maxDuration（最大值）、avgMemoryDelta（均值）、latestMemoryUsage（最后一条）的对象。

---

## 8. 样式与动画

### 8.1 圆形浮标基础样式

**功能描述**：未展开时，TOC 容器呈直径 56px 的圆形浮标，固定在屏幕角落，不透明度 0.6，z-index 9999。

**验收标准**：

- Given TOC 容器已创建，When 未展开，Then 元素为 `position: fixed`，`width: 56px`，`height: 56px`，`border-radius: 50%`，`opacity: 0.6`，`z-index: 9999`。
- Given 用户鼠标悬停在圆形浮标上（CSS :hover），When hover 状态，Then `opacity` 升至 1，`box-shadow` 升级为 `--toc-elevation-hover`（elevation-2）。
- Given 容器为 `position-right`，When 渲染，Then `right: 20px; left: auto`（距右边 20px、距底部 20px）。
- Given 容器为 `position-left`，When 渲染，Then `left: 20px; right: auto`（距左边 20px、距底部 20px）。

---

### 8.2 展开动画

**功能描述**：TOC 容器从圆形扩展为 320×480px 的矩形卡片，使用 `cubic-bezier(0.0, 0.0, 0.2, 1)` 缓动，过渡时长 0.3s。

**验收标准**：

- Given `.github-toc` 获得 `expanded` class，When CSS transition 执行，Then 容器从 56×56px 过渡到 320×480px，border-radius 从 50% 过渡到 8px，opacity 升至 1，box-shadow 升级为 `--toc-elevation-expanded`（elevation-3）。
- Given `.github-toc` 失去 `expanded` class，When CSS transition 执行，Then 容器反向从 320×480 过渡回 56×56，圆角、透明度同步复原。
- Given `will-change: transform, width, height, border-radius` 已声明，When 动画执行，Then GPU 加速层提前创建，避免合成层抖动。

---

### 8.3 图标过渡动画

**功能描述**：展开时菜单图标淡出缩小（opacity: 0，scale: 0.8）；折叠时图标淡入恢复。

**验收标准**：

- Given `.github-toc.expanded svg`，When expanded class 存在，Then SVG `opacity: 0`，`transform: translate(-50%, -50%) scale(0.8)`。
- Given expanded class 移除，When transition 执行，Then SVG 恢复 opacity 和 scale（通过 `.toc-icon` 的 `transition: all 0.3s var(--ease-out)` 驱动）。

---

### 8.4 目录内容入场动画（Staggered Animation）

**功能描述**：展开时，toc-tree 整体放大淡入，标题条目依次以 50ms 间隔错落动画滑入（translateX -10px → 0）。

**验收标准**：

- Given `.github-toc.expanded .toc-tree`，When expanded，Then toc-tree `opacity: 1`，`transform: scale(1)`（从 scale(0.8) 过渡）；pointer-events 从 none 变为 auto。
- Given `.github-toc.expanded .toc-title`，When expanded，Then `opacity: 1`，`transform: translateY(0)`（从 translateY(-10px) 过渡）。
- Given `.github-toc.expanded .toc-item`，When expanded，Then `opacity: 1`，`transform: translateX(0)`（从 translateX(-10px) 过渡）。
- Given 前 10 个 toc-item，When expanded，Then 第 1 个延迟 0.05s，第 2 个延迟 0.1s，…，第 10 个延迟 0.5s（阶梯式 transition-delay）。
- Given 第 11 个及以后的 toc-item（无显式 transition-delay 规则），When expanded，Then 无额外延迟（使用基础 0.3s transition）。

---

### 8.5 自定义滚动条样式

**功能描述**：toc-list 区域使用 `::-webkit-scrollbar` 定制 8px 宽、圆角 4px 的滚动条，颜色跟随主题 CSS 变量。

**验收标准**：

- Given toc-list 内容超出 `max-height: calc(100% - 60px)`，When 出现滚动条，Then 滚动条宽度 8px，轨道颜色 `--toc-scrollbar-track`，滑块颜色 `--toc-scrollbar-thumb`，均具有 4px 圆角。

---

### 8.6 字体与样式隔离

**功能描述**：TOC 容器内所有元素强制使用 Roboto/Segoe UI/Arial 字体栈，通过 `!important` 防止宿主页面 CSS 污染；图标容器通过 `all: initial` 重置所有继承样式。

**验收标准**：

- Given 宿主页面为任意样式的网站，When TOC 渲染，Then `.github-toc, .github-toc *` 字体强制为 `'Roboto', 'Segoe UI', 'Arial', 'Helvetica Neue', Arial, sans-serif`。
- Given 宿主页面对 `div` 有全局样式，When TOC icon 渲染，Then `.github-toc .toc-icon` 通过 `all: initial` 重置，重新声明位置、尺寸、z-index 等必要属性。
- Given 宿主页面对 SVG 有 fill/color 等样式，When TOC 图标渲染，Then SVG 的 fill/color/stroke 均通过 `!important` 强制为 `var(--toc-text)`，background/box-shadow/border/outline 强制为 none。
- Given 图标容器 `.toc-icon::before` 和 `.toc-icon::after` 伪元素，When 宿主页面有全局伪元素样式，Then 两者被强制 `display: none !important; content: none !important`。

---

### 8.7 文字截断

**功能描述**：目录链接文字超出行宽时自动截断并显示省略号。

**验收标准**：

- Given 标题文字较长超出 toc-item 宽度，When 渲染，Then `white-space: nowrap`、`overflow: hidden`、`text-overflow: ellipsis` 共同作用，文字末尾显示 `...`。

---

### 8.8 Material Design 阴影变量

**功能描述**：:root 定义三个标准 Material Design 阴影变量（elevation-1/2/3），供各主题的 toc-elevation 系列变量引用。

**验收标准**：

- Given `:root` CSS，Then `--elevation-1`、`--elevation-2`、`--elevation-3` 均已定义，遵循 Material Design 阴影规范（多层 rgba box-shadow）。
- Given `--ease-out: cubic-bezier(0.0, 0.0, 0.2, 1)` 和 `--ease-in: cubic-bezier(0.4, 0.0, 1, 1)` 均已定义。

---

## 9. 智能内容检测

### 9.1 内容容器查找策略

**功能描述**：`findContentContainer()` 按三个层次逐步回退查找最合适的内容容器。

**用户故事**：作为访问各类网站（博客、文档、GitHub、技术文章）的用户，我希望扩展能准确识别页面的主要内容区域，以便只抓取正文标题而非导航菜单标题。

**验收标准**：

- Given 页面存在 `mainContainers` 列表中的任意选择器匹配元素（按列表顺序优先），When `findContentContainer()` 执行，Then 返回第一个匹配到的元素。
- Given 前述列表无匹配，When 执行，Then 在 `article, main, [role="main"], [role="article"], [role="document"]` 中选文本内容最长的元素（textContent.length 最大值）。
- Given 上述两步均无结果，When 执行，Then 扫描所有 `div, section, article, main` 元素，选包含 H 标签数量最多的元素作为容器。
- Given 三个层次均无合适结果，When 执行，Then 返回 `document.body` 作为兜底容器。

**mainContainers 选择器完整列表**（共 27 项，顺序即优先级）：
`main-container`, `body-container`, `application-main`, `main-content`, `content`, `article`, `main`, `.markdown-body`, `#readme`, `.repository-content`, `.js-repo-root`, `.documentation`, `.docs-content`, `.doc-content`, `.doc-body`, `.document-body`, `.article-content`, `.post-content`, `.entry-content`, `.blog-post`, `.post-body`, `.article-body`, `.entry-body`, `.technical-docs`, `.api-docs`, `.guide-content`, `.tutorial-content`, `.mdx-content`, `.md-content`, `.rst-content`, `.asciidoc-content`, `[role="main"]`, `[role="article"]`, `[role="document"]`, `[itemprop="articleBody"]`, `[itemprop="mainContentOfPage"]`

---

### 9.2 排除容器规则

**功能描述**：标题提取时递归检查每个标题的祖先元素，若祖先匹配 `excludeContainers` 列表中任意选择器，则排除该标题。

**验收标准**：

- Given 标题在 `nav`、`header`、`footer`、`.sidebar`、`.toc` 等导航/侧边栏容器内，When `getHeaders()` 执行，Then 该标题被过滤，不出现在目录中。
- Given 标题在 `[role="navigation"]`、`[role="banner"]`、`[role="contentinfo"]`、`[role="complementary"]` 等语义角色容器内，When `getHeaders()` 执行，Then 该标题被过滤。
- Given 标题在 GitHub 特定容器（`.js-header-wrapper`、`.js-repo-nav`、`.js-site-header`、`.js-site-footer`、`.js-notification-shelf`）内，When `getHeaders()` 执行，Then 该标题被过滤。
- Given 标题的祖先链中无任何 excludeContainers 匹配项，When `getHeaders()` 执行，Then 标题正常纳入目录。

---

### 9.3 已有 TOC 检测

**功能描述**：检测页面是否已存在符合条件的侧边栏 TOC，判断标准为：元素可见（width > 40 && height > 40）、包含 3+ 个锚链接、位于页面边缘或固定/sticky 定位的侧边栏中。

**验收标准**：

- Given 页面有 `#toc`、`#table-of-contents`、`.toc`、`.toc-container` 等匹配元素，When `hasExistingTOC()` 执行，Then 检查每个候选元素是否满足 `isVisible + hasTocLinks + isLikelySidebarToc`。
- Given 候选元素 `display: none` 或尺寸 <= 40px，When `isVisible()` 执行，Then 返回 false，该元素不计入"已有 TOC"。
- Given 候选元素包含的 `a[href^="#"]` 少于 3 个，When `hasTocLinks()` 执行，Then 返回 false。
- Given 候选元素所有锚链接的 href 都等于 `"#"`（无实际目标），When `hasTocLinks()` 执行，Then 返回 false（要求至少一个 href.length > 1）。
- Given 候选元素 `left < viewportWidth * 35%` 或 `right > viewportWidth * 65%`（位于边缘），且 position 为 fixed/sticky 或位于 `aside, nav, .sidebar` 等侧边栏容器内，When `isLikelySidebarToc()` 执行，Then 返回 true。

---

### 9.4 已有回到顶部按钮检测

**功能描述**：检测页面是否已存在固定/sticky 定位且尺寸 >= 32px 的回到顶部按钮。

**验收标准**：

- Given 页面有 `#scroll-to-top`、`#back-to-top`、`.scroll-to-top`、`.back-to-top`、`.scrolltop`、`.to-top`、`[data-scroll-to-top]`、`[aria-label*="scroll to top" i]` 匹配元素，When `hasExistingScrollToTop()` 执行，Then 检查元素是否满足 `isVisible + isFixedOrSticky`。
- Given 候选元素 `position: fixed` 或 `position: sticky`，且宽高均 >= 32px，When `isFixedOrSticky()` 执行，Then 返回 true。
- Given 候选元素 `position: relative`（非固定），When `isFixedOrSticky()` 执行，Then 返回 false。

---

### 9.5 设置加载与 normalizeSettings 保护

**功能描述**：从 `chrome.storage.sync` 加载设置后，经 `normalizeSettings` 严格校验所有字段类型和取值范围，防止非法配置导致运行时错误。

**验收标准**：

- Given `chrome.storage.sync` 不可用，When `loadSettings()` 执行，Then resolve 默认设置对象，不抛出异常。
- Given 设置加载失败（Promise rejected），When `start()` 调用链中的 catch 执行，Then 使用默认设置 `{ ...defaultSettings }` 继续执行 `start()`。
- Given 所有字段都有效，When `normalizeSettings` 执行，Then 各字段值保持不变，仅补全缺失字段为默认值。

---

## 10. 域名管理与控制

### 10.1 域名禁用检测

**功能描述**：`isDomainDisabled()` 检查当前页面 `hostname` 是否在 `disabledDomains` 数组中，若匹配则 `start()` 立即退出，不注入任何 UI。

**用户故事**：作为在某些特定网站上不需要 TOC 功能的用户，我希望能将这些网站加入黑名单，以便在这些站点上扩展完全静默。

**验收标准**：

- Given `disabledDomains = ["example.com"]`，当前 `hostname = "example.com"`，When `isDomainDisabled()` 执行，Then 返回 true，`start()` 函数立即 return，不创建任何 DOM 元素，不绑定任何事件。
- Given `disabledDomains = ["example.com"]`，当前 `hostname = "sub.example.com"`，When `isDomainDisabled()` 执行，Then 返回 false（精确匹配，子域名不匹配父域名）。
- Given `disabledDomains = []` 或 `undefined`，When `isDomainDisabled()` 执行，Then 返回 false，不影响正常运行。
- Given `disabledDomains` 为非数组类型，When `normalizeSettings` 执行，Then 重置为 `[]`，`isDomainDisabled()` 返回 false。

---

### 10.2 扩展权限范围

**功能描述**：manifest 声明的权限决定扩展可访问的能力边界。

**验收标准**：

- Given manifest `"permissions": ["activeTab", "storage"]`，When 扩展运行，Then 可调用 `chrome.storage.sync`（设置读写），不需要额外权限声明。
- Given manifest `"host_permissions": ["<all_urls>"]`，When 扩展运行，Then content scripts 注入到所有 http/https 页面，包括非 GitHub 网站。
- Given manifest `"content_scripts": [{matches: ["<all_urls>"], js: ["catalog.js", "theme.js"], css: ["toc.css", "themes.css"]}]`，When 页面加载，Then `catalog.js` 和 `theme.js` 按序注入，`toc.css` 和 `themes.css` 同步注入为页面样式，且独立滚动按钮由 `catalog.js` 创建。

---

### 10.3 IIFE 作用域隔离

**功能描述**：`catalog.js` 与 `theme.js` 均包裹在立即执行函数表达式（IIFE）中，防止全局变量污染宿主页面。

**验收标准**：

- Given 扩展注入完成，When 在宿主页面全局 `window` 对象上检查，Then 不存在 `tocContainer`、`iconContainer`、`settings` 等扩展内部变量。
- Given 多个 content script 同时运行（catalog.js 和 theme.js），When 各自执行，Then 互相不污染对方的局部变量。

---

## 附录 A：关键函数索引

| 函数名 | 文件 | 职责 |
|---|---|---|
| `start()` | catalog.js | 总入口：检查禁用域名 → 检查已有控件 → 创建 UI → 绑定交互 → 初始化 |
| `createUI()` | catalog.js | 创建 #github-toc 容器、图标、toc-tree、toc-title、toc-top-button、toc-list |
| `initialize()` | catalog.js | 查找容器 → 启动 MutationObserver → 绑定 History/GitHub 监听 → 注入性能面板 |
| `updateTOC()` | catalog.js | 清理 → 获取标题 → 渲染条目 → 更新高亮 → 更新可见性；被 measurePerformance('tocUpdate') 包裹 |
| `reinitializeTOC()` | catalog.js | cleanup → findContentContainer → setupObserver → updateTOC；被 measurePerformance('tocGeneration') 包裹 |
| `getHeaders()` | catalog.js | 合并标准+自定义标题 → 过滤不可见/排除容器/重复项 → 按文档顺序排序 |
| `findContentContainer()` | catalog.js | 三层回退策略查找最优内容容器 |
| `updateActiveHeader()` | catalog.js | 根据滚动位置找最近标题（top <= 100）并更新 active class |
| `shouldShowToc()` | catalog.js | 判断是否满足显示条件（headerCount >= minHeaders && scrollTop > threshold） |
| `setupInteractions()` | catalog.js | 根据 expandMode 绑定 hover/click/press 三种交互逻辑 |
| `toggleExpanded(force?)` | catalog.js | 核心展开/折叠逻辑 |
| `scrollToTop()` | catalog.js | 选择正确的滚动容器并调用自定义 scrollTo 动画 |
| `scrollTo(el, to, duration)` | catalog.js | 递归定时滚动动画，每 10ms 步进，duration <= 0 时终止 |
| `createScrollTopButton()` | catalog.js | 创建或复用独立回顶按钮 `#github-sst`，并同步左右位置 |
| `setupObserver()` | catalog.js | 创建/重建 MutationObserver，debounce 250ms |
| `setupHistoryListener()` | catalog.js | 拦截 pushState/replaceState + popstate |
| `setupGitHubListener()` | catalog.js | GitHub pjax/turbo/ajax 事件监听（仅 github.com） |
| `normalizeSettings(input)` | catalog.js | 校验并修正所有配置字段 |
| `loadSettings()` | catalog.js / options.js | 从 chrome.storage.sync 读取设置，不可用时 resolve 默认值 |
| `isDomainDisabled()` | catalog.js | 精确匹配 hostname 是否在黑名单中 |
| `shouldSkipInjection()` | catalog.js | 综合 forceShow、avoidExistingWidgets、hasExistingTOC/ScrollToTop |
| `hasExistingTOC()` | catalog.js | 检测页面已有侧边栏 TOC |
| `hasExistingScrollToTop()` | catalog.js | 检测页面已有固定回到顶部按钮 |
| `measurePerformance(name, cb)` | catalog.js | 性能采集包装器 |
| `displayPerformanceStats()` | catalog.js | 注入性能面板并绑定 Ctrl+Shift+P 快捷键 |
| `selectTheme()` | theme.js | 根据 HSL 分析选择主题名 |
| `applyTheme()` | theme.js | 移除旧主题 class，添加新主题 class 到 #github-toc |
| `bindForm(settings)` | options.js | 将设置对象填充到设置页面所有表单字段 |
| `syncForceShow()` | options.js | forceShow 勾选时禁用并取消 avoidExistingWidgets |
| `normalizeDomains(input)` | options.js | 解析逗号分隔域名字符串为数组 |

---

## 附录 B：默认设置与合法值范围

| 配置项 | 默认值 | 合法值 | 非法时行为 |
|---|---|---|---|
| `expandMode` | `'hover'` | `'hover' \| 'press' \| 'click'` | 重置为 `'hover'` |
| `minHeaders` | `3` | 有限正数或 0 | 非有限数重置为 3；负数截断为 0 |
| `showAfterScrollScreens` | `1` | 有限正数或 0 | 非有限数重置为 1；负数截断为 0 |
| `position` | `'right'` | `'right' \| 'left'` | 重置为 `'right'` |
| `disabledDomains` | `[]` | string[] | 非数组重置为 `[]` |
| `avoidExistingWidgets` | `true` | boolean | — |
| `forceShow` | `false` | boolean | — |

---

## 附录 C：扩展清单（manifest.json）关键信息

- **Manifest 版本**：3
- **扩展名称**：Smart TOC & Scroll
- **版本号**：2.3
- **所需权限**：`activeTab`、`storage`
- **主机权限**：`<all_urls>`（所有 HTTP/HTTPS 页面）
- **Options 页面**：`options.html`
- **图标规格**：16px、32px、48px、128px（PNG 格式，路径 `icons/icon{size}.png`）
- **Content Scripts 注入**：`catalog.js`、`theme.js`（JS）+ `toc.css`、`themes.css`（CSS）

> **注意**：独立回顶按钮已并入 `catalog.js` 主注入流程，`manifest.json` 无需单独声明 `button.js`。

---

*本文档由 Claude Code 基于源码分析自动生成，生成日期：2026-03-16。*
