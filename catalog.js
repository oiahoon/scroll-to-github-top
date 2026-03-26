'use strict';

// 使用立即执行函数来创建独立的作用域
(function() {
  // 检查是否已经存在目录树
  if (document.getElementById('github-toc')) {
    return;
  }

  // 状态变量
  let observer = null;
  let headingObserver = null;
  let updateTimeout = null;
  let lastProcessedHeaders = new Set();
  let lastUrl = window.location.href;
  let contentContainer = null;
  let isGitHub = window.location.hostname === 'github.com';
  let headerCount = 0;
  let currentHeaders = [];
  let reinitializeTimer = null;
  let lastActiveHeaderId = null;
  let lastRenderedTocSignature = '';
  let lastObservedHeadersSignature = '';
  let observerActiveHeaderId = null;

  let tocContainer = null;
  let iconContainer = null;
  let tocTree = null;
  let tocList = null;
  let tocTitle = null;
  let tocTopButton = null;
  let tocCountBadge = null;
  let scrollTopButton = null;

  let longPressTimer = null;
  let longPressTriggered = false;
  let hoverOpenTimer = null;
  let hoverCloseTimer = null;
  let isPinnedOpen = false;
  let performancePanelVisible = false;
  let performanceStatsTimer = null;
  let performanceStatsContainer = null;
  let shouldShowIconHint = true;
  let lastSkipDecision = null;

  const defaultSettings = {
    themePreset: 'default',
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

  const genericTocSelectors = [
    '#toc',
    '#table-of-contents',
    '.toc',
    '.table-of-contents',
    '.toc-container',
    '.toc-wrapper',
    '.toc-sidebar',
    '.toc-nav',
    '.sidebar-toc',
    '[class*="toc" i]',
    '[class*="outline" i]',
    '[class*="catalog" i]',
    '[class*="directory" i]',
    '[class*="anchor" i]',
    '[class*="article-nav" i]',
    '[id*="toc" i]',
    '[id*="outline" i]',
    '[data-toc]',
    '[aria-label*="table of contents" i]',
    '[aria-label*="toc" i]'
  ];

  const genericScrollToTopSelectors = [
    '#scroll-to-top',
    '#back-to-top',
    '.scroll-to-top',
    '.back-to-top',
    '.scrolltop',
    '.to-top',
    '[data-scroll-to-top]',
    '[aria-label*="scroll to top" i]'
  ];

  const siteSpecificWidgetDetectors = [
    {
      type: 'toc',
      name: 'sspai-right-rail',
      hosts: ['sspai.com'],
      selectors: [
        '[class*="catalog" i]',
        '[class*="outline" i]',
        '[class*="toc" i]',
        '[class*="article-nav" i]',
        '[class*="post-nav" i]'
      ],
      predicate: (element) => isVisible(element) && isLikelySidebarToc(element) && hasLinearNavigationItems(element)
    }
  ];

  function isDomainDisabled() {
    if (!settings.disabledDomains || settings.disabledDomains.length === 0) {
      return false;
    }
    return settings.disabledDomains.includes(window.location.hostname);
  }

  function matchesConfiguredHost(hostname, configuredHosts) {
    return configuredHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  }

  function buildSkipDecision(type, source, element, details = {}) {
    return {
      type,
      source,
      element,
      details
    };
  }

  function recordSkipDecision(decision) {
    lastSkipDecision = decision;

    const reason = decision ? `${decision.type}:${decision.source}` : '';
    if (reason) {
      document.documentElement.setAttribute('data-smart-toc-skip-reason', reason);
    } else {
      document.documentElement.removeAttribute('data-smart-toc-skip-reason');
    }

    if (decision) {
      window.__SMART_TOC_LAST_SKIP__ = {
        type: decision.type,
        source: decision.source,
        details: decision.details
      };
    } else {
      delete window.__SMART_TOC_LAST_SKIP__;
    }
  }

  function publishWidgetDiagnostics(snapshot) {
    window.__SMART_TOC_WIDGET_DIAGNOSTICS__ = snapshot;
    window.__SMART_TOC_INSPECT_WIDGETS__ = inspectExistingWidgets;
  }

  function findElementsBySelectors(selectors) {
    return selectors
      .map((selector) => Array.from(document.querySelectorAll(selector)))
      .flat();
  }

  function findSiteSpecificWidget(type) {
    const hostname = window.location.hostname;

    for (const detector of siteSpecificWidgetDetectors) {
      if (detector.type !== type || !matchesConfiguredHost(hostname, detector.hosts)) {
        continue;
      }

      for (const selector of detector.selectors) {
        const matches = Array.from(document.querySelectorAll(selector)).filter((element) => detector.predicate(element));

        if (matches.length > 0) {
          return buildSkipDecision(detector.type, detector.name, matches[0], { selector });
        }
      }
    }

    return null;
  }

  function getExistingTocDecision() {
    const candidates = findElementsBySelectors(genericTocSelectors);

    const explicitMatch = candidates.find((element) => isVisible(element) && hasTocLinks(element) && isLikelySidebarToc(element));
    if (explicitMatch) {
      return buildSkipDecision('toc', 'generic-explicit-selector', explicitMatch, {
        selector: explicitMatch.id ? `#${explicitMatch.id}` : explicitMatch.className || explicitMatch.tagName.toLowerCase()
      });
    }

    const siteSpecificMatch = findSiteSpecificWidget('toc');
    if (siteSpecificMatch) {
      return siteSpecificMatch;
    }

    const semanticSidebarMatch = findSemanticSidebarToc();
    if (semanticSidebarMatch) {
      return buildSkipDecision('toc', 'generic-semantic-sidebar', semanticSidebarMatch, {
        selector: semanticSidebarMatch.tagName.toLowerCase()
      });
    }

    const edgeRailMatch = findEdgeNavigationWidgets()[0];
    if (edgeRailMatch) {
      return buildSkipDecision('toc', 'generic-edge-rail', edgeRailMatch);
    }

    return null;
  }

  function getExistingScrollToTopDecision() {
    const siteSpecificMatch = findSiteSpecificWidget('scroll-to-top');
    if (siteSpecificMatch) {
      return siteSpecificMatch;
    }

    const candidates = findElementsBySelectors(genericScrollToTopSelectors);
    const match = candidates.find((element) => isVisible(element) && isFixedOrSticky(element));
    if (!match) {
      return null;
    }

    return buildSkipDecision('scroll-to-top', 'generic-fixed-button', match, {
      selector: match.id ? `#${match.id}` : match.className || match.tagName.toLowerCase()
    });
  }

  function inspectExistingWidgets() {
    const tocDecision = getExistingTocDecision();
    const scrollDecision = getExistingScrollToTopDecision();
    const inlineNavigationCandidates = findElementsBySelectors(genericTocSelectors)
      .filter((element) => isVisible(element) && isLikelyInlineContentNavigation(element))
      .slice(0, 5)
      .map((element) => ({
        tagName: element.tagName.toLowerCase(),
        selectorHint: element.id ? `#${element.id}` : element.className || element.tagName.toLowerCase()
      }));
    const snapshot = {
      hostname: window.location.hostname,
      tocDecision,
      scrollDecision,
      toc: tocDecision ? { source: tocDecision.source, details: tocDecision.details } : null,
      scrollToTop: scrollDecision ? { source: scrollDecision.source, details: scrollDecision.details } : null,
      inlineNavigationCandidates
    };
    publishWidgetDiagnostics(snapshot);
    return snapshot;
  }

  function getSkipInjectionDecision() {
    if (settings.forceShow || !settings.avoidExistingWidgets) {
      publishWidgetDiagnostics({
        hostname: window.location.hostname,
        toc: null,
        scrollToTop: null,
        disabledBySettings: true
      });
      return null;
    }

    const diagnostics = inspectExistingWidgets();
    return diagnostics.tocDecision || diagnostics.scrollDecision || null;
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

  function getDetectionContentContainer() {
    return contentContainer || findContentContainer();
  }

  function hasTocLinks(element) {
    const pageUrl = new URL(window.location.href);
    pageUrl.hash = '';

    const links = Array.from(element.querySelectorAll('a[href]')).filter((link) => {
      const href = link.getAttribute('href');
      if (!href) return false;
      if (href.startsWith('#') && href.length > 1) return true;

      try {
        const resolved = new URL(href, window.location.href);
        return resolved.hash.length > 1 && resolved.origin === pageUrl.origin && resolved.pathname === pageUrl.pathname;
      } catch {
        return false;
      }
    });

    if (links.length < 3) return false;
    return true;
  }

  function isFixedOrSticky(element) {
    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') return false;
    const rect = element.getBoundingClientRect();
    return rect.width >= 32 && rect.height >= 32;
  }

  function hasFixedOrStickyAncestor(element) {
    let current = element;
    while (current && current !== document.body) {
      if (isFixedOrSticky(current)) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function isInsidePrimaryContent(element) {
    const container = getDetectionContentContainer();
    if (!container || !element || container === document.body) {
      return false;
    }
    return container === element || container.contains(element);
  }

  function isLikelyInlineContentNavigation(element) {
    if (!element) return false;

    const inPrimaryContent = isInsidePrimaryContent(element);
    const anchoredAsSidebar = Boolean(
      element.closest('aside, nav, [role="navigation"], [role="complementary"], .sidebar, .toc-sidebar, .toc-nav')
    );

    if (!inPrimaryContent || anchoredAsSidebar) {
      return false;
    }

    return !isFixedOrSticky(element) && !hasFixedOrStickyAncestor(element);
  }

  function isLikelySidebarToc(element) {
    if (!element) return false;
    if (isLikelyInlineContentNavigation(element)) return false;
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

  function isLikelyEdgeRail(element) {
    if (!element || element.id === 'github-toc' || element.id === 'github-sst') {
      return false;
    }
    if (isLikelyInlineContentNavigation(element)) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const vw = Math.max(window.innerWidth, 1);
    const vh = Math.max(window.innerHeight, 1);
    const edgeAligned = rect.left <= vw * 0.18 || rect.right >= vw * 0.82;

    return (
      edgeAligned &&
      rect.width >= 20 &&
      rect.width <= 360 &&
      rect.height >= 120 &&
      rect.top >= 0 &&
      rect.bottom <= vh + 40 &&
      (isFixedOrSticky(element) || hasFixedOrStickyAncestor(element))
    );
  }

  function isPotentialNavItem(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const text = element.textContent.trim();
    return rect.height >= 8 && rect.height <= 40 && rect.width >= 8 && rect.width <= 280 && (text.length > 0 || rect.width <= 80);
  }

  function hasLinearNavigationItems(element) {
    const items = Array.from(element.querySelectorAll('a, button, li, [role="link"], [role="button"]'))
      .filter((item) => item !== element && isPotentialNavItem(item));

    if (items.length < 4) {
      return false;
    }

    const rows = new Set(items.map((item) => Math.round(item.getBoundingClientRect().top / 6) * 6));
    if (rows.size < 4) {
      return false;
    }

    const shortRowItems = items.filter((item) => {
      const rect = item.getBoundingClientRect();
      const text = item.textContent.trim();
      return rect.width <= 260 && (text.length <= 72 || rect.width <= 96);
    });

    return shortRowItems.length >= Math.max(4, Math.ceil(items.length * 0.6));
  }

  function findSemanticSidebarToc() {
    return Array.from(document.querySelectorAll('aside, nav, [role="navigation"], [role="complementary"]'))
      .filter((element) => {
        if (!isVisible(element)) return false;
        if (!hasTocLinks(element)) return false;
        if (!hasLinearNavigationItems(element)) return false;
        return isLikelySidebarToc(element) || isLikelyEdgeRail(element);
      })
      .slice(0, 5)[0] || null;
  }

  function findEdgeNavigationWidgets() {
    return Array.from(document.querySelectorAll('aside, nav, [role="navigation"], [role="complementary"], div, section'))
      .filter((element) => isLikelyEdgeRail(element) && hasLinearNavigationItems(element))
      .slice(0, 8);
  }

  function normalizeSettings(input) {
    const normalized = { ...defaultSettings, ...input };
    if (!Array.isArray(normalized.disabledDomains)) {
      normalized.disabledDomains = [];
    }
    if (!['press', 'hover', 'click'].includes(normalized.expandMode)) {
      normalized.expandMode = defaultSettings.expandMode;
    }
    if (!['default', 'sspai'].includes(normalized.themePreset)) {
      normalized.themePreset = defaultSettings.themePreset;
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

  function isSspaiPreset() {
    return settings.themePreset === 'sspai';
  }

  function bindDefaultKeyboardNavigation() {
    if (!tocContainer) return;

    tocContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tocContainer.classList.contains('expanded')) {
        e.preventDefault();
        closePanel();
        if (iconContainer) {
          iconContainer.focus();
        }
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

  function createSspaiUI() {
    tocTree = document.createElement('div');
    tocTree.className = 'toc-tree toc-tree-sspai';
    tocTree.setAttribute('aria-hidden', 'false');

    tocList = document.createElement('ul');
    tocList.className = 'toc-list toc-list-sspai';
    tocList.setAttribute('role', 'list');
    tocList.setAttribute('aria-label', '文章目录');
    tocTree.appendChild(tocList);
    tocContainer.appendChild(tocTree);

    scrollTopButton = document.createElement('button');
    scrollTopButton.id = 'github-sst';
    scrollTopButton.type = 'button';
    scrollTopButton.className = `github-sst theme-light theme-preset-sspai ${settings.position === 'left' ? 'position-left' : 'position-right'}`;
    scrollTopButton.setAttribute('aria-label', '回到页面顶部');
    scrollTopButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5l-6 6 1.4 1.4 3.6-3.6V19h2V8.8l3.6 3.6L18 11z"/></svg>';
    document.body.appendChild(scrollTopButton);
  }

  function createDefaultPanelUI() {
    const buttonSvg = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>';
    iconContainer = document.createElement('div');
    iconContainer.className = 'toc-icon';
    iconContainer.innerHTML = buttonSvg;
    iconContainer.setAttribute('role', 'button');
    iconContainer.setAttribute('tabindex', '0');
    iconContainer.setAttribute('aria-label', '展开目录');
    iconContainer.setAttribute('aria-haspopup', 'true');
    iconContainer.setAttribute('data-label', shouldShowIconHint ? 'TOC' : '');
    tocContainer.appendChild(iconContainer);

    iconContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        iconContainer.click();
      }
    });

    tocTree = document.createElement('div');
    tocTree.className = 'toc-tree';
    tocTree.setAttribute('aria-hidden', 'true');

    tocTitle = document.createElement('div');
    tocTitle.className = 'toc-title';
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

    tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    tocList.setAttribute('role', 'list');
    tocList.setAttribute('aria-label', '文章目录');
    tocTree.appendChild(tocList);
    tocContainer.appendChild(tocTree);

    bindDefaultKeyboardNavigation();
  }

  // 创建目录树容器
  function createUI() {
    tocContainer = document.createElement('div');
    tocContainer.id = 'github-toc';
    tocContainer.className = `github-toc theme-light ${isSspaiPreset() ? 'theme-preset-sspai' : 'theme-preset-default'}`;
    tocContainer.classList.add(settings.position === 'left' ? 'position-left' : 'position-right');
    // ARIA：辅助导航区域
    tocContainer.setAttribute('role', 'complementary');
    tocContainer.setAttribute('aria-label', '页面目录导航');
    tocContainer.setAttribute('aria-expanded', 'false');
    tocContainer.setAttribute('data-pinned', 'false');
    document.body.appendChild(tocContainer);

    if (isSspaiPreset()) {
      createSspaiUI();
      return;
    }

    createDefaultPanelUI();
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
    if (headingObserver) {
      headingObserver.disconnect();
      headingObserver = null;
    }
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    if (reinitializeTimer) {
      clearTimeout(reinitializeTimer);
      reinitializeTimer = null;
    }
    lastProcessedHeaders.clear();
    lastObservedHeadersSignature = '';
    observerActiveHeaderId = null;
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

  function getHeaderLevel(header) {
    if (header.tagName && header.tagName.match(/^H[1-6]$/)) {
      return parseInt(header.tagName[1], 10);
    }

    const style = window.getComputedStyle(header);
    const fontSize = parseInt(style.fontSize, 10);
    if (fontSize >= 24) return 1;
    if (fontSize >= 20) return 2;
    if (fontSize >= 18) return 3;
    if (fontSize >= 16) return 4;
    return 5;
  }

  function ensureHeaderId(header, text) {
    if (!header.id) {
      header.id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }
    return header.id;
  }

  function getHeadersSignature(headers) {
    return headers
      .map((header) => {
        const text = header.textContent.trim();
        const id = ensureHeaderId(header, text || 'section');
        const level = getHeaderLevel(header);
        return `${id}|${level}|${text}`;
      })
      .join('||');
  }

  function createNoHeadersMarkup() {
    return `
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

  function buildTocItemLink(header, text) {
    const headerId = ensureHeaderId(header, text);
    const a = document.createElement('a');
    a.href = `#${headerId}`;
    a.title = text;

    if (isSspaiPreset()) {
      a.className = 'toc-rail-link';

      const bar = document.createElement('span');
      bar.className = 'toc-rail-bar';
      bar.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'toc-rail-label';
      label.textContent = text;

      a.appendChild(bar);
      a.appendChild(label);
    } else {
      a.textContent = text;
    }

    a.addEventListener('click', (e) => {
      e.preventDefault();
      header.scrollIntoView({ behavior: 'smooth' });
      syncActiveTocItem(headerId);
    });

    return { a, headerId };
  }

  function createTocItem(header) {
    const text = header.textContent.trim();
    if (!text) return null;

    const level = getHeaderLevel(header);
    const { a, headerId } = buildTocItemLink(header, text);

    const li = document.createElement('li');
    li.className = `toc-item level-${level}`;
    li.dataset.headerId = headerId;
    li.dataset.level = String(level);
    li.appendChild(a);
    return li;
  }

  function renderHeadersIntoToc(headers) {
    if (!tocList) return;

    tocList.innerHTML = '';
    headers.forEach((header) => {
      const item = createTocItem(header);
      if (item) {
        tocList.appendChild(item);
      }
    });
  }

  function syncHeadingObserver(signature) {
    if (headingObserver && signature === lastObservedHeadersSignature) {
      return;
    }

    if (headingObserver) {
      headingObserver.disconnect();
      headingObserver = null;
    }

    lastObservedHeadersSignature = signature;

    if (typeof IntersectionObserver === 'undefined') {
      observerActiveHeaderId = null;
      return;
    }

    headingObserver = new IntersectionObserver((entries) => {
      const visibleCandidates = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top));

      if (visibleCandidates.length > 0) {
        observerActiveHeaderId = visibleCandidates[0].target.id || null;
        if (observerActiveHeaderId) {
          syncActiveTocItem(observerActiveHeaderId);
        }
        return;
      }

      observerActiveHeaderId = null;
    }, {
      root: null,
      rootMargin: '-96px 0px -70% 0px',
      threshold: [0, 1]
    });

    currentHeaders.forEach((header) => {
      headingObserver.observe(header);
    });
  }

  // 修改现有的函数以包含性能监控
  function updateTOC() {
    return measurePerformance('tocUpdate', () => {
      lastProcessedHeaders.clear();

      const headers = getHeaders();
      const nextSignature = getHeadersSignature(headers);
      currentHeaders = headers;
      headerCount = headers.length;
      if (tocCountBadge) {
        tocCountBadge.textContent = String(headerCount);
        tocCountBadge.setAttribute('aria-label', `${headerCount} sections`);
      }
      if (headers.length === 0) {
        if (headingObserver) {
          headingObserver.disconnect();
          headingObserver = null;
        }
        lastObservedHeadersSignature = '__empty__';
        observerActiveHeaderId = null;
        if (tocList) {
          if (lastRenderedTocSignature !== '__empty__') {
            tocList.innerHTML = createNoHeadersMarkup();
            lastRenderedTocSignature = '__empty__';
          }
        }
        updateVisibility();
        return;
      }

      if (!tocList) return;

      if (nextSignature !== lastRenderedTocSignature) {
        renderHeadersIntoToc(headers);
        lastRenderedTocSignature = nextSignature;
        lastActiveHeaderId = null;
      }

      syncHeadingObserver(nextSignature);

      // 初始化当前活动标题
      updateActiveHeader();
      updateVisibility();
    });
  }

  // 添加更新当前活动标题的函数
  function revealActiveTocItem(item) {
    if (!item || !tocList) return;

    const listRect = tocList.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const padding = settings.themePreset === 'sspai' ? 18 : 12;

    if (itemRect.top < listRect.top + padding || itemRect.bottom > listRect.bottom - padding) {
      item.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'smooth'
      });
    }
  }

  function syncActiveTocItem(headerId) {
    if (!tocList) return;

    let nextActiveItem = null;
    tocList.querySelectorAll('.toc-item').forEach(item => {
      const link = item.querySelector('a');
      if (item.dataset.headerId === headerId) {
        item.classList.add('active');
        if (link) link.setAttribute('aria-current', 'location');
        nextActiveItem = item;
      } else {
        item.classList.remove('active');
        if (link) link.removeAttribute('aria-current');
      }
    });

    if (nextActiveItem && headerId && headerId !== lastActiveHeaderId) {
      lastActiveHeaderId = headerId;
      revealActiveTocItem(nextActiveItem);
    }
  }

  function findActiveHeaderByScrollPosition(headers) {
    if (!headers || headers.length === 0) return null;

    let activeHeader = null;
    let minDistance = Infinity;

    headers.forEach((header) => {
      const rect = header.getBoundingClientRect();
      const distance = Math.abs(rect.top);

      if (distance < minDistance && rect.top <= 100) {
        minDistance = distance;
        activeHeader = header;
      }
    });

    return activeHeader;
  }

  function shouldTrackActiveHeaderOnScroll() {
    return !headingObserver;
  }

  function updateActiveHeader() {
    const headers = currentHeaders;
    if (!headers || headers.length === 0) return;

    const observerHeader = observerActiveHeaderId ? document.getElementById(observerActiveHeaderId) : null;
    const activeHeader = observerHeader || findActiveHeaderByScrollPosition(headers);

    // 更新目录项的高亮状态及 aria-current
    if (activeHeader) {
      syncActiveTocItem(activeHeader.id);
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
    if (scrollTopButton) {
      scrollTopButton.style.display = shouldShowToc() ? 'inline-flex' : 'none';
    }
  }

  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(() => {
      measurePerformance('scrollPerformance', () => {
        updateVisibility();
        if (shouldTrackActiveHeaderOnScroll()) {
          updateActiveHeader();
        }
      });
    });
  }, { passive: true });

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
          if (
            node.id === 'github-toc' ||
            node.id === 'github-sst' ||
            node.closest('#github-toc, #github-sst')
          ) {
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

  function setupNavigationLifecycleListeners() {
    document.addEventListener('astro:after-swap', () => scheduleReinitialize(80));
    document.addEventListener('astro:page-load', () => scheduleReinitialize(80));
    window.addEventListener('pageshow', () => scheduleReinitialize(80));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        scheduleReinitialize(100);
      }
    });
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
    setupNavigationLifecycleListeners();
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

  function setupSspaiInteractions() {
    tocContainer.addEventListener('mouseenter', scheduleHoverOpen);
    tocContainer.addEventListener('mouseleave', scheduleHoverClose);
    tocContainer.addEventListener('focusin', () => toggleExpanded(true));
    tocContainer.addEventListener('focusout', (e) => {
      if (!tocContainer.contains(e.relatedTarget)) {
        scheduleHoverClose();
      }
    });

    if (scrollTopButton) {
      scrollTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        scrollToTop();
      });
    }

    document.addEventListener('pointerdown', (e) => {
      if (!tocContainer.classList.contains('expanded')) return;
      if (tocContainer.contains(e.target)) return;
      closePanel();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tocContainer.classList.contains('expanded')) {
        closePanel();
      }
    });
  }

  function setupDefaultInteractions() {
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

  function setupInteractions() {
    if (!tocContainer) return;

    if (isSspaiPreset()) {
      setupSspaiInteractions();
      return;
    }

    setupDefaultInteractions();
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
    recordSkipDecision(null);
    if (isDomainDisabled()) {
      return;
    }
    const skipDecision = getSkipInjectionDecision();
    if (skipDecision) {
      recordSkipDecision(skipDecision);
      console.info('[Smart TOC & Scroll] Skip injection because existing widget was detected.', {
        type: skipDecision.type,
        source: skipDecision.source,
        details: skipDecision.details,
        element: skipDecision.element
      });
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
