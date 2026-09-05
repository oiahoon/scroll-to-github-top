# v2.18 商店截图

> 已于 2026-09-05 使用独立 Playwright / Chrome 会话导出五张无损 PNG：1280 × 800、8-bit RGB、无 alpha。官网已使用相同副本；尚未上传到 Chrome 商店。

本目录使用原创示例文章与实际扩展内容脚本呈现当前四种模式。`article.html` 加载仓库的 `catalog.js`、`theme.js`、`toc.css` 和 `themes.css`；`settings.html` 使用当前设置页结构与脚本，仅模拟 Chrome storage。

## 拍摄清单

浏览器视口设为 **1280 × 800**，等待页面、字体和预览稳定后拍摄。最终导出 RGB PNG，无 alpha。五张截图按以下顺序上传，完成导出后同步至 `website/public/product/`。

| 文件名 | 本地拍摄地址（从仓库根目录提供 HTTP 服务） | 状态 |
| --- | --- | --- |
| `01-standard-v218.png` | `article.html?mode=standard&capture` | 完整目录展开 |
| `02-nearby-v218.png` | `article.html?mode=spotlight&surface=dark&capture` | 三项邻节预览 |
| `03-search-v218.png` | `article.html?mode=gpt&capture` | 关键词「关键词」的本地标题匹配 |
| `04-margin-v218.png` | `article.html?mode=sspai&capture` | 固定页边大纲 |
| `05-settings-v218.png` | `settings.html` | 边缘导航设置 |

`capture-state.js` 仅通过现有控件进入上述状态，不替换目录或绘制模拟控件。关闭 `capture` 参数可手动检查交互。

## 发布前检查

- 目录内容与正文标题一致，查询结果确实经过本地筛选。
- 字体、长标题和固定大纲均无裁切；没有加载失败或控制台异常。
- PNG 为 1280 × 800、8-bit RGB（24-bit，无透明通道）。
- 官网副本与商店图片一致；禁止拿旧版图片改名充当本版截图。
- 商店文案见 `../../../CHROME_STORE_LISTING.md`。

[Chrome 官方图片规范](https://developer.chrome.com/docs/webstore/images/)。上传素材、提交审核和商店公开发布是不同步骤。本目录不包含自动上传逻辑。

父目录中的旧图片和 SVG 保留为历史素材。

实际导出在干净的浏览器会话中完成，避免已安装扩展干扰。图钉使用真实鼠标点击进入固定状态；不修改扩展样式。中文标题的 11 个锚点均唯一，关键词匹配得到 2 个结果，点击结果定位正确，未发现脚本异常。
