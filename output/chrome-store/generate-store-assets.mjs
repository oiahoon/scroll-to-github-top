import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outDir = new URL('.', import.meta.url).pathname;
await mkdir(outDir, { recursive: true });

const escapeXml = (value) =>
  String(value).replace(/[&<>"]/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  })[ch]);

const text = (x, y, value, size = 18, fill = '#111827', weight = 400, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" ${extra}>${escapeXml(value)}</text>`;

const line = (x1, y1, x2, y2, stroke = '#d7deea', width = 1, extra = '') =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;

const rect = (x, y, width, height, radius, fill, stroke = 'none', strokeWidth = 1, extra = '') =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${extra}/>`;

const pill = (x, y, width, height, fill, stroke = 'none', strokeWidth = 1, extra = '') =>
  rect(x, y, width, height, height / 2, fill, stroke, strokeWidth, extra);

const svg = (body, background = '#ffffff') => `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800" font-family="Arial, Helvetica, sans-serif">
<defs>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0f172a" flood-opacity=".18"/>
  </filter>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="150%">
    <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0f172a" flood-opacity=".14"/>
  </filter>
  <linearGradient id="darkBg" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#0e1117"/>
    <stop offset="1" stop-color="#171d27"/>
  </linearGradient>
  <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
    <stop stop-color="#f8fafc"/>
    <stop offset="1" stop-color="#eef3f9"/>
  </linearGradient>
</defs>
${rect(0, 0, 1280, 800, 0, background)}
${body}
</svg>`;

function articlePage({ dark, contentX = 92 }) {
  const fill = dark ? '#10151d' : '#f5f7fb';
  const primary = dark ? '#f8fafc' : '#172033';
  const muted = dark ? '#a8b3c7' : '#596579';
  const rule = dark ? '#2a3342' : '#d8e0ec';
  let body = rect(0, 0, 1280, 800, 0, fill);

  body += text(contentX, 73, 'Long Article', 15, muted, 700, 'letter-spacing="2"');
  body += text(contentX, 142, 'Readable pages need clear position and quick jumps', 38, primary, 750);
  body += text(contentX, 183, 'A local outline keeps navigation close without covering the reading flow.', 18, muted, 400);
  body += line(contentX, 220, contentX + 748, 220, rule);

  const headings = [
    'Overview',
    'Install and configure',
    'Reading modes',
    'Adaptive appearance',
    'Keyboard navigation',
    'Dynamic pages'
  ];
  let y = 272;
  headings.forEach((heading, index) => {
    body += text(contentX, y, heading, 26, primary, 720);
    body += text(contentX, y + 36, 'Clear section structure, comfortable spacing, and enough text to feel like a real page.', 17, muted);
    body += text(contentX, y + 66, 'The navigation UI remains separate, predictable, and low-friction.', 17, muted);
    y += index === 1 ? 126 : 118;
  });

  return body;
}

function standardPanel() {
  let body = articlePage({ dark: false });
  body += rect(927, 222, 292, 444, 14, 'rgba(20,26,36,.88)', '#2b3445', 1, 'filter="url(#shadow)"');
  body += text(951, 256, 'OUTLINE', 12, '#aab4c5', 700, 'letter-spacing="1.8"');
  body += pill(1144, 238, 45, 24, 'rgba(255,255,255,.06)', '#546071');
  body += text(1156, 255, 'Top', 11, '#e5edf7', 700);
  body += line(927, 276, 1219, 276, '#303a4b');

  const items = [
    ['Overview', 0, true],
    ['Install and configure', 0, false],
    ['Permissions and privacy', 1, false],
    ['Reading modes', 0, false],
    ['Standard TOC Panel', 1, false],
    ['Reading Progress Outline', 1, false],
    ['Adaptive appearance', 0, false],
    ['Keyboard navigation', 0, false],
    ['Dynamic pages', 0, false]
  ];

  let y = 310;
  items.forEach(([label, level, active]) => {
    const x = 951 + level * 18;
    if (active) {
      body += rect(945, y - 18, 244, 30, 7, 'rgba(88,166,255,.13)', '#415d82');
      body += rect(945, y - 18, 3, 30, 2, '#58a6ff');
    }
    body += text(x, y, label, 14, active ? '#cfe6ff' : '#d8dee9', active ? 700 : 500);
    y += 38;
  });

  body += pill(1150, 706, 42, 42, 'rgba(15,23,42,.88)', '#334155', 1, 'filter="url(#soft)"');
  body += text(1165, 733, '↑', 22, '#e2e8f0', 700);
  return svg(body);
}

function railScreenshot({ side = 'right', dark = true, hover = true, lightStrip = false }) {
  const isLeft = side === 'left';
  let body = articlePage({ dark, contentX: isLeft ? 340 : 92 });
  if (lightStrip) {
    body += rect(1160, 0, 120, 800, 0, '#f8fafc');
    body += rect(1160, 118, 120, 148, 12, '#eef2f7');
    body += rect(1160, 402, 120, 148, 12, '#eef2f7');
  }

  const railX = isLeft ? 30 : 1210;
  const onDarkSurface = dark && !lightStrip;
  const barColor = onDarkSurface ? 'rgba(255,255,255,.46)' : 'rgba(15,23,42,.36)';
  const active = onDarkSurface ? '#f8fafc' : '#172033';
  const ys = [198, 226, 260, 292, 330, 360, 392, 424, 458, 490, 528, 560, 592, 628];
  const bases = [26, 18, 13, 20, 12, 25, 16, 13, 22, 12, 18, 26, 14, 20];

  ys.forEach((y, index) => {
    const strength = hover ? Math.max(0, 1 - Math.abs(y - 392) / 88) : 0;
    const width = bases[index] + strength * 34;
    const height = 4 + strength * 2;
    const x = isLeft ? railX : railX + 28 - width;
    body += pill(x, y, width, height, Math.abs(y - 392) < 6 ? active : barColor);
  });

  if (hover) {
    const previewX = isLeft ? 94 : 938;
    const previewY = 374;
    const previewWidth = isLeft ? 220 : 246;
    body += rect(
      previewX,
      previewY,
      previewWidth,
      38,
      9,
      onDarkSurface ? 'rgba(17,24,39,.92)' : 'rgba(255,255,255,.94)',
      onDarkSurface ? 'rgba(255,255,255,.18)' : 'rgba(15,23,42,.15)',
      1,
      'filter="url(#soft)"'
    );
    body += text(previewX + 14, previewY + 25, 'Reading modes', 14, onDarkSurface ? '#f8fafc' : '#172033', 700);
  }

  const buttonX = isLeft ? 30 : 1208;
  body += pill(
    buttonX,
    708,
    44,
    44,
    onDarkSurface ? 'rgba(255,255,255,.09)' : 'rgba(15,23,42,.08)',
    onDarkSurface ? 'rgba(255,255,255,.15)' : 'rgba(15,23,42,.14)'
  );
  body += text(buttonX + 15, 737, '↑', 24, onDarkSurface ? '#f8fafc' : '#172033', 700);
  return svg(body, dark ? '#0e1117' : '#f8fafc');
}

function optionsPage() {
  let body = rect(0, 0, 1280, 800, 0, '#f4f7fb');
  body += rect(82, 58, 1116, 684, 16, '#ffffff', '#dbe3ef', 1, 'filter="url(#soft)"');
  body += text(126, 118, 'Smart TOC & Scroll', 32, '#162033', 760);
  body += text(126, 150, 'Reading navigation settings', 16, '#667085', 500);
  body += rect(126, 190, 1004, 1, 0, '#e4e9f2');

  const rows = [
    ['阅读导航样式', '选择适合当前页面的目录呈现方式。', '标准目录面板', '阅读进度目录'],
    ['交互方式', '悬停预览、点击开关，或短按回顶 / 长按展开。', '悬停预览', '点击开关'],
    ['显示条件', '控制目录出现的时机，避免短页面被打扰。', '滚动屏数 1', '最少标题 3'],
    ['位置', '让浮层靠近阅读边缘，同时避开正文主要内容。', '右侧', '左侧'],
    ['兼容策略', '页面已有目录或回顶控件时，减少重复干扰。', '自动避让已有控件', '始终显示'],
    ['禁用域名', '用逗号分隔多个域名。', 'example.com, docs.example.org', '']
  ];

  let y = 230;
  rows.forEach((row, index) => {
    const rowHeight = index === 5 ? 74 : 64;
    body += rect(126, y, 1004, rowHeight, 10, '#f8fafc', '#e1e7f0');
    body += text(154, y + 27, row[0], 17, '#182033', 720);
    body += text(154, y + 49, row[1], 12, '#667085');
    if (index === 5) {
      body += rect(760, y + 15, 340, 44, 14, '#ffffff', '#e1e7f0');
      body += text(780, y + 43, row[2], 13, '#667085', 500);
    } else {
      const firstWidth = index === 4 ? 180 : 154;
      const secondWidth = index === 4 ? 126 : 132;
      const firstX = 772 - (index === 4 ? 54 : 0);
      const secondX = firstX + firstWidth + 16;
      body += pill(firstX, y + 15, firstWidth, 34, index === 0 || index === 1 || index === 3 || index === 4 ? '#172033' : '#ffffff', index === 0 || index === 1 || index === 3 || index === 4 ? '#172033' : '#cfd8e6');
      body += text(firstX + 22, y + 37, row[2], 13, index === 0 || index === 1 || index === 3 || index === 4 ? '#ffffff' : '#263244', 700);
      body += pill(secondX, y + 15, secondWidth, 34, index === 0 ? '#e9f4ff' : '#ffffff', index === 0 ? '#99caff' : '#cfd8e6');
      body += text(secondX + 22, y + 37, row[3], 13, index === 0 ? '#125a9c' : '#263244', 700);
    }
    y += rowHeight + 12;
  });

  body += rect(126, 700, 1004, 1, 0, '#e4e9f2');
  body += text(126, 728, 'Local-only page analysis. Preferences stay in your browser.', 14, '#667085', 500);
  return svg(body);
}

const files = {
  '01-standard-toc-panel.svg': standardPanel(),
  '02-right-rail-hover-preview.svg': railScreenshot({ side: 'right', dark: true }),
  '03-left-rail-hover-preview.svg': railScreenshot({ side: 'left', dark: true }),
  '04-light-page-adaptive-rail.svg': railScreenshot({ side: 'right', dark: false }),
  '05-options-reading-navigation.svg': optionsPage()
};

for (const [name, content] of Object.entries(files)) {
  await writeFile(path.join(outDir, name), content, 'utf8');
}

const copy = `# Chrome Web Store Listing Copy

Updated: 2026-06-30

## Short Description

Adaptive reading navigation for long articles and docs: TOC, progress outline, hover preview, smooth jumps, and local-only analysis.

## Long Description

Smart TOC & Scroll adds lightweight reading navigation to long articles, blogs, and documentation pages.

It gives you two navigation styles for different reading contexts:

- Standard TOC Panel: a full outline with active-section highlighting, quick heading jumps, and a compact Top action.
- Reading Progress Outline: a transparent progress rail for immersive long-form reading, with subtle hover waves and title previews that appear outside the rail.

Key features:

- Builds a clean outline from page headings
- Highlights the section you are currently reading
- Smoothly jumps to headings and back to the top
- Adapts gently to light and dark page surfaces
- Keeps the progress rail transparent and low-intrusion
- Avoids duplicate TOC or back-to-top widgets when a page already provides them
- Supports dynamic pages and single-page app updates
- Runs page analysis locally in your browser

Built for readers who want a clear sense of place without adding clutter to every page.

## Screenshot Captions

1. Full outline panel for documentation and technical pages.
2. Hover preview and progress wave for long-form reading.
3. Left-side progress outline with mirrored preview placement.
4. Adaptive contrast on light pages without adding a panel background.
5. Simple settings for style, placement, compatibility, and appearance.

## Privacy Note

Smart TOC & Scroll does not upload page content or collect browsing history. Outline detection and interactions run locally, and preferences are stored in the browser.

## Chinese Listing Copy

### 简短描述

为长文、博客和文档页提供轻量阅读导航：目录面板、阅读进度、hover 预览、平滑跳转和本地分析。

### 详细描述

Smart TOC & Scroll 为长文、博客和文档站点提供轻量阅读导航。

它提供两种互补的导航方式：

- 标准目录面板：展示完整目录、当前章节高亮、快速标题跳转和紧凑的 Top 回顶操作。
- 阅读进度目录：以透明短横线表达长文结构，悬停时产生柔和延展，并在 rail 外侧显示标题预览。

核心能力：

- 根据页面标题自动生成清晰目录
- 高亮当前阅读章节
- 平滑跳转到标题或回到顶部
- 根据页面浅色 / 深色背景做克制自适应
- 阅读进度 rail 保持透明、低侵扰
- 页面已有目录或回顶控件时自动避让，减少重复控件
- 支持动态页面与单页应用内容更新
- 页面分析在浏览器本地完成

适合希望在不打断阅读的前提下，快速掌握长文结构和当前位置的用户。

## Release Note

Improved the reading progress outline with smoother hover behavior, stable preview placement, transparent rail styling, and subtle adaptive contrast for different page surfaces.
`;

await writeFile(path.join(outDir, 'chrome-store-copy.md'), copy, 'utf8');
console.log(Object.keys(files).concat(['chrome-store-copy.md']).join('\n'));
