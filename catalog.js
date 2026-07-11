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
  let lastUrl = window.location.href;
  let contentContainer = null;
  let headerCount = 0;
  let currentHeaders = [];
  let reinitializeTimer = null;
  let lastActiveHeaderId = null;
  let lastRenderedTocSignature = '';
  let lastObservedHeadersSignature = '';
  let observerActiveHeaderId = null;
  let activeHeaderHoldTimer = null;
  let activeHeaderHoldUntil = 0;
  let activeHeaderHoldId = null;

  let tocContainer = null;
  let iconContainer = null;
  let tocTree = null;
  let tocList = null;
  let tocTitle = null;
  let tocTopButton = null;
  let tocCountBadge = null;
  let scrollTopButton = null;
  let tocRailPreview = null;
  let tocSpotlightLayer = null;
  let tocGptPreview = null;

  let longPressTimer = null;
  let longPressTriggered = false;
  let hoverOpenTimer = null;
  let hoverCloseTimer = null;
  let isPinnedOpen = false;
  let railWaveFrame = null;
  let lastRailPointerY = null;
  let scrollTopProximityFrame = null;
  let lastScrollTopPointer = null;
  let railWaveItems = [];
  let railWaveLayout = [];
  let railPreviewItem = null;
  let railPreviewRenderedItem = null;
  let railPreviewRenderedMeta = { rowCount: 0, currentRowIndex: 0 };
  let railPointerInside = false;
  let railPointerExitTimer = null;
  let railPostClickHoldTimer = null;
  let railPostClickHoldUntil = 0;
  const railWaveAffectedItems = new Set();
  const railWaveMaxDistance = 78;
  const railWaveMaxWidth = 20;
  const railWaveMaxShift = 2;
  const railPreviewGap = 8;
  const railPostClickHoldMs = 1800;
  const activeHeaderHoldMs = 900;
  const railPreviewContextRadius = 2;
  const railPreviewRowHeight = 30;
  const railPreviewRowGap = 4;
  const railPreviewPaddingY = 4;
  const scrollTopProximityRadius = 116;
  const scrollTopHoverRadius = 44;
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };
  let adaptiveThemeFrame = null;
  let lastAdaptiveThemeApplied = '';
  let lastAdaptiveThemeSampleAt = 0;
  let performancePanelVisible = false;
  let performanceStatsTimer = null;
  let performanceStatsContainer = null;
  let shouldShowIconHint = true;
  let lastSkipDecision = null;
  let lastTocVisibility = null;

  const defaultSettings = {
    themePreset: 'default',
    barcodePreview: 'wheel', // 'wheel' | 'spotlight' | 'gpt'
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
    adaptiveTheme: [],
    railPointer: []
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
    if (input?.themePreset === 'sspai') {
      normalized.themePreset = 'barcode';
      normalized.barcodePreview = 'wheel';
    } else if (input?.themePreset === 'glimmer') {
      normalized.themePreset = 'barcode';
      normalized.barcodePreview = 'spotlight';
    }
    if (!Array.isArray(normalized.disabledDomains)) {
      normalized.disabledDomains = [];
    }
    if (!['press', 'hover', 'click'].includes(normalized.expandMode)) {
      normalized.expandMode = defaultSettings.expandMode;
    }
    if (!['default', 'barcode'].includes(normalized.themePreset)) {
      normalized.themePreset = defaultSettings.themePreset;
    }
    if (!['wheel', 'spotlight', 'gpt'].includes(normalized.barcodePreview)) {
      normalized.barcodePreview = defaultSettings.barcodePreview;
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

  function isBarcodePreset() {
    return settings.themePreset === 'barcode';
  }

  function isWheelPreview() {
    return isBarcodePreset() && settings.barcodePreview === 'wheel';
  }

  function isSpotlightPreview() {
    return isBarcodePreset() && settings.barcodePreview === 'spotlight';
  }

  function isGptPreview() {
    return isBarcodePreset() && settings.barcodePreview === 'gpt';
  }

  function isRailPreset() {
    return isBarcodePreset();
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

  function createRailUI() {
    tocTree = document.createElement('div');
    tocTree.className = 'toc-tree toc-tree-rail';
    tocTree.setAttribute('aria-hidden', 'false');

    tocList = document.createElement('ul');
    tocList.className = 'toc-list toc-list-rail';
    tocList.setAttribute('role', 'list');
    tocList.setAttribute('aria-label', '文章目录');
    tocTree.appendChild(tocList);
    tocContainer.appendChild(tocTree);

    if (isWheelPreview()) {
      tocRailPreview = document.createElement('div');
      tocRailPreview.className = 'toc-rail-preview theme-light theme-preset-rail theme-preset-barcode theme-preview-wheel';
      tocRailPreview.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tocRailPreview);
    }

    if (isSpotlightPreview()) {
      tocSpotlightLayer = document.createElement('div');
      tocSpotlightLayer.className = 'toc-spotlight-layer theme-light theme-preset-rail theme-preset-barcode theme-preview-spotlight';
      tocSpotlightLayer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tocSpotlightLayer);
    }

    if (isGptPreview()) {
      tocGptPreview = document.createElement('div');
      tocGptPreview.className = 'toc-gpt-preview theme-light theme-preset-rail theme-preset-barcode theme-preview-gpt';
      tocGptPreview.setAttribute('role', 'navigation');
      tocGptPreview.setAttribute('aria-label', '文章标题预览');
      tocGptPreview.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tocGptPreview);
    }

    scrollTopButton = document.createElement('button');
    scrollTopButton.id = 'github-sst';
    scrollTopButton.type = 'button';
    scrollTopButton.className = `github-sst theme-light theme-preset-rail theme-preset-barcode theme-preview-${settings.barcodePreview} ${settings.position === 'left' ? 'position-left' : 'position-right'}`;
    scrollTopButton.setAttribute('aria-label', '回到页面顶部');
    scrollTopButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 5l-6 6 1.4 1.4 3.6-3.6V19h2V8.8l3.6 3.6L18 11z"/></svg>';
    document.body.appendChild(scrollTopButton);
  }

  function createDefaultPanelUI() {
    const buttonSvg = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z"/></svg>';
    iconContainer = document.createElement('button');
    iconContainer.type = 'button';
    iconContainer.className = 'toc-icon';
    iconContainer.innerHTML = buttonSvg;
    iconContainer.setAttribute('aria-label', '展开目录');
    iconContainer.setAttribute('aria-haspopup', 'true');
    iconContainer.setAttribute('aria-expanded', 'false');
    iconContainer.setAttribute('aria-controls', 'github-toc-tree');
    iconContainer.setAttribute('data-label', shouldShowIconHint ? 'TOC' : '');
    tocContainer.appendChild(iconContainer);

    // 原生按钮保留显式键盘处理，避免宿主页面的全局快捷键拦截 Enter / Space。
    iconContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        iconContainer.click();
      }
    });

    tocTree = document.createElement('div');
    tocTree.id = 'github-toc-tree';
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
    tocContainer.className = isRailPreset()
      ? `github-toc theme-light theme-preset-rail theme-preset-barcode theme-preview-${settings.barcodePreview}`
      : 'github-toc theme-light theme-preset-default';
    tocContainer.classList.add(settings.position === 'left' ? 'position-left' : 'position-right');
    // ARIA：辅助导航区域
    tocContainer.setAttribute('role', 'complementary');
    tocContainer.setAttribute('aria-label', '页面目录导航');
    tocContainer.setAttribute('aria-expanded', 'false');
    tocContainer.setAttribute('data-pinned', 'false');
    document.body.appendChild(tocContainer);

    if (isRailPreset()) {
      createRailUI();
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
    if (activeHeaderHoldTimer) {
      clearTimeout(activeHeaderHoldTimer);
      activeHeaderHoldTimer = null;
    }
    if (reinitializeTimer) {
      clearTimeout(reinitializeTimer);
      reinitializeTimer = null;
    }
    if (adaptiveThemeFrame) {
      window.cancelAnimationFrame(adaptiveThemeFrame);
      adaptiveThemeFrame = null;
    }
    if (scrollTopProximityFrame) {
      window.cancelAnimationFrame(scrollTopProximityFrame);
      scrollTopProximityFrame = null;
    }
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
      scrollTimeout = null;
    }
    if (railWaveFrame) {
      window.cancelAnimationFrame(railWaveFrame);
      railWaveFrame = null;
    }
    if (railPostClickHoldTimer) {
      window.clearTimeout(railPostClickHoldTimer);
      railPostClickHoldTimer = null;
    }
    if (railPointerExitTimer) {
      window.clearTimeout(railPointerExitTimer);
      railPointerExitTimer = null;
    }
    if (performanceStatsTimer) {
      window.clearInterval(performanceStatsTimer);
      performanceStatsTimer = null;
    }
    clearHoverTimers();
    clearTimeout(longPressTimer);
    longPressTimer = null;
    lastScrollTopPointer = null;
    lastObservedHeadersSignature = '';
    observerActiveHeaderId = null;
    activeHeaderHoldUntil = 0;
    activeHeaderHoldId = null;
    lastTocVisibility = null;
  }

  function ensureUiMounted() {
    if (!document.body) {
      return false;
    }

    if (tocContainer && !tocContainer.isConnected) {
      document.body.appendChild(tocContainer);
    }

    if (isRailPreset() && scrollTopButton && !scrollTopButton.isConnected) {
      document.body.appendChild(scrollTopButton);
    }

    if (isWheelPreview() && tocRailPreview && !tocRailPreview.isConnected) {
      document.body.appendChild(tocRailPreview);
    }

    if (isSpotlightPreview() && tocSpotlightLayer && !tocSpotlightLayer.isConnected) {
      document.body.appendChild(tocSpotlightLayer);
    }

    if (isGptPreview() && tocGptPreview && !tocGptPreview.isConnected) {
      document.body.appendChild(tocGptPreview);
    }

    return true;
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

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseCssColor(color) {
    if (!color || color === 'transparent') return null;
    const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!match) return null;
    return {
      r: clampNumber(Number(match[1]), 0, 255),
      g: clampNumber(Number(match[2]), 0, 255),
      b: clampNumber(Number(match[3]), 0, 255),
      a: match[4] === undefined ? 1 : clampNumber(Number(match[4]), 0, 1)
    };
  }

  function mixColor(foreground, background) {
    const alpha = foreground.a;
    return {
      r: Math.round(foreground.r * alpha + background.r * (1 - alpha)),
      g: Math.round(foreground.g * alpha + background.g * (1 - alpha)),
      b: Math.round(foreground.b * alpha + background.b * (1 - alpha)),
      a: 1
    };
  }

  function getRelativeLuminance(color) {
    const channel = (value) => {
      const normalized = value / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
  }

  function getFallbackPageBackground() {
    const bodyColor = parseCssColor(window.getComputedStyle(document.body).backgroundColor);
    if (bodyColor && bodyColor.a > 0.05) {
      return bodyColor.a < 1 ? mixColor(bodyColor, { r: 255, g: 255, b: 255, a: 1 }) : bodyColor;
    }

    const htmlColor = parseCssColor(window.getComputedStyle(document.documentElement).backgroundColor);
    if (htmlColor && htmlColor.a > 0.05) {
      return htmlColor.a < 1 ? mixColor(htmlColor, { r: 255, g: 255, b: 255, a: 1 }) : htmlColor;
    }

    const colorScheme = window.getComputedStyle(document.documentElement).colorScheme || '';
    return colorScheme.includes('dark')
      ? { r: 18, g: 24, b: 32, a: 1 }
      : { r: 255, g: 255, b: 255, a: 1 };
  }

  function resolveElementBackground(element, fallback = getFallbackPageBackground()) {
    const layers = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const color = parseCssColor(window.getComputedStyle(current).backgroundColor);
      if (color && color.a > 0.05) {
        layers.push(color);
      }
      current = current.parentElement;
    }

    return layers.reverse().reduce((background, layer) => {
      return layer.a >= 1 ? layer : mixColor(layer, background);
    }, fallback);
  }

  function getElementBehindTocAtPoint(x, y) {
    const elements = typeof document.elementsFromPoint === 'function'
      ? document.elementsFromPoint(x, y)
      : [document.elementFromPoint(x, y)].filter(Boolean);

    const candidates = elements.filter((element) => {
      if (!(element instanceof Element)) return false;
      return !element.closest('#github-toc, #github-sst, .toc-rail-preview, .toc-spotlight-layer, .toc-gpt-preview');
    });

    return candidates.find((element) => {
      const color = parseCssColor(window.getComputedStyle(element).backgroundColor);
      return color && color.a > 0.05;
    }) || candidates[0] || document.body;
  }

  function getAdaptiveThemeSamplePoints() {
    if (!tocContainer) return [];
    const rect = tocContainer.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return [];

    const isLeft = tocContainer.classList.contains('position-left');
    const x = isLeft
      ? clampNumber(rect.right + 8, 0, window.innerWidth - 1)
      : clampNumber(rect.left - 8, 0, window.innerWidth - 1);
    const yPositions = [0.18, 0.5, 0.82].map((ratio) => (
      clampNumber(rect.top + rect.height * ratio, 0, window.innerHeight - 1)
    ));

    return yPositions.map((y) => ({ x, y }));
  }

  function averageColors(colors, fallback = getFallbackPageBackground()) {
    if (colors.length === 0) return fallback;
    const total = colors.reduce((sum, color) => ({
      r: sum.r + color.r,
      g: sum.g + color.g,
      b: sum.b + color.b,
      a: 1
    }), { r: 0, g: 0, b: 0, a: 1 });

    return {
      r: Math.round(total.r / colors.length),
      g: Math.round(total.g / colors.length),
      b: Math.round(total.b / colors.length),
      a: 1
    };
  }

  function buildAdaptiveRailPalette(background) {
    const luminance = getRelativeLuminance(background);
    const isLightSurface = luminance > 0.58;

    if (isLightSurface) {
      return {
        tone: 'light-surface',
        luminance,
        vars: {
          '--toc-rail-line': 'rgba(15, 23, 42, 0.22)',
          '--toc-rail-line-hover': 'rgba(15, 23, 42, 0.38)',
          '--toc-rail-line-active': 'rgba(15, 23, 42, 0.74)',
          '--toc-rail-label': 'rgba(15, 23, 42, 0.54)',
          '--toc-rail-label-active': 'rgba(15, 23, 42, 0.88)',
          '--toc-rail-hover-surface': 'rgba(15, 23, 42, 0.055)',
          '--toc-rail-top-bg': 'rgba(15, 23, 42, 0.065)',
          '--toc-rail-top-bg-hover': 'rgba(15, 23, 42, 0.12)',
          '--toc-rail-top-border': 'rgba(15, 23, 42, 0.10)',
          '--toc-rail-preview-bg': 'rgba(255, 255, 255, 0.90)',
          '--toc-rail-preview-border': 'rgba(15, 23, 42, 0.12)',
          '--toc-rail-preview-shadow': '0 10px 24px rgba(15, 23, 42, 0.14)'
        }
      };
    }

    return {
      tone: 'dark-surface',
      luminance,
      vars: {
        '--toc-rail-line': 'rgba(255, 255, 255, 0.22)',
        '--toc-rail-line-hover': 'rgba(255, 255, 255, 0.42)',
        '--toc-rail-line-active': 'rgba(255, 255, 255, 0.88)',
        '--toc-rail-label': 'rgba(255, 255, 255, 0.56)',
        '--toc-rail-label-active': 'rgba(255, 255, 255, 0.94)',
        '--toc-rail-hover-surface': 'rgba(255, 255, 255, 0.05)',
        '--toc-rail-top-bg': 'rgba(255, 255, 255, 0.06)',
        '--toc-rail-top-bg-hover': 'rgba(255, 255, 255, 0.13)',
        '--toc-rail-top-border': 'rgba(255, 255, 255, 0.10)',
        '--toc-rail-preview-bg': 'rgba(17, 24, 39, 0.84)',
        '--toc-rail-preview-border': 'rgba(255, 255, 255, 0.18)',
        '--toc-rail-preview-shadow': '0 10px 24px rgba(0, 0, 0, 0.24)'
      }
    };
  }

  function applyAdaptiveRailPalette(palette, sample) {
    const nextSignature = `${palette.tone}:${Math.round(palette.luminance * 100)}`;
    if (nextSignature === lastAdaptiveThemeApplied) return;

    [tocContainer, scrollTopButton, tocRailPreview, tocSpotlightLayer, tocGptPreview].forEach((element) => {
      if (!element) return;
      Object.entries(palette.vars).forEach(([name, value]) => {
        element.style.setProperty(name, value);
      });
      element.dataset.adaptiveTone = palette.tone;
    });

    lastAdaptiveThemeApplied = nextSignature;
    window.__SMART_TOC_ADAPTIVE_THEME__ = {
      tone: palette.tone,
      luminance: Number(palette.luminance.toFixed(3)),
      sample
    };
  }

  function updateAdaptiveRailTheme() {
    if (!isRailPreset() || !tocContainer || !tocContainer.isConnected) return;
    const points = getAdaptiveThemeSamplePoints();
    const fallback = getFallbackPageBackground();
    const colors = points.map((point) => (
      resolveElementBackground(getElementBehindTocAtPoint(point.x, point.y), fallback)
    ));
    const background = averageColors(colors, fallback);
    const palette = buildAdaptiveRailPalette(background);

    applyAdaptiveRailPalette(palette, {
      r: background.r,
      g: background.g,
      b: background.b,
      points: points.length
    });
  }

  function scheduleAdaptiveRailThemeUpdate(force = false) {
    if (!isRailPreset()) return;
    const now = Date.now();
    if (!force && now - lastAdaptiveThemeSampleAt < 180) return;
    if (adaptiveThemeFrame) return;

    adaptiveThemeFrame = window.requestAnimationFrame(() => {
      adaptiveThemeFrame = null;
      lastAdaptiveThemeSampleAt = Date.now();
      measurePerformance('adaptiveTheme', updateAdaptiveRailTheme);
    });
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

    const headingCounts = new Map();
    let bestContainer = null;
    let maxHeaders = 0;

    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      let candidate = heading.parentElement;
      while (candidate && candidate !== document.body) {
        if (candidate.matches('div, section, article, main')) {
          const nextCount = (headingCounts.get(candidate) || 0) + 1;
          headingCounts.set(candidate, nextCount);
          if (nextCount > maxHeaders) {
            maxHeaders = nextCount;
            bestContainer = candidate;
          }
        }
        candidate = candidate.parentElement;
      }
    });

    return bestContainer || document.body;
  }

  function getHeaders() {
    if (!contentContainer) {
      return [];
    }

    const standardHeaders = Array.from(contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const standardHeaderSet = new Set(standardHeaders);
    const customHeaders = Array.from(contentContainer.querySelectorAll('[class*="title"], [class*="heading"], [class*="header"]'));
    const seenHeaders = new Set();

    return [...standardHeaders, ...customHeaders]
      .filter(header => {
        if (seenHeaders.has(header)) return false;
        seenHeaders.add(header);

        const style = window.getComputedStyle(header);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }

        if (!standardHeaderSet.has(header)) {
          const fontSize = parseFloat(style.fontSize);
          const fontWeight = parseInt(style.fontWeight, 10);
          if (!Number.isFinite(fontSize) || !Number.isFinite(fontWeight) || fontSize < 16 || fontWeight < 500) {
            return false;
          }
        }

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
      max-height: calc(100vh - 40px);
      overflow: auto;
    `;
    document.body.appendChild(performanceStatsContainer);
    return performanceStatsContainer;
  }

  function renderPerformanceStats() {
    const statsContainer = ensurePerformanceStatsContainer();
    if (!performancePanelVisible) return;

    const sections = [
      { metric: 'tocGeneration', label: 'Generation', memory: 'usage' },
      { metric: 'tocUpdate', label: 'Updates', memory: 'delta' },
      { metric: 'scrollPerformance', label: 'Scroll' },
      { metric: 'adaptiveTheme', label: 'Adaptive Theme' },
      { metric: 'railPointer', label: 'Rail Pointer' }
    ].map((section) => ({
      ...section,
      stats: getPerformanceStats(section.metric)
    })).filter((section) => section.stats);

    if (sections.length === 0) {
      statsContainer.innerHTML = '<h3>TOC Performance Stats</h3><p>No metrics collected yet.</p>';
      return;
    }

    const blocks = sections.map(({ label, memory, stats }) => {
      let memoryLine = '';
      if (memory === 'usage' && stats.latestMemoryUsage > 0) {
        memoryLine = `<p>Memory Usage: ${(stats.latestMemoryUsage / 1024 / 1024).toFixed(2)}MB</p>`;
      } else if (memory === 'delta' && stats.avgMemoryDelta !== 0) {
        memoryLine = `<p>Memory Delta: ${(stats.avgMemoryDelta / 1024 / 1024).toFixed(2)}MB</p>`;
      }
      return `
        <div>
          <h4>${label}</h4>
          <p>Count: ${stats.count}</p>
          <p>Avg Duration: ${stats.avgDuration.toFixed(2)}ms</p>
          <p>Min/Max: ${stats.minDuration.toFixed(2)}ms / ${stats.maxDuration.toFixed(2)}ms</p>
          ${memoryLine}
        </div>
      `;
    }).join('');

    statsContainer.innerHTML = `<h3>TOC Performance Stats</h3>${blocks}`;
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

    if (isRailPreset()) {
      a.className = 'toc-rail-link';
      a.setAttribute('aria-label', text);

      const bar = document.createElement('span');
      bar.className = 'toc-rail-bar';
      bar.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'toc-rail-label';
      label.textContent = text;

      a.appendChild(bar);
      a.appendChild(label);
    } else {
      a.title = text;
      a.textContent = text;
    }

    a.addEventListener('click', (e) => {
      e.preventDefault();
      primeRailPostClickHoldFromLink(a);
      header.scrollIntoView({ behavior: 'smooth' });
      holdActiveHeaderAfterNavigation(headerId);
    });

    return { a, headerId };
  }

  function primeRailPostClickHoldFromLink(link) {
    if (!isRailPreset() || !link) return;

    if (railPostClickHoldTimer) {
      window.clearTimeout(railPostClickHoldTimer);
      railPostClickHoldTimer = null;
    }
    railPostClickHoldUntil = Date.now() + railPostClickHoldMs;

    const item = link.closest('.toc-item:not(.no-headers)');
    if (!item) return;

    if (railPreviewItem && railPreviewItem !== item) {
      railPreviewItem.classList.remove('is-previewed');
    }
    railPreviewItem = item;
    railPreviewItem.classList.add('is-previewed');
    if (isWheelPreview() && tocRailPreview) {
      tocRailPreview.classList.add('is-visible');
    }
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
    railWaveItems = [];
    railWaveLayout = [];
    if (tocRailPreview) {
      tocRailPreview.classList.remove('is-visible');
    }
    if (tocSpotlightLayer) {
      tocSpotlightLayer.querySelectorAll('.toc-spotlight-row').forEach((row) => {
        row.classList.remove('is-visible', 'distance-0', 'distance-1', 'distance-2', 'distance-far');
      });
    }
    if (tocGptPreview) {
      tocGptPreview.classList.remove('is-visible');
      tocGptPreview.setAttribute('aria-hidden', 'true');
      tocGptPreview.querySelectorAll('.toc-gpt-preview-row').forEach((row) => {
        row.tabIndex = -1;
      });
    }
    railPreviewItem = null;
    railPreviewRenderedItem = null;
    railPreviewRenderedMeta = { rowCount: 0, currentRowIndex: 0 };
    if (railPostClickHoldTimer) {
      window.clearTimeout(railPostClickHoldTimer);
      railPostClickHoldTimer = null;
    }
    if (railPointerExitTimer) {
      window.clearTimeout(railPointerExitTimer);
      railPointerExitTimer = null;
    }
    railPostClickHoldUntil = 0;
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
      if (activeHeaderHoldUntil > Date.now()) {
        return;
      }

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
    const padding = isBarcodePreset() ? 18 : 12;

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

  function holdActiveHeaderAfterNavigation(headerId) {
    if (!headerId) return;

    if (activeHeaderHoldTimer) {
      window.clearTimeout(activeHeaderHoldTimer);
    }

    activeHeaderHoldId = headerId;
    activeHeaderHoldUntil = Date.now() + activeHeaderHoldMs;
    syncActiveTocItem(headerId);

    activeHeaderHoldTimer = window.setTimeout(() => {
      activeHeaderHoldTimer = null;
      activeHeaderHoldUntil = 0;
      activeHeaderHoldId = null;
      observerActiveHeaderId = null;
      updateActiveHeader();
    }, activeHeaderHoldMs);
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

    const heldHeader = activeHeaderHoldUntil > Date.now() && activeHeaderHoldId
      ? document.getElementById(activeHeaderHoldId)
      : null;
    const observerHeader = observerActiveHeaderId ? document.getElementById(observerActiveHeaderId) : null;
    const activeHeader = heldHeader || observerHeader || findActiveHeaderByScrollPosition(headers);

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
    if (settings.forceShow) {
      return headerCount >= settings.minHeaders;
    }
    const threshold = window.innerHeight * settings.showAfterScrollScreens;
    return headerCount >= settings.minHeaders && (
      settings.showAfterScrollScreens <= 0 || getScrollTop() > threshold
    );
  }

  function updateVisibility() {
    ensureUiMounted();
    const shouldShow = shouldShowToc();
    if (shouldShow !== lastTocVisibility) {
      lastTocVisibility = shouldShow;
      if (tocContainer) {
        tocContainer.style.display = shouldShow ? 'flex' : 'none';
      }
      if (scrollTopButton) {
        scrollTopButton.classList.toggle('visible', shouldShow);
        scrollTopButton.tabIndex = shouldShow ? 0 : -1;
      }
    }
    if (scrollTopButton && !shouldShow) {
      scrollTopButton.classList.remove('is-near');
      scrollTopButton.classList.remove('is-hovered');
    }
    if (shouldShow) {
      scheduleAdaptiveRailThemeUpdate();
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
            node.closest('#github-toc, #github-sst, .toc-rail-preview, .toc-spotlight-layer, .toc-gpt-preview, #toc-performance-stats')
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
      ensureUiMounted();
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
      iconContainer.setAttribute('aria-expanded', shouldExpand ? 'true' : 'false');
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
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
    });
  }

  function setupRailInteractions() {
    let spotlightRows = [];
    let gptRows = [];
    let gptCurrentIndex = -1;

    function clearRailPointerExit() {
      if (!railPointerExitTimer) return;
      window.clearTimeout(railPointerExitTimer);
      railPointerExitTimer = null;
    }

    function scheduleRailPointerExit() {
      if (railPointerExitTimer) return;
      railPointerExitTimer = window.setTimeout(() => {
        railPointerExitTimer = null;
        if (railPointerInside) return;
        if (isRailPostClickHoldActive()) {
          scheduleRailPostClickHoldRelease();
          return;
        }
        resetRailWave();
        scheduleHoverClose();
      }, 96);
    }

    function getRailWaveItems() {
      if (!tocList) return [];
      if (railWaveItems.length === 0) {
        railWaveItems = Array.from(tocList.querySelectorAll('.toc-item:not(.no-headers)'))
          .map((item) => ({
            item,
            target: item.querySelector('.toc-rail-bar') || item
          }));
      }
      return railWaveItems;
    }

    function refreshRailWaveLayout() {
      if (!tocContainer) {
        railWaveLayout = [];
        return;
      }

      const railRect = tocContainer.getBoundingClientRect();
      const minY = railRect.top - railWaveMaxDistance;
      const maxY = railRect.bottom + railWaveMaxDistance;
      const isLeft = tocContainer.classList.contains('position-left');

      railWaveLayout = getRailWaveItems()
        .map(({ item, target }) => {
          const rect = target.getBoundingClientRect();
          const previewEdge = isLeft
            ? rect.right + railWaveMaxWidth + railWaveMaxShift
            : rect.left - railWaveMaxWidth - railWaveMaxShift;
          return {
            item,
            centerY: rect.top + rect.height / 2,
            baseWidth: getRailBaseWidth(item),
            previewEdge,
            visible: rect.bottom >= minY && rect.top <= maxY
          };
        })
        .filter(({ visible }) => visible);
    }

    function getRailBaseWidth(item) {
      const level = item.dataset.level;
      if (level === '1') return 26;
      if (level === '2') return 20;
      if (level === '3') return 16;
      return 12;
    }

    function getRailPreviewLayout(item) {
      const cached = railWaveLayout.find((entry) => entry.item === item);
      if (cached) return cached;

      const bar = item.querySelector('.toc-rail-bar');
      if (!bar) return null;

      const rect = bar.getBoundingClientRect();
      const isLeft = tocContainer.classList.contains('position-left');
      return {
        item,
        centerY: rect.top + rect.height / 2,
        previewEdge: isLeft
          ? rect.right + railWaveMaxWidth + railWaveMaxShift
          : rect.left - railWaveMaxWidth - railWaveMaxShift
      };
    }

    function getClampedRailPreviewTop(centerY, currentRowIndex, rowCount) {
      if (!tocRailPreview) return centerY;

      const viewportPadding = 12;
      const previewHeight =
        railPreviewPaddingY * 2 +
        rowCount * railPreviewRowHeight +
        Math.max(0, rowCount - 1) * railPreviewRowGap;
      const currentRowCenter =
        railPreviewPaddingY +
        currentRowIndex * (railPreviewRowHeight + railPreviewRowGap) +
        railPreviewRowHeight / 2;
      const minTop = viewportPadding;
      const maxTop = window.innerHeight - viewportPadding - previewHeight;

      if (maxTop < minTop) {
        return viewportPadding;
      }

      return clampNumber(centerY - currentRowCenter, minTop, maxTop);
    }

    function getRailItemText(item) {
      const label = item?.querySelector('.toc-rail-label');
      return label?.textContent?.trim() || '';
    }

    function ensureSpotlightRows() {
      if (!tocSpotlightLayer) return [];
      const items = getRailWaveItems().map(({ item }) => item);
      const canReuse = spotlightRows.length === items.length && spotlightRows.every((entry, index) => entry.item === items[index]);
      if (canReuse) return spotlightRows;

      tocSpotlightLayer.textContent = '';
      spotlightRows = items.map((item) => {
        const row = document.createElement('span');
        row.className = 'toc-spotlight-row';
        row.setAttribute('aria-hidden', 'true');
        const text = document.createElement('span');
        text.className = 'toc-spotlight-text';
        text.textContent = getRailItemText(item);
        row.appendChild(text);
        const link = item.querySelector('.toc-rail-link');
        row.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          link?.click();
        });
        tocSpotlightLayer.appendChild(row);
        return { item, row };
      });
      return spotlightRows;
    }

    function hideSpotlightLabels() {
      ensureSpotlightRows().forEach(({ row }) => {
        row.classList.remove('is-visible', 'distance-0', 'distance-1', 'distance-2', 'distance-far');
      });
    }

    function updateSpotlightLabelContext(item) {
      if (!isSpotlightPreview()) return;
      const rows = ensureSpotlightRows();
      if (!item) {
        hideSpotlightLabels();
        return;
      }

      const items = getRailWaveItems().map(({ item: railItem }) => railItem);
      const currentIndex = items.indexOf(item);
      if (currentIndex === -1) return;

      if (railWaveLayout.length === 0) {
        refreshRailWaveLayout();
      }
      const layoutByItem = new Map(railWaveLayout.map((entry) => [entry.item, entry]));
      const railRect = tocContainer.getBoundingClientRect();
      const isLeft = tocContainer.classList.contains('position-left');
      rows.forEach(({ item: railItem, row }, index) => {
        const distance = Math.abs(index - currentIndex);
        const distanceClass = distance <= railPreviewContextRadius ? `distance-${distance}` : 'distance-far';
        const layout = layoutByItem.get(railItem);
        const isVisible = layout && layout.centerY >= railRect.top && layout.centerY <= railRect.bottom;
        if (!isVisible) {
          row.className = `toc-spotlight-row ${isLeft ? 'position-left' : 'position-right'}`;
          return;
        }

        row.className = `toc-spotlight-row is-visible ${distanceClass} ${isLeft ? 'position-left' : 'position-right'}`;
        row.style.top = `${layout.centerY}px`;
        if (isLeft) {
          row.style.left = `${layout.previewEdge + railPreviewGap}px`;
          row.style.right = 'auto';
        } else {
          row.style.left = 'auto';
          row.style.right = `${window.innerWidth - layout.previewEdge + railPreviewGap}px`;
        }
      });
    }

    function ensureGptPreviewRows() {
      if (!tocGptPreview) return [];
      const items = getRailWaveItems().map(({ item }) => item);
      const canReuse = gptRows.length === items.length && gptRows.every((entry, index) => entry.item === items[index]);
      if (canReuse) return gptRows;

      tocGptPreview.textContent = '';
      gptCurrentIndex = -1;
      const list = document.createElement('div');
      list.className = 'toc-gpt-preview-list';
      tocGptPreview.appendChild(list);

      gptRows = items.map((item) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.tabIndex = -1;
        row.className = 'toc-gpt-preview-row';
        row.dataset.level = item.dataset.level || '1';

        const text = document.createElement('span');
        text.className = 'toc-gpt-preview-text';
        text.textContent = getRailItemText(item);
        row.appendChild(text);

        const link = item.querySelector('.toc-rail-link');
        row.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          link?.click();
        });
        list.appendChild(row);
        return { item, row };
      });
      return gptRows;
    }

    function hideGptPreview() {
      if (!tocGptPreview) return;
      tocGptPreview.classList.remove('is-visible');
      tocGptPreview.setAttribute('aria-hidden', 'true');
      gptRows.forEach(({ row }) => {
        row.tabIndex = -1;
        row.classList.remove('is-current');
        row.removeAttribute('aria-current');
      });
      gptCurrentIndex = -1;
    }

    function setGptRowCurrent(index, isCurrent) {
      const row = gptRows[index]?.row;
      if (!row) return;
      row.tabIndex = isCurrent ? 0 : -1;
      row.classList.toggle('is-current', isCurrent);
      if (isCurrent) {
        row.setAttribute('aria-current', 'location');
      } else {
        row.removeAttribute('aria-current');
      }
    }

    function positionGptPreview(item, layout = getRailPreviewLayout(item)) {
      if (!tocGptPreview || !item || !layout) return;
      const rows = ensureGptPreviewRows();
      const currentIndex = rows.findIndex((entry) => entry.item === item);
      if (currentIndex === -1) return;

      const isLeft = tocContainer.classList.contains('position-left');
      tocGptPreview.classList.toggle('position-left', isLeft);
      tocGptPreview.classList.toggle('position-right', !isLeft);
      if (isLeft) {
        tocGptPreview.style.left = `${layout.previewEdge + railPreviewGap}px`;
        tocGptPreview.style.right = 'auto';
      } else {
        tocGptPreview.style.left = 'auto';
        tocGptPreview.style.right = `${window.innerWidth - layout.previewEdge + railPreviewGap}px`;
      }

      if (gptCurrentIndex !== currentIndex) {
        setGptRowCurrent(gptCurrentIndex, false);
        setGptRowCurrent(currentIndex, true);
        gptCurrentIndex = currentIndex;
      }
      tocGptPreview.classList.add('is-visible');
      tocGptPreview.setAttribute('aria-hidden', 'false');

      const list = tocGptPreview.querySelector('.toc-gpt-preview-list');
      const currentRow = rows[currentIndex].row;
      if (!list || !currentRow) return;
      const rowTop = currentRow.offsetTop;
      const rowBottom = rowTop + currentRow.offsetHeight;
      if (rowTop < list.scrollTop) {
        list.scrollTop = rowTop;
      } else if (rowBottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = rowBottom - list.clientHeight;
      }
    }

    function getRailPreviewContext(item) {
      const items = getRailWaveItems().map(({ item: railItem }) => railItem);
      const index = items.indexOf(item);
      if (index === -1) {
        return { rows: [], currentRowIndex: 0, currentIndex: -1, visibleRowCount: 0 };
      }

      const centerSlot = Math.min(railPreviewContextRadius, Math.max(0, items.length - 1));
      const visibleRowCount = Math.min(items.length, railPreviewContextRadius * 2 + 1);
      const rows = items.map((railItem, rowIndex) => ({
        item: railItem,
        text: getRailItemText(railItem),
        distance: Math.abs(rowIndex - index),
        isCurrent: railItem === item,
        isBefore: rowIndex < index
      })).filter((row) => row.text);

      return {
        rows,
        currentRowIndex: centerSlot,
        currentIndex: index,
        visibleRowCount
      };
    }

    function renderRailPreviewContext(item) {
      if (!tocRailPreview) return { rowCount: 0, currentRowIndex: 0 };
      if (
        railPreviewRenderedItem === item &&
        tocRailPreview.querySelector('.toc-rail-preview-row')
      ) {
        return railPreviewRenderedMeta;
      }

      const { rows, currentRowIndex, currentIndex, visibleRowCount } = getRailPreviewContext(item);
      let list = tocRailPreview.querySelector('.toc-rail-preview-list');
      let track = tocRailPreview.querySelector('.toc-rail-preview-track');
      let focus = tocRailPreview.querySelector('.toc-rail-preview-focus');

      if (!list) {
        tocRailPreview.textContent = '';
        list = document.createElement('div');
        list.className = 'toc-rail-preview-list';
        tocRailPreview.appendChild(list);
      }

      if (!track) {
        track = document.createElement('div');
        track.className = 'toc-rail-preview-track';
        list.appendChild(track);
      }

      if (!focus) {
        focus = document.createElement('div');
        focus.className = 'toc-rail-preview-focus';
        focus.setAttribute('aria-hidden', 'true');
        list.appendChild(focus);
      }

      const existingRows = track.querySelectorAll('.toc-rail-preview-row');
      const shouldRebuildRows = existingRows.length !== rows.length;

      if (shouldRebuildRows) {
        track.textContent = '';
      }

      const previewRows = Array.from(track.querySelectorAll('.toc-rail-preview-row'));
      rows.forEach((row, rowIndex) => {
        let previewRow = previewRows[rowIndex];
        if (!previewRow) {
          previewRow = document.createElement('div');
          previewRow.dataset.previewIndex = String(rowIndex);

          const text = document.createElement('span');
          text.className = 'toc-rail-preview-text';
          previewRow.appendChild(text);
          track.appendChild(previewRow);
        }

        const distanceClass = row.distance <= railPreviewContextRadius ? `distance-${row.distance}` : 'distance-far';
        previewRow.className = [
          'toc-rail-preview-row',
          distanceClass,
          row.isCurrent ? 'is-current' : '',
          row.isCurrent ? '' : row.isBefore ? 'is-before' : 'is-after'
        ].filter(Boolean).join(' ');
        previewRow.dataset.distance = String(row.distance);
        previewRow.dataset.level = row.item.dataset.level || '1';
        previewRow.querySelector('.toc-rail-preview-text').textContent = row.text;
      });

      const focusY = currentRowIndex * (railPreviewRowHeight + railPreviewRowGap);
      const trackY = focusY - currentIndex * (railPreviewRowHeight + railPreviewRowGap);
      tocRailPreview.style.setProperty('--toc-rail-focus-y', `${focusY}px`);
      tocRailPreview.style.setProperty('--toc-rail-track-y', `${trackY}px`);
      tocRailPreview.style.setProperty('--toc-rail-focus-opacity', rows.length > 0 ? '1' : '0');
      focus.classList.remove('is-bouncing');
      focus.offsetWidth;
      focus.classList.add('is-bouncing');

      railPreviewRenderedItem = item;
      railPreviewRenderedMeta = {
        rowCount: visibleRowCount,
        currentRowIndex: Math.min(currentRowIndex, Math.max(0, rows.length - 1))
      };
      return railPreviewRenderedMeta;
    }

    function positionRailPreview(item, layout = getRailPreviewLayout(item)) {
      if (!tocRailPreview || !item) return;

      if (!getRailItemText(item) || !layout) return;

      const isLeft = tocContainer.classList.contains('position-left');
      const { rowCount, currentRowIndex } = renderRailPreviewContext(item);
      if (rowCount === 0) return;
      const railRect = tocContainer.getBoundingClientRect();
      const previewAnchorY = railRect.top + railRect.height / 2;

      tocRailPreview.classList.toggle('position-left', isLeft);
      tocRailPreview.classList.toggle('position-right', !isLeft);
      tocRailPreview.style.top = '0';
      tocRailPreview.style.setProperty(
        '--toc-rail-preview-y',
        `${getClampedRailPreviewTop(previewAnchorY, currentRowIndex, rowCount)}px`
      );

      if (isLeft) {
        tocRailPreview.style.left = `${layout.previewEdge + railPreviewGap}px`;
        tocRailPreview.style.right = 'auto';
      } else {
        tocRailPreview.style.left = 'auto';
        tocRailPreview.style.right = `${window.innerWidth - layout.previewEdge + railPreviewGap}px`;
      }
    }

    function setRailPreviewItem(nextItem) {
      if (railPreviewItem === nextItem) return;
      if (railPreviewItem) {
        railPreviewItem.classList.remove('is-previewed');
      }
      railPreviewItem = nextItem;
      updateSpotlightLabelContext(railPreviewItem);
      if (isGptPreview()) {
        if (railPreviewItem) {
          positionGptPreview(railPreviewItem);
        } else {
          hideGptPreview();
        }
      }
      if (railPreviewItem) {
        railPreviewItem.classList.add('is-previewed');
        if (isWheelPreview() && tocRailPreview) {
          tocRailPreview.classList.add('is-visible');
        }
      } else if (isWheelPreview() && tocRailPreview) {
        tocRailPreview.classList.remove('is-visible');
        railPreviewRenderedItem = null;
        railPreviewRenderedMeta = { rowCount: 0, currentRowIndex: 0 };
      }
    }

    function isRailPostClickHoldActive() {
      return railPostClickHoldUntil > Date.now();
    }

    function clearRailPostClickHold() {
      if (railPostClickHoldTimer) {
        window.clearTimeout(railPostClickHoldTimer);
        railPostClickHoldTimer = null;
      }
      railPostClickHoldUntil = 0;
    }

    function scheduleRailPostClickHoldRelease() {
      if (railPostClickHoldTimer) {
        window.clearTimeout(railPostClickHoldTimer);
      }

      const delay = Math.max(0, railPostClickHoldUntil - Date.now());
      railPostClickHoldTimer = window.setTimeout(() => {
        railPostClickHoldTimer = null;
        railPostClickHoldUntil = 0;
        if (!railPointerInside) {
          resetRailWave();
          scheduleHoverClose();
        }
      }, delay);
    }

    function holdRailPreviewAfterClick(item) {
      if (!item || !tocList || !tocContainer) return;

      clearRailPostClickHold();
      railPostClickHoldUntil = Date.now() + railPostClickHoldMs;
      refreshRailWaveLayout();

      const entry = railWaveLayout.find(({ item: railItem }) => railItem === item);
      if (entry) {
        lastRailPointerY = entry.centerY;
        if (reducedMotionQuery.matches) {
          updateReducedMotionRailPreview(entry.centerY);
        } else {
          updateRailWave(entry.centerY);
        }
        if (isWheelPreview()) {
          positionRailPreview(item, entry);
        }
      } else {
        setRailPreviewItem(item);
        if (isWheelPreview()) {
          positionRailPreview(item);
        }
      }

      scheduleHoverOpen();
      scheduleRailPostClickHoldRelease();
    }

    function resetRailWave() {
      if (!tocList) return;
      if (railWaveFrame) {
        window.cancelAnimationFrame(railWaveFrame);
        railWaveFrame = null;
      }
      lastRailPointerY = null;
      setRailPreviewItem(null);
      getRailWaveItems().forEach(({ item }) => {
        item.classList.remove('is-wave-active');
        item.style.removeProperty('--toc-rail-wave-width');
        item.style.removeProperty('--toc-rail-wave-opacity');
        item.style.removeProperty('--toc-rail-wave-shift');
        item.style.removeProperty('--toc-rail-wave-scale-x');
        item.style.removeProperty('--toc-rail-wave-scale');
      });
      railWaveAffectedItems.clear();
      railWaveLayout = [];
    }

    function updateRailWave(pointerY) {
      if (!tocList) return;

      if (railWaveLayout.length === 0) {
        refreshRailWaveLayout();
      }

      const items = railWaveLayout;
      let nearestItem = null;
      let nearestEntry = null;
      let nearestDistance = Infinity;
      const shiftDirection = tocContainer.classList.contains('position-left') ? 1 : -1;
      const touchedItems = new Set();

      items.forEach((entry) => {
        const { item, centerY, baseWidth } = entry;
        touchedItems.add(item);
        const distance = Math.abs(pointerY - centerY);
        const rawStrength = Math.max(0, 1 - distance / railWaveMaxDistance);
        const strength = rawStrength * rawStrength * (3 - 2 * rawStrength);
        const waveWidth = strength * railWaveMaxWidth;

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestItem = item;
          nearestEntry = entry;
        }

        if (strength > 0) {
          item.classList.add('is-wave-active');
          item.style.setProperty('--toc-rail-wave-width', `${waveWidth.toFixed(2)}px`);
          item.style.setProperty('--toc-rail-wave-opacity', (0.62 + strength * 0.38).toFixed(3));
          item.style.setProperty('--toc-rail-wave-shift', `${(strength * 2 * shiftDirection).toFixed(2)}px`);
          item.style.setProperty('--toc-rail-wave-scale-x', ((baseWidth + waveWidth) / baseWidth).toFixed(3));
          item.style.setProperty('--toc-rail-wave-scale', (1 + strength * 0.24).toFixed(3));
          railWaveAffectedItems.add(item);
        } else if (railWaveAffectedItems.has(item)) {
          item.classList.remove('is-wave-active');
          item.style.removeProperty('--toc-rail-wave-width');
          item.style.removeProperty('--toc-rail-wave-opacity');
          item.style.removeProperty('--toc-rail-wave-shift');
          item.style.removeProperty('--toc-rail-wave-scale-x');
          item.style.removeProperty('--toc-rail-wave-scale');
          railWaveAffectedItems.delete(item);
        }
      });

      railWaveAffectedItems.forEach((item) => {
        if (touchedItems.has(item)) return;
        item.classList.remove('is-wave-active');
        item.style.removeProperty('--toc-rail-wave-width');
        item.style.removeProperty('--toc-rail-wave-opacity');
        item.style.removeProperty('--toc-rail-wave-shift');
        item.style.removeProperty('--toc-rail-wave-scale-x');
        item.style.removeProperty('--toc-rail-wave-scale');
        railWaveAffectedItems.delete(item);
      });

      const nextPreviewItem = nearestDistance <= railWaveMaxDistance ? nearestItem : null;
      setRailPreviewItem(nextPreviewItem);
      if (isWheelPreview() && railPreviewItem) {
        positionRailPreview(railPreviewItem, nearestEntry);
      }
    }

    function updateReducedMotionRailPreview(pointerY) {
      if (!tocList) return;

      if (railWaveLayout.length === 0) {
        refreshRailWaveLayout();
      }

      let nearestEntry = null;
      let nearestDistance = Infinity;

      railWaveLayout.forEach((entry) => {
        const distance = Math.abs(pointerY - entry.centerY);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEntry = entry;
        }
      });

      const nextPreviewItem = nearestDistance <= railWaveMaxDistance ? nearestEntry?.item || null : null;
      setRailPreviewItem(nextPreviewItem);
      if (isWheelPreview() && railPreviewItem) {
        positionRailPreview(railPreviewItem, nearestEntry);
      }
    }

    function scheduleRailWave(e) {
      if (!tocList) return;

      if (isRailPostClickHoldActive()) {
        clearRailPostClickHold();
      }
      lastRailPointerY = e.clientY;
      if (railWaveFrame) return;

      railWaveFrame = window.requestAnimationFrame(() => {
        railWaveFrame = null;
        if (lastRailPointerY !== null) {
          measurePerformance('railPointer', () => {
            if (reducedMotionQuery.matches) {
              updateReducedMotionRailPreview(lastRailPointerY);
            } else {
              updateRailWave(lastRailPointerY);
            }
          });
        }
      });
    }

    function updateScrollTopProximity(pointer) {
      if (!scrollTopButton || !scrollTopButton.classList.contains('visible')) return;

      const rect = scrollTopButton.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distanceFromCenter = Math.hypot(pointer.clientX - centerX, pointer.clientY - centerY);
      const near =
        pointer.clientX >= rect.left - scrollTopProximityRadius &&
        pointer.clientX <= rect.right + scrollTopProximityRadius &&
        pointer.clientY >= rect.top - scrollTopProximityRadius &&
        pointer.clientY <= rect.bottom + scrollTopProximityRadius;
      const hovered = distanceFromCenter <= scrollTopHoverRadius;

      scrollTopButton.classList.toggle('is-near', near);
      scrollTopButton.classList.toggle('is-hovered', hovered);
    }

    function scheduleScrollTopProximity(e) {
      if (!scrollTopButton || !scrollTopButton.classList.contains('visible')) return;

      lastScrollTopPointer = {
        clientX: e.clientX,
        clientY: e.clientY
      };
      if (scrollTopProximityFrame) return;

      scrollTopProximityFrame = window.requestAnimationFrame(() => {
        scrollTopProximityFrame = null;
        if (lastScrollTopPointer) {
          updateScrollTopProximity(lastScrollTopPointer);
        }
      });
    }

    function handleRailDocumentPointerMove(event) {
      scheduleScrollTopProximity(event);
      if ((!isSpotlightPreview() && !isGptPreview()) || !railPreviewItem) return;
      const target = event.target;
      if (tocContainer.contains(target) || tocSpotlightLayer?.contains(target) || tocGptPreview?.contains(target)) {
        railPointerInside = true;
        clearRailPointerExit();
        return;
      }

      railPointerInside = false;
      if (isRailPostClickHoldActive()) {
        scheduleRailPostClickHoldRelease();
        return;
      }
      scheduleRailPointerExit();
    }

    tocContainer.addEventListener('pointerenter', () => {
      railPointerInside = true;
      clearRailPointerExit();
      refreshRailWaveLayout();
      scheduleAdaptiveRailThemeUpdate(true);
      scheduleHoverOpen();
    });
    tocContainer.addEventListener('pointermove', scheduleRailWave);
    tocContainer.addEventListener('pointerleave', (event) => {
      if (
        (isSpotlightPreview() && tocSpotlightLayer?.contains(event.relatedTarget)) ||
        (isGptPreview() && tocGptPreview?.contains(event.relatedTarget))
      ) {
        railPointerInside = true;
        clearRailPointerExit();
        return;
      }
      railPointerInside = false;
      if (isRailPostClickHoldActive()) {
        scheduleRailPostClickHoldRelease();
        return;
      }
      scheduleRailPointerExit();
    });
    tocContainer.addEventListener('focusin', (event) => {
      toggleExpanded(true);
      const item = event.target?.closest?.('.toc-item:not(.no-headers)');
      if (!item) return;
      setRailPreviewItem(item);
      if (isWheelPreview()) {
        positionRailPreview(item);
      }
    });

    if (tocSpotlightLayer) {
      tocSpotlightLayer.addEventListener('pointerenter', () => {
        railPointerInside = true;
        clearRailPointerExit();
        clearHoverTimers();
      });
      tocSpotlightLayer.addEventListener('pointerleave', (event) => {
        if (tocContainer.contains(event.relatedTarget)) return;
        railPointerInside = false;
        if (isRailPostClickHoldActive()) {
          scheduleRailPostClickHoldRelease();
          return;
        }
        scheduleRailPointerExit();
      });
    }

    if (tocGptPreview) {
      tocGptPreview.addEventListener('pointerenter', () => {
        railPointerInside = true;
        clearRailPointerExit();
        clearHoverTimers();
      });
      tocGptPreview.addEventListener('pointerleave', (event) => {
        if (tocContainer.contains(event.relatedTarget)) return;
        railPointerInside = false;
        if (isRailPostClickHoldActive()) {
          scheduleRailPostClickHoldRelease();
          return;
        }
        scheduleRailPointerExit();
      });
      tocGptPreview.addEventListener('focusin', (event) => {
        railPointerInside = true;
        clearRailPointerExit();
        clearHoverTimers();
        const row = event.target?.closest?.('.toc-gpt-preview-row');
        const index = row ? gptRows.findIndex((entry) => entry.row === row) : -1;
        if (index >= 0) {
          setRailPreviewItem(gptRows[index].item);
        }
      });
      tocGptPreview.addEventListener('keydown', (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const row = event.target?.closest?.('.toc-gpt-preview-row');
        const currentIndex = row ? gptRows.findIndex((entry) => entry.row === row) : gptCurrentIndex;
        if (currentIndex < 0 || gptRows.length === 0) return;

        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown') nextIndex = Math.min(gptRows.length - 1, currentIndex + 1);
        if (event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = gptRows.length - 1;
        gptRows[nextIndex].row.focus({ preventScroll: true });
        setRailPreviewItem(gptRows[nextIndex].item);
      });
      tocGptPreview.addEventListener('focusout', (event) => {
        if (tocGptPreview.contains(event.relatedTarget) || tocContainer.contains(event.relatedTarget)) return;
        railPointerInside = false;
        clearRailPostClickHold();
        scheduleRailPointerExit();
      });
    }
    tocContainer.addEventListener('focusout', (e) => {
      if (!tocContainer.contains(e.relatedTarget) && !tocGptPreview?.contains(e.relatedTarget)) {
        clearRailPostClickHold();
        resetRailWave();
        scheduleHoverClose();
      }
    });

    if (tocList) {
      tocList.addEventListener('click', (e) => {
        const link = e.target?.closest?.('.toc-rail-link');
        if (!link || !tocList.contains(link)) return;

        const item = link.closest('.toc-item:not(.no-headers)');
        holdRailPreviewAfterClick(item);
      }, true);

      tocList.addEventListener('scroll', () => {
        railWaveLayout = [];
        if (isSpotlightPreview() || isGptPreview()) {
          setRailPreviewItem(null);
        }
      }, { passive: true });
    }

    window.addEventListener('resize', () => {
      railWaveLayout = [];
      if (isSpotlightPreview() || isGptPreview()) {
        setRailPreviewItem(null);
      }
      lastAdaptiveThemeApplied = '';
      scheduleAdaptiveRailThemeUpdate(true);
    }, { passive: true });

    if (scrollTopButton) {
      document.addEventListener('pointermove', handleRailDocumentPointerMove, { passive: true });
      document.addEventListener('pointerleave', () => {
        scrollTopButton.classList.remove('is-near');
        scrollTopButton.classList.remove('is-hovered');
        lastScrollTopPointer = null;
      });
      scrollTopButton.addEventListener('pointerenter', () => {
        scrollTopButton.classList.add('is-hovered');
      });
      scrollTopButton.addEventListener('pointerleave', () => {
        scrollTopButton.classList.remove('is-hovered');
      });
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

    if (isRailPreset()) {
      setupRailInteractions();
      return;
    }

    setupDefaultInteractions();
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
    scheduleAdaptiveRailThemeUpdate(true);
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
