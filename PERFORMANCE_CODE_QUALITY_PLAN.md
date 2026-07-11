# Smart TOC & Scroll — 性能与代码质量治理方案

> 日期：2026-07-11
> 实现基线：v2.13
> 范围：注入主流程、三种 Barcode 预览、标准目录、主题同步、Options、本地 QA 与发布产物

## 1. 测量边界

本轮专用 Chrome DevTools trace / Lighthouse 服务未配置，因此不报告 LCP、INP、CLS 或网络瀑布数字。Chrome 扩展本身是注入式增强层，主要风险也不是宿主页面首屏资源，而是运行时 DOM 扫描、布局读取、pointer / scroll 热路径和 SPA 重建。

本轮使用以下证据：

- 72 个动态章节的本地 rail QA 页面
- 内置 `Ctrl + Shift + P` 性能面板
- in-app Browser 的真实 scroll、pointer、left/right、mixed-surface、键盘与 console 回归
- 源码静态审阅、语法检查、打包体积与 ZIP manifest 校验

## 2. 审阅结论与优先级

| 优先级 | 问题 | 用户/运行时影响 | 处理 |
|---|---|---|---|
| P1 | rail 主流程以 `sspai` 命名并把共享能力与单一 preview 模型耦合 | 增加预览方式时会复制 UI、主题、hover、回顶和清理逻辑 | 已收敛为 `Barcode` 一级类型，并由 `theme-preset-rail`、`createRailUI()`、`setupRailInteractions()` 共享基础层 |
| P1 | `getHeaders()` 用 `offsetTop` 生成去重键，并对同一自定义标题重复读取 computed style | 标题扫描会触发布局读取，长文更新时成本随标题数增加 | 改为元素身份 `Set` 去重；每个候选只读取一次 computed style |
| P1 | 内容容器 fallback 对每个 `div/section/article/main` 再执行一次后代标题查询 | 深层页面可能形成接近 O(N × subtree) 的扫描 | 改为一次标题查询，再沿祖先链累计标题数量 |
| P1 | 每次 scroll 重复计算显示条件并重复调度 adaptive theme | 热路径有无意义分支和调度 | 缓存可见状态、单次计算 `shouldShowToc()`，只保留一个 adaptive theme 调度点 |
| P1 | 所有 rail bar 长期声明 `will-change` | 大纲很长时可能制造过多合成候选层 | 只给当前 wave 影响范围内的 item 添加 `.is-wave-active` |
| P1 | 回顶使用 10ms 递归 timer，348ms 动画约创建 35 个任务 | 与浏览器原生滚动管线竞争，减少动态效果也无法即时生效 | 改为原生 `window.scrollTo({ behavior })`，并尊重 reduced motion |
| P1 | 主题 MutationObserver 会响应扩展自己的 preview / diagnostics DOM | hover 更新可能反向触发主题重算 | 过滤 `#github-toc`、`#github-sst`、滚轮、聚光灯、GPT 面板和性能面板 |
| P2 | cleanup 未完整取消 scroll / rail rAF、post-click timer 和性能 interval | SPA 生命周期切换后可能保留短时任务 | cleanup 统一取消 rAF、timer、interval 和 hover/press 状态 |
| P2 | 性能面板只测 generation/update/scroll，没有覆盖 adaptive theme 与 pointer 热路径 | 容易低估 rail 的真实运行时开销 | 新增 `Adaptive Theme` 与 `Rail Pointer` 指标，并用数据驱动后续优化 |
| P2 | GPT 展开后全部标题都进入 Tab 序列，命中变化遍历写入全部 row | 长目录键盘成本高，hover 更新产生不必要 DOM 写入 | 使用 roving tabindex；只更新旧/新 current row，并增加 Arrow / Home / End 导航 |
| P2 | rail wave 每帧更新但 transform 继续使用 140ms transition | 连续移动时动画追赶 pointer，产生拖尾感 | transform / opacity 收敛为 90ms，并保留 reduced-motion 清零 |
| P3 | 标准面板图标与标题使用 `transition: all` | 宿主样式变化可能带动无关属性进入动画计算 | 只声明 opacity / transform |
| P3 | `catalog.js` 仍是 3,000 行左右的单文件 | 维护边界仍偏大，但一次性拆模块会提高 MV3 注入和回归风险 | 本轮先建立 rail/controller 边界；后续按 detection / rail / lifecycle 分阶段拆分 |

## 3. Barcode 的三种标题预览

`Barcode`（internal preset: `barcode`）是一级导航类型，标题预览由 `barcodePreview` 控制：

- `wheel` / 滚轮：固定观察窗 + 全量标题 track，命中项滚入固定焦点位置
- `spotlight` / 聚光灯：idle 只显示 bar；hover / focus 时显示所有当前可见标题
- `gpt` / GPT：idle 只显示 bar；hover / focus 时复用稳定的完整标题 button 列表，并在有界面板内独立滚动
- 聚光灯只更新 row 的透明度、轻微缩放和字重；命中项 100%，上下 1–2 项逐级渐隐，其余项保持低透明度
- 聚光灯不显示命中边框；所有 row 在本次 TOC 生命周期中稳定复用，hover 时不清空或重建
- 每个标题根据对应 bar 的真实纵向中心定位，不使用滚动 track
- 右侧 rail 向左显示，左侧 rail 向右显示；visible row 保留点击跳转能力
- mixed-surface 下继续复用 rail 局部采样 token，标签本身提供可读 surface
- GPT rows 在 TOC 生命周期内一次建立并复用；命中变化只更新旧/新 current row、ARIA、roving tabindex 与必要的面板 `scrollTop`
- GPT 指针离开宽限使用单个 96ms timer，并在 panel / rail pointerenter 时立即取消；cleanup 必须取消该 timer

## 4. 当前性能样本

在 73 个目录项（页面标题 + 72 个动态章节）的 QA 页面中，开启内置性能面板后完成最终 v2.13 采样：

| 指标 | 样本数 | 样本平均值 | 样本最大值 |
|---|---:|---:|---:|
| Scroll | 100 | 0.02ms | 0.10ms |
| Adaptive Theme | 6 | 0.98ms | 2.30ms |
| Rail Pointer | 3 | 0.07ms | 0.10ms |

这些是扩展内置同步计时样本，不等同于 Core Web Vitals；当前环境未配置 Chrome DevTools trace MCP，因此不报告 LCP、INP、CLS。已覆盖热路径的最大值 `2.30ms`，低于单帧 16.7ms 预算；后续仍应在真实复杂站点上补 trace 与 heap retention。

## 5. 后续分阶段治理

1. 为 detection、rail controller、SPA lifecycle 增加可独立运行的纯函数/DOM fixture 测试。
2. 将 `catalog.js` 按上述边界拆分为多个 content script，并保持 manifest 明确加载顺序。
3. 对真实文档站、博客和强动态 SPA 分别采集 DevTools trace，重点看 Long Task、layout、event handler 与 heap retention。
4. 为宽泛的自定义标题和已有控件 selector 建立误判语料库，避免为了微小扫描收益牺牲识别准确性。
