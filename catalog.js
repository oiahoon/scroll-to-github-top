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

  let tocContainer = null;
  let iconContainer = null;
  let tocTree = null;
  let tocList = null;
  let tocTitle = null;
  let tocTopButton = null;

  let longPressTimer = null;
  let longPressTriggered = false;

  const defaultSettings = {
    expandMode: 'press', // 'press' | 'hover' | 'click'
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
    return candidates.some((element) => isVisible(element) && hasTocLinks(element));
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

  // 创建目录树容器
  function createUI() {
    tocContainer = document.createElement('div');
    tocContainer.id = 'github-toc';
    tocContainer.className = 'github-toc theme-light';
    tocContainer.classList.add(settings.position === 'left' ? 'position-left' : 'position-right');
    document.body.appendChild(tocContainer);

    // 添加按钮图标
    const buttonSvg = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>';
    iconContainer = document.createElement('div');
    iconContainer.className = 'toc-icon';
    iconContainer.innerHTML = buttonSvg;
    tocContainer.appendChild(iconContainer);

    // 创建目录树结构
    tocTree = document.createElement('div');
    tocTree.className = 'toc-tree';

    // 添加标题
    tocTitle = document.createElement('div');
    tocTitle.className = 'toc-title';
    tocTitle.textContent = 'Outline';

    tocTopButton = document.createElement('button');
    tocTopButton.type = 'button';
    tocTopButton.className = 'toc-top-button';
    tocTopButton.textContent = 'Top';
    tocTitle.appendChild(tocTopButton);

    tocTree.appendChild(tocTitle);

    // 创建目录列表
    tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    tocTree.appendChild(tocList);

    // 将目录树添加到容器中
    tocContainer.appendChild(tocTree);
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
    }
    if (updateTimeout) {
      clearTimeout(updateTimeout);
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

  function displayPerformanceStats() {
    const statsContainer = document.createElement('div');
    statsContainer.id = 'toc-performance-stats';
    statsContainer.style.cssText = `
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

    document.body.appendChild(statsContainer);

    // 添加显示/隐藏快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        statsContainer.style.display = statsContainer.style.display === 'none' ? 'block' : 'none';
      }
    });

    // 定期更新性能统计
    setInterval(() => {
      const stats = {
        generation: getPerformanceStats('tocGeneration'),
        update: getPerformanceStats('tocUpdate'),
        scroll: getPerformanceStats('scrollPerformance')
      };

      if (!stats.generation && !stats.update && !stats.scroll) return;

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
    }, 1000);
  }

  // 修改现有的函数以包含性能监控
  function updateTOC() {
    return measurePerformance('tocUpdate', () => {
      cleanup();
      lastProcessedHeaders.clear();

      const headers = getHeaders();
      headerCount = headers.length;
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

          // 移除所有目录项的高亮
          document.querySelectorAll('.toc-item').forEach(item => {
            item.classList.remove('active');
          });

          // 添加当前目录项的高亮
          li.classList.add('active');

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
    const headers = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const scrollPosition = window.scrollY;

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

    // 更新目录项的高亮状态
    if (activeHeader) {
      document.querySelectorAll('.toc-item').forEach(item => {
        if (item.dataset.headerId === activeHeader.id) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
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
    if (!tocContainer) return;
    tocContainer.style.display = shouldShowToc() ? 'block' : 'none';
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
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          shouldUpdate = true;
          break;
        }
      }

      if (shouldUpdate) {
        setTimeout(() => {
          reinitializeTOC();
        }, 100);
      }
    }, 250));

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    updateTOC();
  }

  function setupGitHubListener() {
    if (!isGitHubPage()) return;

    document.addEventListener('pjax:start', cleanup);
    document.addEventListener('pjax:end', () => setTimeout(reinitializeTOC, 100));
    document.addEventListener('turbo:load', () => setTimeout(reinitializeTOC, 100));
    document.addEventListener('ajaxComplete', () => setTimeout(reinitializeTOC, 100));
  }

  function setupHistoryListener() {
    window.addEventListener('popstate', () => setTimeout(reinitializeTOC, 100));

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(this, arguments);
      setTimeout(reinitializeTOC, 100);
    };

    history.replaceState = function() {
      originalReplaceState.apply(this, arguments);
      setTimeout(reinitializeTOC, 100);
    };
  }

  function reinitializeTOC() {
    return measurePerformance('tocGeneration', () => {
      cleanup();
      contentContainer = findContentContainer();
      setupObserver();
      updateTOC();
    });
  }

  function initialize() {
    contentContainer = findContentContainer();
    setupObserver();
    setupHistoryListener();
    setupGitHubListener();
    displayPerformanceStats();

    if (isGitHubPage()) {
      setInterval(() => {
        const currentContainer = findContentContainer();
        if (currentContainer !== contentContainer) {
          reinitializeTOC();
        }
      }, 1000);
    }
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
    tocContainer.classList.toggle('expanded', shouldExpand);
    if (iconContainer) {
      iconContainer.style.opacity = shouldExpand ? '0' : '1';
    }
  }

  function scrollToTop() {
    const holder = document.body.scrollTop === 0 ? document.documentElement : document.body;
    scrollTo(holder, 0, 348);
  }

  function setupInteractions() {
    if (!tocContainer) return;

    if (settings.expandMode === 'hover') {
      tocContainer.addEventListener('mouseenter', () => {
        toggleExpanded(true);
      });

      tocContainer.addEventListener('mouseleave', () => {
        toggleExpanded(false);
      });
    }

    if (settings.expandMode === 'click') {
      tocContainer.addEventListener('click', (e) => {
        if (isClickOnTocLink(e)) return;
        if (isIconClick(e) && !tocContainer.classList.contains('expanded')) {
          scrollToTop();
          return;
        }
        toggleExpanded();
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
            toggleExpanded(false);
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
        toggleExpanded(false);
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
    .then((loaded) => {
      settings = normalizeSettings(loaded);
      start();
    })
    .catch(() => {
      settings = { ...defaultSettings };
      start();
    });
})();
