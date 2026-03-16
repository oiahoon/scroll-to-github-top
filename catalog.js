'use strict';

// 使用立即执行函数来创建独立的作用域
(function() {
  // 检查是否已经存在目录树
  if (document.getElementById('github-toc')) {
    return;
  }

  // 状态变量
  let observer = null;
  let updateTimeout = null;
  let lastProcessedHeaders = new Set();
  let lastUrl = window.location.href;
  let contentContainer = null;
  let isGitHub = window.location.hostname === 'github.com';
  let headerCount = 0;
  let currentHeaders = [];
  let reinitializeTimer = null;

  let tocContainer = null;
  let iconContainer = null;
  let tocTree = null;
  let tocList = null;
  let tocTitle = null;
  let tocTopButton = null;
  let tocCountBadge = null;

  let longPressTimer = null;
  let longPressTriggered = false;
  let hoverOpenTimer = null;
  let hoverCloseTimer = null;
  let isPinnedOpen = false;
  let performancePanelVisible = false;
  let performanceStatsTimer = null;
  let performanceStatsContainer = null;
  let shouldShowIconHint = true;

  const defaultSettings = {
    expandMode: 'hover', // 'press' | 'hover' | 'click'
    minHeaders: 3,
    showAfterScrollScreens: 1,
    position: 'right', // 'right' | 'left'
    disabledDomains: [],
    avoidExistingWidgets: true,
    forceShow: false
  };

  let settings = { ...defaultSettings };

  // 性能监控相关变量
  const performanceMetrics = {
    tocGeneration: [],
    tocUpdate: [],
    scrollPerformance: [],
    memoryUsage: []
  };

  function isDomainDisabled() {
    if (!settings.disabledDomains || settings.disabledDomains.length === 0) {
      return false;
    }
    return settings.disabledDomains.includes(window.location.hostname);
  }

  function hasExistingTOC() {
    const selectors = [
      '#toc',
      '#table-of-contents',
      '.toc',
      '.table-of-contents',
      '.toc-container',
      '.toc-wrapper',
      '.toc-sidebar',
      '.toc-nav',
      '.sidebar-toc',
      '[data-toc]',
      '[aria-label*="table of contents" i]',
      '[aria-label*="toc" i]'
    ];
    const candidates = selectors
      .map((selector) => Array.from(document.querySelectorAll(selector)))
      .flat();
    return candidates.some((element) => isVisible(element) && hasTocLinks(element) && isLikelySidebarToc(element));
  }

  function hasExistingScrollToTop() {
    const selectors = [
      '#scroll-to-top',
      '#back-to-top',
      '.scroll-to-top',
      '.back-to-top',
      '.scrolltop',
      '.to-top',
      '[data-scroll-to-top]',
      '[aria-label*="scroll to top" i]'
    ];
    const candidates = selectors
      .map((selector) => Array.from(document.querySelectorAll(selector)))
      .flat();
    return candidates.some((element) => isVisible(element) && isFixedOrSticky(element));
  }

  function shouldSkipInjection() {
    if (settings.forceShow) return false;
    if (!settings.avoidExistingWidgets) return false;
    return hasExistingTOC() || hasExistingScrollToTop();
  }

  function isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 40 && rect.height > 40;
  }

  function hasTocLinks(element) {
    const links = Array.from(element.querySelectorAll('a[href^="#"]'));
    if (links.length < 3) return false;
    return links.some((link) => link.getAttribute('href').length > 1);
  }

  function isFixedOrSticky(element) {
    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    const rect = element.getBoundingClientRect();
    return rect.width >= 32 && rect.height >= 32;
  }

  function isLikelySidebarToc(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const vw = Math.max(window.innerWidth, 1);
    const isEdgeAligned = rect.left < vw * 0.35 || rect.right > vw * 0.65;
    const inSidebarContainer = Boolean(
      element.closest(
        'aside, nav, .sidebar, .side-bar, .toc-sidebar, .toc-nav, .nav, .navigation, [role="navigation"]'
      )
    );
    return isEdgeAligned && (isFixedOrSticky(element) || inSidebarContainer);
  }

  function normalizeSettings(input) {
    const normalized = { ...defaultSettings, ...input };
    if (!Array.isArray(normalized.disabledDomains)) {
      normalized.disabledDomains = [];
    }
    if (!['press', 'hover', 'click'].includes(normalized.expandMode)) {
      normalized.expandMode = defaultSettings.expandMode;
    }
    if (!['left', 'right'].includes(normalized.position)) {
      normalized.position = defaultSettings.position;
    }
    normalized.minHeaders = Number.isFinite(normalized.minHeaders) ? Math.max(0, normalized.minHeaders) : defaultSettings.minHeaders;
    normalized.showAfterScrollScreens = Number.isFinite(normalized.showAfterScrollScreens)
      ? Math.max(0, normalized.showAfterScrollScreens)
      : defaultSettings.showAfterScrollScreens;
    return normalized;
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
        resolve({ ...defaultSettings });
        return;
      }
      chrome.storage.sync.get(defaultSettings, (items) => {
        resolve(items || { ...defaultSettings });
      });
    });
  }

  function loadUiState() {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        resolve({ tocHintDismissed: false });
        return;
      }

      chrome.storage.local.get({ tocHintDismissed: false }, (items) => {
        resolve(items || { tocHintDismissed: false });
      });
    });
  }

  function dismissIconHint() {
    if (!shouldShowIconHint) return;
    shouldShowIconHint = false;
    if (iconContainer) {
      iconContainer.setAttribute('data-label', '');
    }
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ tocHintDismissed: true });
    }
  }

  // 创建目录树容器
  function createUI() {
    tocContainer = document.createElement('div');
    tocContainer.id = 'github-toc';
    tocContainer.className = 'github-toc theme-light';
    tocContainer.classList.add(settings.position === 'left' ? 'position-left' : 'position-right');
    // ARIA：辅助导航区域
    tocContainer.setAttribute('role', 'complementary');
    tocContainer.setAttribute('aria-label', '页面目录导航');
    tocContainer.setAttribute('aria-expanded', 'false');
    tocContainer.setAttribute('data-pinned', 'false');
    document.body.appendChild(tocContainer);

    // 添加按钮图标（20×20，在 44px 容器内占比约 45%）
    const buttonSvg = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>';
    iconContainer = document.createElement('div');
    iconContainer.className = 'toc-icon';
    iconContainer.innerHTML = buttonSvg;
    // ARIA：图标作为可聚焦按钮
    iconContainer.setAttribute('role', 'button');
    iconContainer.setAttribute('tabindex', '0');
    iconContainer.setAttribute('aria-label', '展开目录');
    iconContainer.setAttribute('aria-haspopup', 'true');
    iconContainer.setAttribute('data-label', shouldShowIconHint ? 'TOC' : '');
    tocContainer.appendChild(iconContainer);

    // 为图标绑定键盘事件（Enter / Space 触发展开/折叠或回到顶部）
    iconContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // 模拟点击行为（与各交互模式下的 click 处理一致）
        iconContainer.click();
      }
    });

    // 创建目录树结构
    tocTree = document.createElement('div');
    tocTree.className = 'toc-tree';
    // 初始折叠时对屏幕阅读器隐藏
    tocTree.setAttribute('aria-hidden', 'true');

    // 添加标题
    tocTitle = document.createElement('div');
    tocTitle.className = 'toc-title';
    // 标题文字节点（OUTLINE 标签，对屏幕阅读器装饰性隐藏）
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'OUTLINE';
    titleSpan.setAttribute('aria-hidden', 'true');
    tocTitle.appendChild(titleSpan);

    tocCountBadge = document.createElement('span');
    tocCountBadge.className = 'toc-count-badge';
    tocCountBadge.textContent = '0';
    tocCountBadge.setAttribute('aria-label', '0 sections');
    tocTitle.appendChild(tocCountBadge);

    tocTopButton = document.createElement('button');
    tocTopButton.type = 'button';
    tocTopButton.className = 'toc-top-button';
    tocTopButton.textContent = 'Top';
    tocTopButton.setAttribute('aria-label', '回到页面顶部');
    tocTitle.appendChild(tocTopButton);

    tocTree.appendChild(tocTitle);

    // 创建目录列表
    tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    tocList.setAttribute('role', 'list');
    tocList.setAttribute('aria-label', '文章目录');
    tocTree.appendChild(tocList);

    // 将目录树添加到容器中
    tocContainer.appendChild(tocTree);

    // 键盘导航：Escape 折叠面板，Arrow Up/Down 在条目间移动
    tocContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tocContainer.classList.contains('expanded')) {
        e.preventDefault();
        closePanel();
        iconContainer.focus();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const links = Array.from(tocList.querySelectorAll('.toc-item:not(.no-headers) a'));
        if (links.length === 0) return;
        const focused = document.activeElement;
        const idx = links.indexOf(focused);
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = links[idx + 1] || links[0];
          next.focus();
        } else {
          e.preventDefault();
          const prev = links[idx - 1] || links[links.length - 1];
          prev.focus();
        }
      }
    });
  }

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
    '.mdx-content',
    '.md-content',
    '.rst-content',
    '.asciidoc-content',
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

  // 工具函数
  function cleanup() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    if (reinitializeTimer) {
      clearTimeout(reinitializeTimer);
      reinitializeTimer = null;
    }
    lastProcessedHeaders.clear();
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function isGitHubPage() {
    return window.location.hostname === 'github.com';
  }

  function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      return true;
    }
    return false;
  }

  // 核心功能函数
  function findContentContainer() {
    for (const selector of mainContainers) {
      const container = document.querySelector(selector);
      if (container) {
        return container;
      }
    }

    const contentBlocks = Array.from(document.querySelectorAll('article, main, [role="main"], [role="article"], [role="document"]'));
    if (contentBlocks.length > 0) {
      return contentBlocks.reduce((largest, current) => {
        return current.textContent.length > largest.textContent.length ? current : largest;
      });
    }

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

  function getHeaders() {
    if (!contentContainer) {
      return [];
    }

    const standardHeaders = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const customHeaders = Array.from(contentContainer.querySelectorAll('[class*="title"], [class*="heading"], [class*="header"]'))
      .filter(el => {
        const style = window.getComputedStyle(el);
        const fontSize = parseInt(style.fontSize);
        const fontWeight = parseInt(style.fontWeight);
        return fontSize >= 16 && fontWeight >= 500;
      });

    return [...standardHeaders, ...customHeaders]
      .filter(header => {
        const style = window.getComputedStyle(header);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }

        let parent = header.parentElement;
        while (parent && parent !== contentContainer) {
          if (excludeContainers.some(selector => parent.matches(selector))) {
            return false;
          }
          parent = parent.parentElement;
        }

        const headerText = header.textContent.trim();
        const headerId = `${headerText}-${header.tagName}-${header.offsetTop}`;
        if (lastProcessedHeaders.has(headerId)) {
          return false;
        }
        lastProcessedHeaders.add(headerId);

        return true;
      })
      .sort((a, b) => {
        return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
  }

  // 性能监控工具函数
  function measurePerformance(metricName, callback) {
    if (!performancePanelVisible) {
      return callback();
    }

    const startTime = performance.now();
    const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const result = callback();

    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const duration = endTime - startTime;
    const memoryDelta = endMemory - startMemory;

    performanceMetrics[metricName].push({
      timestamp: Date.now(),
      duration,
      memoryDelta,
      memoryUsage: endMemory
    });

    // 只保留最近100条记录
    if (performanceMetrics[metricName].length > 100) {
      performanceMetrics[metricName].shift();
    }

    return result;
  }

  function getPerformanceStats(metricName) {
    const metrics = performanceMetrics[metricName];
    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration);
    const memoryDeltas = metrics.map(m => m.memoryDelta);

    return {
      count: metrics.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      latestMemoryUsage: metrics[metrics.length - 1].memoryUsage
    };
  }

  function ensurePerformanceStatsContainer() {
    if (performanceStatsContainer) {
      return performanceStatsContainer;
    }

    performanceStatsContainer = document.createElement('div');
    performanceStatsContainer.id = 'toc-performance-stats';
    performanceStatsContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      display: none;
    `;
    document.body.appendChild(performanceStatsContainer);
    return performanceStatsContainer;
  }

  function renderPerformanceStats() {
    const statsContainer = ensurePerformanceStatsContainer();
    if (!performancePanelVisible) return;

    const stats = {
      generation: getPerformanceStats('tocGeneration'),
      update: getPerformanceStats('tocUpdate'),
      scroll: getPerformanceStats('scrollPerformance')
    };

    if (!stats.generation && !stats.update && !stats.scroll) {
      statsContainer.innerHTML = '<h3>TOC Performance Stats</h3><p>No metrics collected yet.</p>';
      return;
    }

    let html = '<h3>TOC Performance Stats</h3>';

    if (stats.generation) {
      html += `
        <div>
          <h4>Generation</h4>
          <p>Count: ${stats.generation.count}</p>
          <p>Avg Duration: ${stats.generation.avgDuration.toFixed(2)}ms</p>
          <p>Min/Max: ${stats.generation.minDuration.toFixed(2)}ms / ${stats.generation.maxDuration.toFixed(2)}ms</p>
          <p>Memory Usage: ${(stats.generation.latestMemoryUsage / 1024 / 1024).toFixed(2)}MB</p>
        </div>
      `;
    }

    if (stats.update) {
      html += `
        <div>
          <h4>Updates</h4>
          <p>Count: ${stats.update.count}</p>
          <p>Avg Duration: ${stats.update.avgDuration.toFixed(2)}ms</p>
          <p>Min/Max: ${stats.update.minDuration.toFixed(2)}ms / ${stats.update.maxDuration.toFixed(2)}ms</p>
          <p>Memory Delta: ${(stats.update.avgMemoryDelta / 1024 / 1024).toFixed(2)}MB</p>
        </div>
      `;
    }

    if (stats.scroll) {
      html += `
        <div>
          <h4>Scroll Performance</h4>
          <p>Count: ${stats.scroll.count}</p>
          <p>Avg Duration: ${stats.scroll.avgDuration.toFixed(2)}ms</p>
          <p>Min/Max: ${stats.scroll.minDuration.toFixed(2)}ms / ${stats.scroll.maxDuration.toFixed(2)}ms</p>
        </div>
      `;
    }

    statsContainer.innerHTML = html;
  }

  function togglePerformanceStats() {
    const statsContainer = ensurePerformanceStatsContainer();
    performancePanelVisible = !performancePanelVisible;
    statsContainer.style.display = performancePanelVisible ? 'block' : 'none';

    if (performancePanelVisible) {
      renderPerformanceStats();
      if (!performanceStatsTimer) {
        performanceStatsTimer = setInterval(renderPerformanceStats, 1000);
      }
      return;
    }

    if (performanceStatsTimer) {
      clearInterval(performanceStatsTimer);
      performanceStatsTimer = null;
    }
  }

  function setupPerformanceStats() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        togglePerformanceStats();
      }
    });
  }

  // 修改现有的函数以包含性能监控
  function updateTOC() {
    return measurePerformance('tocUpdate', () => {
      lastProcessedHeaders.clear();

      const headers = getHeaders();
      currentHeaders = headers;
      headerCount = headers.length;
      if (tocCountBadge) {
        tocCountBadge.textContent = String(headerCount);
        tocCountBadge.setAttribute('aria-label', `${headerCount} sections`);
      }
      if (headers.length === 0) {
        if (tocList) {
          tocList.innerHTML = `
            <li class="toc-item no-headers">
              <div class="no-headers-message">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span>No headers found</span>
                <p>This page doesn't have any headings or the content is not loaded yet.</p>
              </div>
            </li>
          `;
        }
        updateVisibility();
        return;
      }

      if (!tocList) return;

      tocList.innerHTML = '';

      headers.forEach(header => {
        let level = 1;
        if (header.tagName && header.tagName.match(/^H[1-6]$/)) {
          level = parseInt(header.tagName[1]);
        } else {
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

        if (!header.id) {
          header.id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        const li = document.createElement('li');
        li.className = `toc-item level-${level}`;
        li.dataset.headerId = header.id;

        const a = document.createElement('a');
        a.href = `#${header.id}`;
        a.textContent = text;

        a.addEventListener('click', (e) => {
          e.preventDefault();
          header.scrollIntoView({ behavior: 'smooth' });

          // 移除所有目录项的高亮及 aria-current
          tocList.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
            const itemLink = item.querySelector('a');
            if (itemLink) itemLink.removeAttribute('aria-current');
          });

          // 添加当前目录项的高亮及 aria-current
          li.classList.add('active');
          a.setAttribute('aria-current', 'location');

          // 更新当前活动标题
          updateActiveHeader();
        });

        li.appendChild(a);
        tocList.appendChild(li);
      });

      // 初始化当前活动标题
      updateActiveHeader();
      updateVisibility();
    });
  }

  // 添加更新当前活动标题的函数
  function updateActiveHeader() {
    const headers = currentHeaders;
    if (!headers || headers.length === 0) return;

    // 找到当前视口中的标题
    let activeHeader = null;
    let minDistance = Infinity;

    headers.forEach(header => {
      const rect = header.getBoundingClientRect();
      const distance = Math.abs(rect.top);

      if (distance < minDistance && rect.top <= 100) {
        minDistance = distance;
        activeHeader = header;
      }
    });

    // 更新目录项的高亮状态及 aria-current
    if (activeHeader) {
      tocList.querySelectorAll('.toc-item').forEach(item => {
        const link = item.querySelector('a');
        if (item.dataset.headerId === activeHeader.id) {
          item.classList.add('active');
          if (link) link.setAttribute('aria-current', 'location');
        } else {
          item.classList.remove('active');
          if (link) link.removeAttribute('aria-current');
        }
      });
    }
  }

  // 修改滚动监听以包含性能监控
  let scrollTimeout;
  function getScrollTop() {
    return document.body.scrollTop + document.documentElement.scrollTop;
  }

  function shouldShowToc() {
    const threshold = window.innerHeight * settings.showAfterScrollScreens;
    return headerCount >= settings.minHeaders && getScrollTop() > threshold;
  }

  function updateVisibility() {
    if (tocContainer) {
      tocContainer.style.display = shouldShowToc() ? 'flex' : 'none';
    }
  }

  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(() => {
      measurePerformance('scrollPerformance', () => {
        updateVisibility();
        updateActiveHeader();
      });
    });
  });

  function scheduleReinitialize(delay = 100) {
    if (reinitializeTimer) {
      clearTimeout(reinitializeTimer);
    }
    reinitializeTimer = setTimeout(() => {
      reinitializeTimer = null;
      reinitializeTOC();
    }, delay);
  }

  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(debounce((mutations) => {
      let shouldUpdate = false;

      if (checkUrlChange()) {
        shouldUpdate = true;
      }

      for (const mutation of mutations) {
        if (mutation.type !== 'childList') {
          continue;
        }

        const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
        const affectsHeadings = changedNodes.some((node) => {
          if (!(node instanceof Element)) {
            return false;
          }
          return (
            node.matches('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"], [class*="header"]') ||
            node.querySelector('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="heading"], [class*="header"]')
          );
        });

        if (affectsHeadings) {
          shouldUpdate = true;
          break;
        }
      }

      if (shouldUpdate) {
        scheduleReinitialize(120);
      }
    }, 250));

    observer.observe(contentContainer || document.body, {
      childList: true,
      subtree: true
    });

    updateTOC();
  }

  function setupGitHubListener() {
    if (!isGitHubPage()) return;

    document.addEventListener('pjax:start', cleanup);
    document.addEventListener('pjax:end', () => scheduleReinitialize(120));
    document.addEventListener('turbo:load', () => scheduleReinitialize(120));
    document.addEventListener('ajaxComplete', () => scheduleReinitialize(120));
  }

  function setupHistoryListener() {
    window.addEventListener('popstate', () => scheduleReinitialize(120));

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      scheduleReinitialize(120);
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      scheduleReinitialize(120);
    };
  }

  function reinitializeTOC() {
    return measurePerformance('tocGeneration', () => {
      const nextContainer = findContentContainer();
      const containerChanged = nextContainer !== contentContainer;
      contentContainer = nextContainer;

      if (containerChanged || !observer) {
        setupObserver();
      } else {
        updateTOC();
      }
    });
  }

  function initialize() {
    contentContainer = findContentContainer();
    setupObserver();
    setupHistoryListener();
    setupGitHubListener();
    setupPerformanceStats();
  }

  function isClickOnTocLink(event) {
    return event.target && event.target.closest && event.target.closest('.toc-item a');
  }

  function isIconClick(event) {
    return event.target && event.target.closest && event.target.closest('.toc-icon');
  }

  function toggleExpanded(force) {
    if (!tocContainer) return;
    const shouldExpand = typeof force === 'boolean' ? force : !tocContainer.classList.contains('expanded');
    if (!shouldExpand) {
      // 折叠时临时添加 is-collapsing，使 CSS 使用快速收缩曲线
      tocContainer.classList.add('is-collapsing');
      // transition 结束后移除；同时设置 setTimeout 兜底，
      // 防止 prefers-reduced-motion: reduce 禁用 transition 后 transitionend 永不触发
      const collapseCleanup = () => {
        tocContainer.classList.remove('is-collapsing');
        tocContainer.removeEventListener('transitionend', collapseCleanup);
        clearTimeout(collapseFallback);
      };
      tocContainer.addEventListener('transitionend', collapseCleanup);
      const collapseFallback = setTimeout(collapseCleanup, 300);
    } else {
      tocContainer.classList.remove('is-collapsing');
    }
    tocContainer.classList.toggle('expanded', shouldExpand);
    // 同步 ARIA 状态
    tocContainer.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
    if (tocTree) {
      tocTree.setAttribute('aria-hidden', shouldExpand ? 'false' : 'true');
    }
    if (iconContainer) {
      iconContainer.setAttribute('aria-label', shouldExpand ? '折叠目录' : '展开目录');
    }
  }

  function clearHoverTimers() {
    clearTimeout(hoverOpenTimer);
    clearTimeout(hoverCloseTimer);
  }

  function setPinnedState(pinned) {
    isPinnedOpen = pinned;
    if (!tocContainer) return;
    tocContainer.classList.toggle('is-pinned', pinned);
    tocContainer.setAttribute('data-pinned', pinned ? 'true' : 'false');
    if (pinned) {
      dismissIconHint();
    }
  }

  function closePanel() {
    clearHoverTimers();
    setPinnedState(false);
    toggleExpanded(false);
  }

  function scheduleHoverOpen() {
    if (isPinnedOpen) return;
    clearHoverTimers();
    hoverOpenTimer = setTimeout(() => {
      toggleExpanded(true);
    }, 120);
  }

  function scheduleHoverClose() {
    if (isPinnedOpen) return;
    clearHoverTimers();
    hoverCloseTimer = setTimeout(() => {
      toggleExpanded(false);
    }, 180);
  }

  function scrollToTop() {
    const holder = document.body.scrollTop === 0 ? document.documentElement : document.body;
    scrollTo(holder, 0, 348);
  }

  function setupInteractions() {
    if (!tocContainer) return;

    if (settings.expandMode === 'hover') {
      tocContainer.addEventListener('mouseenter', scheduleHoverOpen);
      tocContainer.addEventListener('mouseleave', scheduleHoverClose);

      if (iconContainer) {
        iconContainer.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          clearHoverTimers();
          if (!tocContainer.classList.contains('expanded')) {
            setPinnedState(true);
            toggleExpanded(true);
            return;
          }
          if (isPinnedOpen) {
            closePanel();
            return;
          }
          setPinnedState(true);
        });
      }
    }

    if (settings.expandMode === 'click') {
      tocContainer.addEventListener('click', (e) => {
        if (isClickOnTocLink(e)) return;
        if (e.target && e.target.closest && e.target.closest('.toc-top-button')) return;
        if (tocContainer.classList.contains('expanded')) {
          closePanel();
        } else {
          setPinnedState(true);
          toggleExpanded(true);
        }
      });
    }

    if (tocTree) {
      tocTree.addEventListener('click', (e) => {
        if (!tocContainer.classList.contains('expanded')) return;
        if (isClickOnTocLink(e)) return;
        if (e.target && e.target.closest && e.target.closest('.toc-top-button')) return;
        closePanel();
      });
    }

    if (settings.expandMode === 'press') {
      tocContainer.addEventListener('pointerdown', (e) => {
        if (isClickOnTocLink(e)) return;
        longPressTriggered = false;
        longPressTimer = setTimeout(() => {
          longPressTriggered = true;
          toggleExpanded();
        }, 450);
      });

      tocContainer.addEventListener('pointerup', (e) => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        if (!longPressTriggered && !isClickOnTocLink(e)) {
          if (tocContainer.classList.contains('expanded') && isIconClick(e)) {
            closePanel();
            return;
          }
          scrollToTop();
        }
      });

      tocContainer.addEventListener('pointerleave', () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      });
    }

    if (tocTopButton) {
      tocTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
      });
    }

    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        closePanel();
      }
    });

    document.addEventListener('pointerdown', (e) => {
      if (!tocContainer.classList.contains('expanded')) return;
      if (tocContainer.contains(e.target)) return;
      if (settings.expandMode === 'hover' && !isPinnedOpen) return;
      closePanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tocContainer.classList.contains('expanded')) {
        closePanel();
      }
    });
  }

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

  function start() {
    const legacyScrollTopButton = document.getElementById('github-sst');
    if (legacyScrollTopButton) {
      legacyScrollTopButton.remove();
    }
    if (isDomainDisabled()) {
      return;
    }
    if (shouldSkipInjection()) {
      return;
    }
    createUI();
    setupInteractions();
    initialize();
    updateVisibility();
    window.addEventListener('unload', cleanup);
  }

  loadSettings()
    .then((loaded) => Promise.all([Promise.resolve(loaded), loadUiState()]))
    .then(([loaded, uiState]) => {
      settings = normalizeSettings(loaded);
      shouldShowIconHint = !uiState.tocHintDismissed;
      start();
    })
    .catch(() => {
      settings = { ...defaultSettings };
      start();
    });
})();
