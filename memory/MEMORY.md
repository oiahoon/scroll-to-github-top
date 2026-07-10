# Smart TOC & Scroll — Agent Memory

## Project Overview
- Chrome extension, Manifest v3, injects into all pages
- Key files: `catalog.js`, `theme.js`, `toc.css`, `themes.css`, `options.html`, `options.css`
- Design spec: `UI_DESIGN_SPEC.md`; Feature inventory: `FEATURE_INVENTORY.md`
- Current release line: v2.9
- Active branch context: `master`

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
- v2.6 阅读进度 hover 预览是固定观察窗 + 标题 track 的 spotlight preview：body-level `.toc-rail-preview` 固定在 rail 纵向中心，`.toc-rail-preview-track` 一次性渲染当前 TOC 的全部标题并通过 transform 滚动，当前项滑入固定 `.toc-rail-preview-focus`；观察窗内通常可见当前项上下各 2 个邻近标题，邻近项渐隐作用在整行 surface（背景、文字），普通邻近项不显示边框。
- Hover 联动防回归契约：rail wave 可以每帧按 pointer Y 连续响应；preview window 不跟随 item 或 pointer 微动，始终以 tocContainer 纵向中心定位；preview track 只在命中新 item 时滚动；focus ring 固定在观察窗中心，只在命中新 item 时 bounce/pulse。不要恢复固定 5 行分片窗口，不要按每 5 项重建预览，不要让普通邻近行出现可见边框。
- v2.7 rail polish：常驻 toc bar 更细更紧凑（3px rail bar、较窄容器和较小 item hit row）；hover wave 最大延展同步收敛，保持低侵扰但仍有清楚反馈。
- v2.7 preview polish：`.toc-rail-preview` 不再使用容器级 `backdrop-filter`，上下 mask 更柔；focus ring shadow 更轻；邻近行有左右淡出；rail preset link 不设置原生 `title`，只用 `aria-label`，避免浏览器 tooltip 遮挡自定义 preview。
- v2.7 post-click hold 契约：rail link click handler 必须先 prime `railPostClickHoldUntil` / `.is-previewed` / preview visible，再执行 `scrollIntoView()`；click 后短暂保持当前 preview 作为落点确认，pointer 仍在 rail 内则由 hover 接管，pointer 离开则 hold 到期后 cleanup。不要把它改成永久 pin，也不要让 smooth scroll 或 mouseleave 立即隐藏 preview。
- 本地视觉/性能测试页：`test-pages/rail-hover-performance.html?position=right&surface=lightstrip`
  - `position=left/right` 用于检查镜像展开和预览方向
  - `surface=light/dark/color/lightstrip` 用于检查局部自适应配色
  - 页面内 `Rail QA` 控制条可直接切换 position、surface 和 reduced motion；控制条会自动避让到 rail 的另一侧
  - 测试页会清理旧注入 DOM，并对本地 CSS/JS 加 cache busting，避免浏览器残留影响判断

## v2.9 Rail QA Controls — Completed (2026-07-10)
- 第 2 轮审阅聚焦阅读进度 rail 的验收流程：此前需要手改 URL 参数才能比较 left/right、surface 和 reduced motion，Chrome/Computer 截图回归不够顺手。
- `test-pages/rail-hover-performance.html` 新增固定 `Rail QA` 控制条，支持 position、surface、reduced motion 页面内切换并同步 URL 参数。
- 控制条在 left rail 时自动靠右，在 right rail 时靠左，避免遮挡被测 rail；移动端控制条可换行并增加正文顶部 padding。
- 该轮不改生产 `catalog.js` / `toc.css` rail 逻辑，只降低后续真实 UI 审阅和截图验证的操作成本。

## v2.8 Options UX Polish — Completed (2026-07-10)
- 第 1 轮 Chrome/Computer UX 审阅聚焦 Options 设置页：首屏暗色模式下白色选中胶囊过亮、底部保存入口需要滚动后确认、英文 footer 与中文设置项混用。
- Options 页面文案统一为更短的中文说明，保留设置含义但减少解释性负担。
- 设置页布局收紧 page margin、row gap、row min-height 与分段按钮宽度；底部 `.settings-footer` 改为 sticky，保存按钮与本地保存说明在滚动配置时持续可见。
- 暗色模式选中态使用 `--active-bg` / `--active-text` 高对比行动色；保存按钮也使用同一行动色，避免浅蓝底白字对比不足。
- “滚动屏数”和“最少标题”数值输入补充 `aria-label`，后续调整设置页时不要移除这些可访问名称。

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
