# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- GitHub Actions 发布链路改为校验、打包并生成 GitHub Release，不再保存凭证或自动调用 Chrome Web Store API
- 手动工作流产物保留 ZIP 与 SHA-256 30 天；版本 Tag 会校验 Manifest 版本并永久附加产物到 GitHub Release
- 手动工作流支持通过现有 `release_tag` 修复失败发布，并显式向 GitHub CLI 传递仓库上下文
- 本地发布检查新增 JavaScript / Shell 语法、ZIP 完整性、Manifest V3、必要文件和意外元数据验证

## [2.13] - 2026-07-11

### Changed
- GPT 完整标题面板改为 roving tabindex：73 项长目录展开时仅当前项进入 Tab 序列，并支持方向键、Home / End 导航
- GPT hover 命中变化只更新旧行与新行的 class、ARIA 和 tabindex，不再重复写入全部标题行
- Barcode wave 的 transform / opacity 反馈从 140ms 收敛到 90ms，减少连续 pointer move 下的追赶与拖尾
- 标准面板图标和标题移除 `transition: all`，只动画实际变化的 opacity / transform 属性

### Fixed
- GPT 标题行恢复明确的 `:focus-visible` 轮廓，避免键盘用户只看到背景色变化
- 最终代码审阅补齐三种 Barcode 预览、设置保存、左右镜像、控制台健康和 73 项长目录性能证据

### Performance
- 73 项 QA 样本中，100 次 Scroll 更新平均 `0.02ms`、Rail Pointer 平均 `0.07ms`、Adaptive Theme 平均 `0.98ms`，已测最大值 `2.30ms`

## [2.12] - 2026-07-11

### Added
- Barcode 新增第三种 `GPT` 标题预览：idle 保留纯条形码，hover / focus 后展开带背景、边框和圆角的完整标题面板
- GPT 面板支持长目录内部滚动、当前项高亮、自动滚入视野、标题点击跳转与左右 rail 镜像
- Rail QA 控制条新增 GPT 场景，覆盖深浅 surface、左右位置和 reduced motion

### Changed
- Barcode 二级选择扩展为 `滚轮` / `聚光灯` / `GPT`，三者继续共享 rail、wave、局部主题和生命周期逻辑
- rail 与预览面板之间加入短暂指针离开宽限，提升跨越间隙时的滚动和点击稳定性

### Fixed
- 主题与内容观察器补充忽略 `.toc-gpt-preview`，避免面板行状态变化触发无意义重算

## [2.11] - 2026-07-11

### Added
- 将线状导航正式命名为 `Barcode`，并提供 `滚轮` / `聚光灯` 两种二级标题预览
- `聚光灯` hover 时显示当前可见的完整标题列；命中项最清晰，高亮向上下各 1–2 项渐隐扩散
- Options 新增 Barcode 二级预览选择；本地 Rail QA 页面新增 Wheel / Spotlight 切换
- 新增 `PERFORMANCE_CODE_QUALITY_PLAN.md`，记录本轮性能测量边界、技术债务优先级和后续拆分路线
- 内置性能面板新增 Adaptive Theme 与 Rail Pointer 指标

### Changed
- 设置结构从三个并列主题收敛为“标准目录面板 / Barcode”一级选择，以及 Barcode 下的预览方式二级选择
- 聚光灯改为复用稳定的全标题 row，不在 hover 时清空并重建 5 行上下文，减少动画跳变
- Barcode 的两种预览共享创建、交互、主题与生命周期逻辑
- 标题去重取消 `offsetTop` 布局读取；内容容器 fallback 改为一次标题扫描与祖先累计
- scroll 热路径合并显示条件与主题调度；rail wave 只为当前影响项开启 `will-change`
- 回顶改用浏览器原生 smooth scroll，并尊重 `prefers-reduced-motion`
- cleanup 统一取消 rAF、timer、interval 和 hover / long-press 状态

### Fixed
- 主题与内容 MutationObserver 忽略扩展自身的 preview、浮光层与性能面板，避免无意义重算
- 聚光灯标题使用 body-level 固定层，避免被 rail 滚动容器裁切；左右 rail 自动镜像
- 聚光灯命中项取消边框，只使用透明度、轻微缩放和字重表达焦点

## [2.10] - 2026-07-10

### Changed
- Options 设置面板改为视口内三段式布局，设置列表独立滚动，保存区从页面首屏开始始终可见
- 设置保存按钮新增明确的 dirty state：无改动时显示“已保存”并禁用，修改后显示“保存更改”，保存成功后恢复稳定状态
- 阅读导航样式只保留一个高对比选中态；阅读进度模式锁定的交互方式使用柔和只读态，减少多重选中误解
- 阅读进度 hover 上下文行提高自包含 surface 的不透明度和邻近项可读性，修复 rail 采样区与正文底色不一致时的跨底色失真
- 标准目录入口改为原生 `button`，同步 `aria-expanded` / `aria-controls`，并保留显式 Enter、Space 与 Escape 键盘路径
- 点击目录项后短暂保持被点击章节的 active / `aria-current`，避免平滑滚动期间被下一标题过早抢占反馈

### Fixed
- 修复 v2.8 所谓 sticky 保存区在未滚动到页面底部前不可见的问题
- 修复 lightstrip 等混合 surface 场景中阅读进度预览邻近标题几乎不可读的问题

## [2.9] - 2026-07-10

### Added
- `test-pages/rail-hover-performance.html` 新增 Rail QA 控制条，可直接切换 left/right、dark/light/color/lightstrip surface 与 reduced motion 状态

### Changed
- 阅读进度 rail 本地验收流程从“手改 URL 参数”收敛为页面内按钮切换，方便 Chrome/Computer 截图审阅和回归确认
- Rail QA 控制条会根据 rail 左右位置自动避让到另一侧，避免遮挡被测 rail

## [2.8] - 2026-07-10

### Changed
- Options 设置页完成第 1 轮 UX 收敛：页面文案统一为中文并缩短说明，降低配置时的阅读负担
- 设置页布局改为更紧凑的行高、间距与页面宽度，减少普通 Chrome 窗口中底部操作被截断的概率
- 设置页底部保存区改为粘性操作栏，用户滚动配置时仍能看见保存动作与本地保存说明
- 暗色模式下分段按钮选中态改为高对比蓝色主行动色，避免白色胶囊在暗色界面中过度抢焦点

### Fixed
- 数值输入补充明确的 `aria-label`，让“滚动屏数”和“最少标题”的辅助技术读法更直接

## [2.7] - 2026-07-01

### Changed
- 阅读进度目录短横线进一步收细、收紧，降低长文页面上的常驻视觉占用，同时保留 hover wave 的可感知延展反馈
- Hover 上下文预览的遮罩与阴影改为更轻的空气感渐隐：移除容器级 blur，弱化 focus ring 阴影，并为邻近行增加左右淡出，减少浅色页面上的雾面矩形感
- 点击阅读进度目录跳转后，当前 item 和 preview 会短暂保持可见，给用户确认“已跳转到此处”的反馈；若指针仍停留在 rail 上则继续由 hover 接管，离开后自动淡出

### Fixed
- 移除阅读进度目录 rail link 的原生 `title` tooltip，避免浏览器黑色提示框遮挡自定义 preview

## [2.6] - 2026-07-01

### Added
- 阅读进度目录 hover 预览新增上下文聚光灯：当前标题上下最多各显示 2 个邻近标题，帮助用户快速判断当前位置附近的文章结构

### Changed
- Hover 预览从单标题气泡升级为透明容器内的多行 surface，邻近行的背景和文字随距离整体渐隐，形成更自然的横向扫光效果
- 预览外框固定在 TOC rail 的纵向中心，内部标题 track 通过 transform 滚动，形成类似机械手表星期/日期窗口的扫动效果
- Hover 预览边框收敛为当前标题专属的独立 focus ring，普通邻近标题不再显示边框；focus ring 固定在观察窗中心，并只在命中新标题时做轻微 bounce/pulse
- Hover 扫动时只有 rail wave 按 pointer 连续响应；preview 外框不跟随 item 或 pointer 微动，避免追赶式抖动
- 取消固定 5 行分片窗口缓存，改为一次性构建标题 track 并滚动，避免扫动过程中出现换页式断续感

## [2.5] - 2026-06-30

### Added
- `阅读进度目录` 新增原创 hover wave：悬停时只有短横线向外延展，不再推动整条 rail 左右位移
- 新增 body-level 标题预览气泡，左右位置会随 TOC rail 镜像：左侧 rail 向右展开并在右侧显示预览，右侧 rail 反向显示
- 新增阅读进度 rail 局部背景感知配色，基于 rail 贴近区域的页面 surface 选择轻量 token，避免在浅色条带或深色页面上失去对比
- 新增 `test-pages/rail-hover-performance.html` 的 `position` 与 `surface` 测试参数，用于复现 left/right、dark/light/lightstrip 等场景

### Changed
- Options 页面改为与商店素材一致的宽面板设置界面，使用横向设置行、分段按钮和更低干扰的兼容策略开关
- 阅读进度 rail 保持透明背景，hover 高亮条和预览模块各自承担可读性，不给 rail 本体增加面板底色
- 阅读进度 hover 预览改为 `position: fixed` 的 body 子节点，避免被 transform 祖先改变定位参照导致错位
- Hover wave 布局只缓存可视区域附近的 rail item，并预计算基础宽度，减少 pointer move 过程中的布局读取与写入
- 自适应配色的调节幅度保持克制，只调整 rail、回顶按钮和预览气泡的局部 CSS 变量，不覆盖宿主页面风格

### Fixed
- 修复阅读进度预览模块与高亮条垂直错位的问题
- 修复同一 rail item 内 hover wave 伸缩时标题预览锚点漂移的问题
- 修复 `prefers-reduced-motion: reduce` 下阅读进度 hover 标题预览不可见的问题
- 修复右侧 rail hover 后高亮条左端被裁切成平角的问题
- 修复 hover 标题预览靠近视口顶部或底部时可能被裁切的问题
- 修复 `showAfterScrollScreens: 0` 与强制显示测试页中首屏不显示的问题
- 修复 hover 离开或重新渲染后旧的 `.is-previewed` 状态残留问题

## [2.4] - 2026-03-27

### Added
- 新增 `阅读进度目录` 样式，支持低侵扰短横线目录、悬停展开标题与独立回顶按钮
- 新增兼容性诊断入口，包括 `data-smart-toc-skip-reason`、`window.__SMART_TOC_LAST_SKIP__`、`window.__SMART_TOC_WIDGET_DIAGNOSTICS__`
- 新增产品路线图、Chrome Web Store 商店文案草稿与发布说明文档

### Changed
- 产品定位从“回顶按钮”收敛为“轻量阅读导航扩展”
- 设置页从“主题预设”语义收敛为“阅读导航样式”，明确标准目录面板与阅读进度目录的差异
- 当前章节高亮改为 `IntersectionObserver` 优先驱动，标题结构不变时不再重建整棵 TOC 或重复创建观察器
- 已有控件避让升级为“通用规则 + 站点特征规则”的双层检测，并补充正文内联目录排除
- 扩展描述、商店文案和截图脚本统一围绕“低侵扰阅读导航”展开

### Fixed
- 修复 hover 模式闪烁、展开不稳定和双按钮并存等交互问题
- 修复 `阅读进度目录` 模式左右位置的镜像对齐，确保短横线始终靠近正文、标题始终位于外侧
- 修复 Astro / View Transitions 站点在客户端跳转、页面恢复或 `body` 内容替换后 TOC 需要刷新才恢复的问题
- 修复扩展自身 DOM 变化触发无意义重建的问题，降低长文与动态页面上的运行负担

## [2.3.2] - 2026-03-27

### Fixed
- 修复部分 Astro 站点在客户端切页时会替换 `body` 内节点，导致 TOC DOM 脱离文档后不再显示的问题
- 当宿主页面替换 `body` 内容时，现有 TOC 与独立回顶按钮会自动重新挂载到新的页面文档

## [2.3.1] - 2026-03-27

### Changed
- 当前章节高亮改为 `IntersectionObserver` 优先驱动，滚动监听仅在需要时回退到位置遍历
- 标题结构不变时不再重复重建标题观察器，并忽略扩展自身节点触发的无意义重建
- 扩展描述继续收敛为“轻量阅读导航”定位，并补充商店文案与截图脚本草稿

### Fixed
- 修复 Astro 站点在文章页与列表页之间客户端跳转后 TOC 不再自动恢复的问题
- 新增对 `astro:after-swap`、`astro:page-load`、`pageshow` 和页面恢复场景的重建兜底

## [2.3] - 2026-03-16

### Added
- TOC 浮标与展开面板补充键盘可达性与 ARIA 属性
- Chrome Web Store 打包与自动发布脚本
- GitHub Actions 发布工作流与发布说明文档
- 新增阅读进度主题预设，支持线状目录与独立回顶按钮
- 新增 Chrome Web Store 商店文案草稿，整理产品定位、截图脚本与隐私说明

### Changed
- 主题检测从“统计页面文字颜色”调整为“直接读取页面背景亮度”
- 主题系统收敛为浅色/深色磨砂浮层，并保留旧彩色主题类兼容映射
- Options 页面改为 v2.3 视觉样式
- 性能统计改为按需启用，默认不再持续采样和刷新
- TOC 更新链路收敛为更保守的重建策略，减少整页频繁扫描
- 设置页新增主题预设切换，并在阅读进度主题下固定为悬停展开
- 设置页文案从“换皮肤”收敛为“阅读导航样式”，明确标准目录面板与阅读进度目录的区别
- 扩展描述同步收敛为“轻量阅读导航”定位，减少与普通回顶插件的同质化表达

### Fixed
- 避免主题脚本在 `document.body` 尚未可用时提前观察失败
- 修正文档与当前 v2.3 重构方向不一致的说明
- 移除与 TOC 浮标并列的独立回顶按钮，恢复单入口交互
- 修复 hover 模式下浮标闪烁与 TOC 面板展开不稳定的问题
- 将 hover 模式打磨为“悬停预览、点击固定”，并优化 click / press 模式语义
- 将 TOC 入口提示收敛为首次使用阶段提示，避免长期打扰
- 强化对边缘浮动目录的结构识别，减少在同类页面上的重复注入
- 长目录中当前高亮章节会自动滚入可视区域，减少阅读时的定位成本
- 点击目录项时会立即同步当前高亮并保持该项可见
- 避让已有控件时会记录命中原因，为兼容性诊断提供基础
- 已有控件检测开始拆分为通用规则与站点特征规则，便于持续扩展兼容性
- 正文主内容里的内联目录会优先排除，减少误把正文小目录当成侧栏 TOC 的情况
- 新增对语义化侧栏导航的通用 TOC 检测，并提供主动刷新诊断快照的方法
- `标准目录面板` 与 `阅读进度目录` 已开始拆分为独立 UI / interaction 路径，降低后续维护复杂度
- 目录项渲染已开始抽离，标题结构不变时不再重建整棵 TOC
- 修正 `阅读进度目录` 模式在左侧位置时的对齐，标题位于短横线外侧且整体右对齐
- 当前章节高亮改为 `IntersectionObserver` 优先驱动，滚动监听仅在需要时回退到位置遍历
- 标题结构不变时不再重复重建标题观察器，并忽略扩展自身节点触发的无意义重建

## [2.2] - 2026-02-25

### Added
- 扩展选项页，支持展开方式、显示条件、位置与禁用域名配置
- 自动避开页面已有 TOC/回到顶部控件的检测与开关
- 强制显示开关

### Changed
- 默认使用悬停展开
- 仅在满足滚动距离与标题数量条件时显示按钮
- 仅避开侧栏 TOC 与固定/粘性控件，避免误判正文内小目录

## [2.1] - 2024-05-15

### Added
- 添加性能监控功能
  - 实时监控目录生成性能
  - 跟踪目录更新性能
  - 监控滚动性能
  - 内存使用情况分析
- 添加性能统计面板
  - 使用 Ctrl + Shift + P 快捷键显示/隐藏
  - 显示详细的性能指标
  - 每秒自动更新统计数据

### Changed
- 优化性能监控相关代码
  - 使用 performance.now() 进行高精度时间测量
  - 使用 requestAnimationFrame 优化滚动性能监控
  - 限制性能数据存储大小，避免内存占用过大


## [2.0] - 2024-05-14

### Added
- 重命名为 Smart TOC & Scroll
- 更新图标为新的 SVG 图标
- 优化主题系统，支持多主题

### Changed
- 更新打包脚本，支持新扩展名和文件结构

## [1.9] - 2024-05-13

### Added
- 全新的目录树组件，支持平滑的展开/收起动画
- 添加了 Material Design 风格的半透明背景和模糊效果
- 实现了标题的层级缩进和动画效果
- 添加了更多的导航栏和侧边栏过滤规则

### Changed
- 移除了对 jQuery 和 jsTree 的依赖
- 优化了目录树的交互体验
- 改进了标题过滤逻辑，更好地处理导航栏和侧边栏内容
- 统一了样式文件，移除了冗余的 CSS 文件

### Fixed
- 修复了目录树在某些页面不显示的问题
- 修复了导航栏内容被错误包含在目录中的问题
- 修复了侧边栏内容被错误包含在目录中的问题

## [1.8] - 2024-05-12

### Added
- 添加了对更多网站的支持
- 实现了目录树的展开/收起功能

### Changed
- 优化了按钮的显示逻辑
- 改进了目录树的样式

### Fixed
- 修复了在某些页面目录树不显示的问题

## [1.7] - 2024-05-11

### Added
- 添加了目录树功能
- 实现了标题的自动生成和跳转

### Changed
- 优化了按钮的样式和交互
- 改进了滚动动画效果

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.6] - 2024-05-10

### Added
- 添加了更多的网站支持
- 实现了平滑滚动效果

### Changed
- 优化了按钮的显示位置
- 改进了按钮的样式

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.5] - 2024-05-09

### Added
- 添加了按钮的显示/隐藏动画
- 实现了按钮的悬停效果

### Changed
- 优化了按钮的样式
- 改进了按钮的交互体验

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.4] - 2024-05-08

### Added
- 添加了按钮的图标
- 实现了按钮的点击效果

### Changed
- 优化了按钮的样式
- 改进了按钮的交互体验

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.3] - 2024-05-07

### Added
- 添加了按钮的显示/隐藏逻辑
- 实现了按钮的滚动效果

### Changed
- 优化了按钮的显示逻辑
- 改进了按钮的交互体验

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.2] - 2024-05-06

### Added
- 添加了按钮的基本功能
- 实现了按钮的样式

### Changed
- 优化了按钮的显示逻辑
- 改进了按钮的交互体验

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.1] - 2024-05-05

### Added
- 添加了按钮的基本功能
- 实现了按钮的样式

### Changed
- 优化了按钮的显示逻辑
- 改进了按钮的交互体验

### Fixed
- 修复了按钮在某些页面不显示的问题

## [1.0] - 2024-05-04

### Added
- 初始版本发布
- 添加了基本的滚动到顶部功能
- 实现了按钮的样式和交互

### Added
- Added support for `http://guides.rubyonrails.org`

## [1.5] - Previous

### Fixed
- Fixed scrolling not working

## [1.4] - Previous

### Fixed
- Fixed scrollTop always being 0 issue

## [1.3] - Previous

### Added
- Added `miaowu.org` to supported sites list
