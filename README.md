# Smart TOC & Scroll

一个面向长文与文档站点的 Chrome 扩展，为网页提供轻量阅读导航。提供`标准面板`与`边缘导航`两种入口；边缘导航分为`邻节预览`、`检索目录`和`页边大纲`，按阅读任务选择。扩展支持主题自适应、hover 标题预览、已有控件避让与 SPA 页面更新，并提供平滑回顶能力。

当前版本：`2.18`（Manifest V3）。

官方网站：[https://oiahoon.github.io/scroll-to-github-top/](https://oiahoon.github.io/scroll-to-github-top/)

## 功能特点

- 智能主题适配
  - 基于页面背景亮度自动选择浅色或深色浮层
  - `标准目录面板` 也会采样所在区域，深色文章中不再出现突兀的纯白面板
  - `Barcode` 会额外采样 rail 附近的局部背景，克制调整短横线、回顶按钮与预览标题的对比度
  - 边缘 rail 本体保持透明背景，避免像独立面板一样遮挡正文
  - 使用克制的中性表面，浮层不再依赖背景模糊
  - DOM 变化后自动重新应用主题
  - TOC 浮标与展开面板使用统一主题

- 回到顶部操作
  - 面板顶部提供 `Top` 和 `Close` 按钮
  - 平滑滚动回到页面顶部
  - 与目录导航处于同一交互上下文
  - 在 `Barcode` 下，回顶按钮以低透明度静态显示，直接可点击；悬停或键盘聚焦时清晰显现，无循环动效或全页指针距离采样

- 目录树功能
  - 自动生成页面目录
  - 智能识别标题层级
  - 平滑的展开/收起动画
  - 标题层级缩进与当前章节高亮
  - 长目录中自动将当前高亮章节滚动到可视区域
  - 点击章节后短暂保持目标高亮，避免平滑滚动期间反馈跳到相邻标题
  - 智能过滤导航栏和侧边栏内容
  - 支持自定义标题样式识别
  - 目录使用单一 Tab 停靠点，方向键、Home / End 选择标题，Esc 收起；折叠的标准目录不进入 Tab 序列

- 阅读导航样式
  - `标准面板`：紧凑浮标按需展开完整目录，适合偶尔跳转；长标题换行，支持 Top / Close
  - `邻节预览`：目标标题与前后各一项，适合附近定位；只复用三个预览节点，移开收起
  - `检索目录`：边缘入口展开可搜索目录，支持本地多关键词、大小写和全角字符匹配；上下键选结果、Enter 跳转、Esc 收起
  - `页边大纲`：优先利用正文外侧留白，可固定对照阅读；长标题换行，当前章节与焦点统一用红色
  - 原滚轮与聚光灯合并为邻节预览，旧 `wheel` 设置自动迁移；`gpt`、`sspai` 存储键保留兼容

- 低干扰与性能约束
  - 默认状态只保留低透明度入口或 rail，预览仅在主动 hover、聚焦、点击或固定后增强
  - 移除滚轮完整标题轨道与逐项波动计算，邻节预览只更新三个复用节点；所有主题均不叠加 `backdrop-filter`，正文指针移动不触发回顶动画帧
  - 每种主题只使用中性色和一种功能强调色；页边大纲的当前章节、焦点与固定状态统一使用明暗自适应红色
  - 系统减少动态效果同时覆盖章节跳转、回顶和目录动画；Esc、点击外部或隐藏导航会同步清理预览层
  - rail 优先占用正文外侧留白；空间不足时贴近视口边缘，并在移动端进一步限制预览宽度

- 性能监控
  - 实时监控目录生成性能
  - 跟踪目录更新性能
  - 监控滚动性能
  - 跟踪 rail pointer 与自适应主题热路径
  - 内存使用情况分析
  - 使用 Ctrl + Shift + P 快捷键查看性能统计
  - 当前章节高亮优先使用 `IntersectionObserver`，减少滚动时的布局读取

## 智能内容识别

- 自动识别主要内容区域
  - 支持多种内容容器选择器
  - 智能分析页面结构
  - 过滤无关内容
  - 适应不同网站布局

- 标题识别增强
  - 支持标准 HTML 标题标签
  - 识别自定义标题样式
  - 基于字体大小和权重判断层级
  - 智能过滤隐藏元素


## 安装方法

1. 从 Chrome 网上应用店安装
   - 访问 [Chrome 网上应用店](https://chromewebstore.google.com/detail/scroll-to-github-top/hkpdpioemdlpimimpjghlcdocmjmpkjc)
   - 点击"添加到 Chrome"

2. 手动安装
   - 下载最新版本的 [ZIP 文件](https://github.com/oiahoon/scroll-to-github-top/releases)
   - 解压文件
   - 打开 Chrome 浏览器，进入扩展程序页面 (chrome://extensions/)
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择解压后的文件夹

## 使用方法

1. 滚动到顶部
   - 展开 TOC 面板后点击顶部 `Top` 按钮
   - 页面会平滑滚动到顶部

2. 使用目录树
   - `标准目录面板` 默认悬停预览，点击浮标可固定展开
   - 也可在设置中改为“点击开关”或“高级：短按回顶 / 长按展开”
   - 点击目录项可以跳转到对应的标题位置
   - 点击面板顶部 `Top` 按钮可直接回顶
   - 点击面板外部区域或按 `Esc` 可收起固定展开的面板
   - 可用 `Esc` 折叠面板，方向键在目录项间移动
   - 当前阅读位置会在目录中高亮
   - `邻节预览` 在附近显示最多三个标题，无滚动轨道或波形
   - `检索目录` 在本页已有标题中搜索，不联网；搜索框和结果分别保留一个 Tab 停靠点，方向键跳过不匹配项
   - `页边大纲` 可用图钉固定，Esc 解除固定并收起


3. 性能监控
   - 使用 Ctrl + Shift + P 快捷键显示/隐藏性能统计面板
   - 查看目录生成、更新和滚动的性能指标
   - 监控内存使用情况（仅在 Chromium 支持 `performance.memory` 时显示）

## 设置

在扩展管理页中打开“扩展程序选项”，可配置：
- 导航类型：标准目录面板、Barcode
- 边缘导航样式：邻节预览、检索目录、页边大纲
- 展开方式：推荐：悬停预览、点击开关、高级：短按回顶 / 长按展开
- TOC 显示条件：滚动到指定屏幕数后显示、最少标题数量
- 浮层位置：左下角 / 右下角
- 禁用域名列表
- 检测页面已有 TOC/回到顶部按钮时自动避开
- 强制显示（忽略页面已有控件）
- 视口内固定保存区、明确的“已保存 / 保存更改”状态与亮暗色系统配色

## 主题系统

- `theme-dark`：用于浅色背景页面
- `theme-light`：用于深色或中色背景页面
- `theme-auto`：保留为跟随系统偏好的兼容类
- 旧版 `theme-blue / theme-green / theme-purple` 仍保留兼容映射
- Barcode 会在标准主题之外做局部 surface 采样；该自适应只影响 rail、独立回顶按钮、`.toc-rail-preview`、`.toc-spotlight-layer` 和 `.toc-gpt-preview` 的 CSS 变量

## 限制与说明

- 目录识别依赖页面结构与样式，极少数站点可能需要额外适配。
- 在内容频繁变动的页面中，目录可能会重新生成。
- 标题结构不变时，目录不会整棵重建，标题观察器也不会重复创建。
- 对 Astro / View Transitions 一类客户端路由站点，已补充页面交换与恢复阶段的 TOC 重建兜底。
- 如果宿主页面在客户端切页时替换 `body` 内节点，TOC 会自动重新挂载而不需要手动刷新。
- 性能面板为开发调试用途，默认隐藏，可通过快捷键开启/关闭。
- 当前已提供兼容性诊断入口：
  - `document.documentElement.dataset.smartTocSkipReason`
  - `window.__SMART_TOC_LAST_SKIP__`
  - `window.__SMART_TOC_WIDGET_DIAGNOSTICS__`
  - `window.__SMART_TOC_INSPECT_WIDGETS__()`
- Barcode 视觉调试可使用 `test-pages/rail-hover-performance.html?preview=sspai&position=right&surface=dark`；`preview=spotlight/gpt/sspai` 切换三种边缘模式（`wheel` 验证旧设置迁移），`position=left/right`、`surface=light/dark/color/lightstrip`、`motion=reduce` 用于复核镜像方向、局部配色与减少动态效果。
- 该测试页顶部提供 `Rail QA` 控制条，可直接切换模式、位置、surface 与减少动态效果状态，便于截图审阅和回归。
- 兼容性检测会优先区分“侧栏导航”和“正文内小目录”，减少误跳过

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更新历史。

## 产品与路线图

- 产品与体验分析：查看 [PRODUCT_UX_ROADMAP.md](PRODUCT_UX_ROADMAP.md)
- 性能与代码质量治理：查看 [PERFORMANCE_CODE_QUALITY_PLAN.md](PERFORMANCE_CODE_QUALITY_PLAN.md)
- Chrome 商店文案草稿：查看 [CHROME_STORE_LISTING.md](CHROME_STORE_LISTING.md)

## 发布

- 本地打包与校验：`./scripts/validate_package.sh`
- GitHub 发布：手动运行 `Package & GitHub Release` 可下载临时 Artifact；推送与 Manifest 一致的 `v*` Tag 会创建带 ZIP 和 SHA-256 附件的 GitHub Release
- Chrome Web Store：从 GitHub 产物下载 ZIP 后手动上传，详见 `CHROME_STORE_RELEASE.md`

## 技术栈

- 原生 JavaScript
- CSS3 动画和过渡效果
- Material Design 风格
- Chrome Extension Manifest V3
- 智能颜色分析算法
- 自适应布局系统
- 性能监控和分析工具

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。
