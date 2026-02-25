# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 扩展选项页，支持展开方式、显示条件、位置与禁用域名配置
- 自动避开页面已有 TOC/回到顶部控件的检测与开关
- 强制显示开关

### Changed
- 默认使用长按展开，减少悬停误触
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
