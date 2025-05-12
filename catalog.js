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
  tocContainer.className = 'github-toc';
  document.body.appendChild(tocContainer);

  // 添加按钮图标
  const buttonSvg = '<svg width="30" height="30" viewBox="0 0 1024 1024"><path d="M792.748 599.403l-257.312-259.001c-5.7-5.73-13.683-8.998-23.437-8.998s-16.541 3.881-21.63 8.971l-261.758 260.585c-11.205 11.174-11.231 29.313-0.031 40.513 13.731 13.731 34.927 5.614 40.544 0.056l214.226-213.168v372.648c0 15.844 12.835 28.653 28.649 28.653 15.817 0 28.653-12.813 28.653-28.653v-374.053l211.469 212.845c5.587 5.617 12.981 8.453 20.311 8.453 7.337 0 14.615-2.784 20.202-8.338 11.257-11.148 11.288-29.313 0.113-40.514v0 0zM827.161 251.635h-630.316c-15.817 0-28.653-12.835-28.653-28.645 0-15.818 12.835-28.653 28.653-28.653h630.316c15.84 0 28.645 12.835 28.645 28.653 0 15.81-12.805 28.645-28.645 28.645v0 0zM827.161 251.635z"></path></svg>';
  tocContainer.innerHTML = buttonSvg;

  // 查找主要内容容器
  const mainContainers = [
    'main-container',
    'body-container',
    'application-main',
    'main-content',
    'content',
    'article',
    'main',
    '.markdown-body', // GitHub 的 markdown 内容
    '#readme', // GitHub 的 README 内容
    '.repository-content', // GitHub 的仓库内容
    '.js-repo-root' // GitHub 的仓库根目录
  ];

  // 需要排除的容器选择器
  const excludeContainers = [
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
    '.js-header-wrapper', // GitHub 的顶部导航
    '.js-repo-nav', // GitHub 的仓库导航
    '.js-site-header', // GitHub 的站点头部
    '.js-site-footer', // GitHub 的站点底部
    '.js-notification-shelf', // GitHub 的通知栏
    '[role="navigation"]', // 使用 role 属性的导航
    '[role="banner"]', // 使用 role 属性的头部
    '[role="contentinfo"]', // 使用 role 属性的底部
    // 添加更多侧边栏相关选择器
    '.sidebar',
    '.side-bar',
    '.sideBar',
    '.side-bar-container',
    '.sidebar-container',
    '.js-sidebar',
    '.js-side-bar',
    '.js-sidebar-container',
    '.js-side-bar-container',
    '.sidebar-wrapper',
    '.side-bar-wrapper',
    '.js-sidebar-wrapper',
    '.js-side-bar-wrapper',
    '.sidebar-content',
    '.side-bar-content',
    '.js-sidebar-content',
    '.js-side-bar-content',
    '.sidebar-menu',
    '.side-bar-menu',
    '.js-sidebar-menu',
    '.js-side-bar-menu',
    '.sidebar-nav',
    '.side-bar-nav',
    '.js-sidebar-nav',
    '.js-side-bar-nav',
    '.sidebar-list',
    '.side-bar-list',
    '.js-sidebar-list',
    '.js-side-bar-list',
    '.sidebar-item',
    '.side-bar-item',
    '.js-sidebar-item',
    '.js-side-bar-item',
    '.sidebar-section',
    '.side-bar-section',
    '.js-sidebar-section',
    '.js-side-bar-section',
    '.sidebar-panel',
    '.side-bar-panel',
    '.js-sidebar-panel',
    '.js-side-bar-panel',
    '.sidebar-widget',
    '.side-bar-widget',
    '.js-sidebar-widget',
    '.js-side-bar-widget',
    '.sidebar-block',
    '.side-bar-block',
    '.js-sidebar-block',
    '.js-side-bar-block',
    '.sidebar-area',
    '.side-bar-area',
    '.js-sidebar-area',
    '.js-side-bar-area',
    '.sidebar-region',
    '.side-bar-region',
    '.js-sidebar-region',
    '.js-side-bar-region',
    '.sidebar-zone',
    '.side-bar-zone',
    '.js-sidebar-zone',
    '.js-side-bar-zone',
    '[role="complementary"]', // ARIA 角色：补充内容（通常用于侧边栏）
    '[role="note"]', // ARIA 角色：注释
    '[role="doc-footnote"]', // ARIA 角色：脚注
    '[role="doc-endnotes"]', // ARIA 角色：尾注
    '[role="doc-bibliography"]', // ARIA 角色：参考文献
    '[role="doc-glossary"]', // ARIA 角色：术语表
    '[role="doc-appendix"]' // ARIA 角色：附录
  ];

  let contentContainer = null;
  for (const selector of mainContainers) {
    const container = document.querySelector(selector);
    if (container) {
      contentContainer = container;
      break;
    }
  }

  // 如果没有找到特定的容器，使用 body
  if (!contentContainer) {
    contentContainer = document.body;
  }

  // 获取所有标题元素
  const headers = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    .filter(header => {
      // 过滤掉隐藏的标题
      const style = window.getComputedStyle(header);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }

      // 检查标题是否在排除的容器内
      let parent = header.parentElement;
      while (parent && parent !== contentContainer) {
        // 检查标签名
        if (parent.tagName.toLowerCase() === 'nav') {
          return false;
        }

        // 检查类名
        const classList = parent.classList;
        if (classList.contains('nav') ||
            classList.contains('navbar') ||
            classList.contains('navigation') ||
            classList.contains('header') ||
            classList.contains('footer') ||
            classList.contains('sidebar') ||
            classList.contains('side-bar') ||
            classList.contains('sideBar')) {
          return false;
        }

        // 检查 role 属性
        const role = parent.getAttribute('role');
        if (role === 'navigation' ||
            role === 'banner' ||
            role === 'contentinfo' ||
            role === 'complementary' ||
            role === 'note' ||
            role === 'doc-footnote' ||
            role === 'doc-endnotes' ||
            role === 'doc-bibliography' ||
            role === 'doc-glossary' ||
            role === 'doc-appendix') {
          return false;
        }

        // 检查其他选择器
        for (const selector of excludeContainers) {
          if (parent.matches(selector)) {
            return false;
          }
        }

        parent = parent.parentElement;
      }

      return true;
    });

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
  tocTitle.textContent = '目录';
  tocTree.appendChild(tocTitle);

  // 创建目录列表
  const tocList = document.createElement('ul');
  tocList.className = 'toc-list';

  // 处理每个标题
  headers.forEach(header => {
    const level = parseInt(header.tagName[1]);
    const text = header.textContent.trim();

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
