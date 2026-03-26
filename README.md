# Smart TOC & Scroll

一个面向长文与文档站点的 Chrome 扩展，为网页提供轻量阅读导航。当前支持两种阅读导航样式：`标准目录面板` 与 `阅读进度目录（SSPAI）`。扩展支持主题自适应、选项配置、已有控件避让与 SPA 页面更新，并提供平滑回顶能力。

## 功能特点

- 智能主题适配
  - 基于页面背景亮度自动选择浅色或深色浮层
  - 使用磨砂玻璃风格主题变量
  - DOM 变化后自动重新应用主题
  - TOC 浮标与展开面板使用统一主题

- 回到顶部操作
  - 面板顶部提供 `Top` 按钮
  - 平滑滚动回到页面顶部
  - 避免在页面角落再增加第二个浮动按钮
  - 与目录导航处于同一交互上下文
  - 在 `阅读进度目录（SSPAI）` 样式下，回顶按钮可独立显示

- 目录树功能
  - 自动生成页面目录
  - 智能识别标题层级
  - 平滑的展开/收起动画
  - 标题层级缩进与当前章节高亮
  - 长目录中自动将当前高亮章节滚动到可视区域
  - 智能过滤导航栏和侧边栏内容
  - 支持自定义标题样式识别
  - 支持键盘导航、ARIA 属性与焦点态

- 阅读导航样式
  - `标准目录面板`：适合文档站、博客和技术内容页面
  - `阅读进度目录（SSPAI）`：适合沉浸式长文阅读，默认用短横线表达章节位置，悬停后显示标题

- 性能监控
  - 实时监控目录生成性能
  - 跟踪目录更新性能
  - 监控滚动性能
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
   - `阅读进度目录（SSPAI）` 默认以低侵扰短横线显示，悬停后展开标题，点击标题跳转

3. 性能监控
   - 使用 Ctrl + Shift + P 快捷键显示/隐藏性能统计面板
   - 查看目录生成、更新和滚动的性能指标
   - 监控内存使用情况（仅在 Chromium 支持 `performance.memory` 时显示）

## 设置

在扩展管理页中打开“扩展程序选项”，可配置：
- 阅读导航样式：标准目录面板、阅读进度目录（SSPAI）
- 展开方式：推荐：悬停预览、点击开关、高级：短按回顶 / 长按展开
- TOC 显示条件：滚动到指定屏幕数后显示、最少标题数量
- 浮层位置：左下角 / 右下角
- 禁用域名列表
- 检测页面已有 TOC/回到顶部按钮时自动避开
- 强制显示（忽略页面已有控件）
- 现代化 Options 页面与亮暗色系统配色

## 主题系统

- `theme-dark`：用于浅色背景页面
- `theme-light`：用于深色或中色背景页面
- `theme-auto`：保留为跟随系统偏好的兼容类
- 旧版 `theme-blue / theme-green / theme-purple` 仍保留兼容映射

## 限制与说明

- 目录识别依赖页面结构与样式，极少数站点可能需要额外适配。
- 在内容频繁变动的页面中，目录可能会重新生成。
- 标题结构不变时，目录不会整棵重建，标题观察器也不会重复创建。
- 对 Astro / View Transitions 一类客户端路由站点，已补充页面交换与恢复阶段的 TOC 重建兜底。
- 性能面板为开发调试用途，默认隐藏，可通过快捷键开启/关闭。
- 当前已提供兼容性诊断入口：
  - `document.documentElement.dataset.smartTocSkipReason`
  - `window.__SMART_TOC_LAST_SKIP__`
  - `window.__SMART_TOC_WIDGET_DIAGNOSTICS__`
  - `window.__SMART_TOC_INSPECT_WIDGETS__()`
- 兼容性检测会优先区分“侧栏导航”和“正文内小目录”，减少误跳过

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解详细的更新历史。

## 产品与路线图

- 产品与体验分析：查看 [PRODUCT_UX_ROADMAP.md](PRODUCT_UX_ROADMAP.md)
- Chrome 商店文案草稿：查看 [CHROME_STORE_LISTING.md](CHROME_STORE_LISTING.md)

## 发布

- 本地打包：`./scripts/package_extension.sh`
- Chrome Web Store 自动发布说明：查看 [CHROME_STORE_RELEASE.md](CHROME_STORE_RELEASE.md)

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
