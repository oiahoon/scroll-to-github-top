'use strict';

// 使用立即执行函数来创建独立的作用域
(function() {
  // 检查是否已经存在目录树
  if (document.getElementById('github-toc')) {
    return;
  }

  // 创建目录树容器
  const tocContainer = document.createElement('div');
  tocContainer.id = 'github-toc';
  tocContainer.className = 'github-toc theme-light';
  document.body.appendChild(tocContainer);

  // 添加按钮图标
  const buttonSvg = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>';
  tocContainer.innerHTML = buttonSvg;

  // 扩展内容容器选择器
  const mainContainers = [
    // 通用内容容器
    'main-container',
    'body-container',
    'application-main',
    'main-content',
    'content',
    'article',
    'main',
    '.markdown-body',
    '#readme',
    '.repository-content',
    '.js-repo-root',
    // 文档类网站
    '.documentation',
    '.docs-content',
    '.doc-content',
    '.doc-body',
    '.document-body',
    '.article-content',
    '.post-content',
    '.entry-content',
    // 博客平台
    '.blog-post',
    '.post-body',
    '.article-body',
    '.entry-body',
    // 技术文档
    '.technical-docs',
    '.api-docs',
    '.guide-content',
    '.tutorial-content',
    // 常见框架
    '.mdx-content', // MDX
    '.md-content', // Markdown
    '.rst-content', // reStructuredText
    '.asciidoc-content', // AsciiDoc
    // 通用选择器
    '[role="main"]',
    '[role="article"]',
    '[role="document"]',
    '[itemprop="articleBody"]',
    '[itemprop="mainContentOfPage"]'
  ];

  // 扩展排除容器选择器
  const excludeContainers = [
    // 导航相关
    'nav',
    'header',
    'footer',
    '.header',
    '.footer',
    '.navigation',
    '.navbar',
    '.nav',
    '.menu',
    '.sidebar',
    '.toc',
    '.table-of-contents',
    '.breadcrumb',
    '.pagination',
    // GitHub 特定
    '.js-header-wrapper',
    '.js-repo-nav',
    '.js-site-header',
    '.js-site-footer',
    '.js-notification-shelf',
    // 通用导航
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[role="complementary"]',
    // 文档结构
    '[role="note"]',
    '[role="doc-footnote"]',
    '[role="doc-endnotes"]',
    '[role="doc-bibliography"]',
    '[role="doc-glossary"]',
    '[role="doc-appendix"]',
    // 侧边栏相关
    '.sidebar',
    '.side-bar',
    '.sideBar',
    '.sidebar-container',
    '.side-bar-container',
    '.sidebar-wrapper',
    '.side-bar-wrapper',
    '.sidebar-content',
    '.side-bar-content',
    '.sidebar-menu',
    '.side-bar-menu',
    '.sidebar-nav',
    '.side-bar-nav',
    '.sidebar-list',
    '.side-bar-list',
    '.sidebar-item',
    '.side-bar-item',
    '.sidebar-section',
    '.side-bar-section',
    '.sidebar-panel',
    '.side-bar-panel',
    '.sidebar-widget',
    '.side-bar-widget',
    '.sidebar-block',
    '.side-bar-block',
    '.sidebar-area',
    '.side-bar-area',
    '.sidebar-region',
    '.side-bar-region',
    '.sidebar-zone',
    '.side-bar-zone'
  ];

  // 智能查找内容容器
  function findContentContainer() {
    // 1. 首先尝试使用预定义的选择器
    for (const selector of mainContainers) {
      const container = document.querySelector(selector);
      if (container) {
        return container;
      }
    }

    // 2. 查找最大的内容块
    const contentBlocks = Array.from(document.querySelectorAll('article, main, [role="main"], [role="article"], [role="document"]'));
    if (contentBlocks.length > 0) {
      return contentBlocks.reduce((largest, current) => {
        return current.textContent.length > largest.textContent.length ? current : largest;
      });
    }

    // 3. 查找包含最多标题的元素
    const allElements = document.querySelectorAll('div, section, article, main');
    let bestContainer = null;
    let maxHeaders = 0;

    allElements.forEach(element => {
      const headers = element.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      if (headers > maxHeaders) {
        maxHeaders = headers;
        bestContainer = element;
      }
    });

    return bestContainer || document.body;
  }

  let contentContainer = findContentContainer();

  // 获取所有可能的标题元素
  function getHeaders() {
    // 标准标题标签
    const standardHeaders = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    // 自定义标题样式
    const customHeaders = Array.from(contentContainer.querySelectorAll('[class*="title"], [class*="heading"], [class*="header"]'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        const fontWeight = parseInt(style.fontWeight);
        return fontSize >= 16 && fontWeight >= 500;
      });

    // 合并并排序
    const allHeaders = [...standardHeaders, ...customHeaders]
      .filter(header => {
        // 过滤隐藏元素
        const style = window.getComputedStyle(header);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }

        // 检查是否在排除容器内
        let parent = header.parentElement;
        while (parent && parent !== contentContainer) {
          if (excludeContainers.some(selector => parent.matches(selector))) {
            return false;
          }
          parent = parent.parentElement;
        }

        return true;
      })
      .sort((a, b) => {
        // 根据元素在文档中的位置排序
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

    return allHeaders;
  }

  const headers = getHeaders();

  if (headers.length === 0) {
    console.log('No visible headers found');
    return;
  }

  // 创建目录树
  const tocTree = document.createElement('div');
  tocTree.className = 'toc-tree';

  // 添加标题
  const tocTitle = document.createElement('div');
  tocTitle.className = 'toc-title';
  tocTitle.textContent = 'Outline';
  tocTree.appendChild(tocTitle);

  // 创建目录列表
  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';

  // 处理每个标题
  headers.forEach(header => {
    // 确定标题级别
    let level = 1;
    if (header.tagName && header.tagName.match(/^H[1-6]$/)) {
      level = parseInt(header.tagName[1]);
    } else {
      // 根据字体大小和样式推断级别
      const style = window.getComputedStyle(header);
      const fontSize = parseInt(style.fontSize);
      if (fontSize >= 24) level = 1;
      else if (fontSize >= 20) level = 2;
      else if (fontSize >= 18) level = 3;
      else if (fontSize >= 16) level = 4;
      else level = 5;
    }

    const text = header.textContent.trim();
    if (!text) return;

    // 确保标题有 ID
    if (!header.id) {
      header.id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    // 创建目录项
    const li = document.createElement('li');
    li.className = `toc-item level-${level}`;

    const a = document.createElement('a');
    a.href = `#${header.id}`;
    a.textContent = text;

    // 点击事件处理
    a.addEventListener('click', (e) => {
      e.preventDefault();

      // 平滑滚动到目标位置
      header.scrollIntoView({ behavior: 'smooth' });

      // 添加高亮动画
      header.classList.add('toc-highlight');
      setTimeout(() => {
        header.classList.remove('toc-highlight');
      }, 3000); // 增加到 3 秒

      // 点击后延迟收起目录树
      setTimeout(() => {
        tocContainer.classList.remove('expanded');
      }, 800); // 增加到 800ms
    });

    li.appendChild(a);
    tocList.appendChild(li);
  });

  tocTree.appendChild(tocList);
  tocContainer.appendChild(tocTree);

  // 鼠标进入时展开目录树
  tocContainer.addEventListener('mouseenter', () => {
    tocContainer.classList.add('expanded');
  });

  // 鼠标离开时收起目录树
  tocContainer.addEventListener('mouseleave', () => {
    tocContainer.classList.remove('expanded');
  });

  // 点击事件处理
  tocContainer.addEventListener('click', (e) => {
    // 如果点击的是按钮图标，则滚动到顶部
    if (e.target.tagName === 'svg' || e.target.tagName === 'path') {
      const holder = document.body.scrollTop === 0 ? document.documentElement : document.body;
      scrollTo(holder, 0, 348);
    }
  });

  // 输入框获得焦点时收起目录树
  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      tocContainer.classList.remove('expanded');
    }
  });

  // 滚动事件处理
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(() => {
      const sTop = document.body.scrollTop + document.documentElement.scrollTop;
      if (sTop > 468) {
        tocContainer.style.display = 'block';
      } else {
        tocContainer.style.display = 'none';
      }
    });
  });

  function scrollTo(element, to, duration) {
    if (duration <= 0) return;
    const difference = to - element.scrollTop;
    const perTick = difference / duration * 10;

    setTimeout(() => {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop === to) return;
      scrollTo(element, to, duration - 10);
    }, 10);
  }
})();
