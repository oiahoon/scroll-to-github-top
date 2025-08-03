'use strict';

// 使用立即执行函数来创建独立的作用域
(function() {
  // 强化的竞态条件防护
  const EXTENSION_NAMESPACE = 'smartTocScrollExtension';
  const INIT_LOCK_KEY = EXTENSION_NAMESPACE + '_initializing';
  const INSTANCE_KEY = EXTENSION_NAMESPACE + '_instance';
  
  // 检查是否已经有实例正在初始化或已初始化
  if (window[INSTANCE_KEY] || window[INIT_LOCK_KEY]) {
    return;
  }
  
  // 原子性检查 - 同时检查DOM和全局状态
  if (document.getElementById('github-toc')) {
    window[INSTANCE_KEY] = true;
    return;
  }
  
  // 设置初始化锁，防止并发初始化
  window[INIT_LOCK_KEY] = true;

  // 状态变量
  let observer = null;
  let updateTimeout = null;
  let lastProcessedHeaders = new Set();
  let lastUrl = window.location.href;
  let contentContainer = null;
  let isGitHub = window.location.hostname === 'github.com';
  
  // 内存泄漏防护 - 跟踪所有定时器和监听器
  let performanceInterval = null;
  let githubMonitorInterval = null;
  let scrollTimeout = null;

  // 性能监控相关变量
  const performanceMetrics = {
    tocGeneration: [],
    tocUpdate: [],
    scrollPerformance: [],
    memoryUsage: []
  };

  // 用户配置管理
  const CONFIG_KEY = 'smart-toc-config';
  const defaultConfig = {
    tocStyle: 'classic', // 'classic' | 'skeleton'
    tocPosition: 'right', // 'left' | 'right'
    autoHide: true,
    showPerformance: false
  };

  function getConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch (error) {
      console.warn('Failed to load config:', error);
      return defaultConfig;
    }
  }

  function saveConfig(config) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }

  let currentConfig = getConfig();

  // 创建目录树容器 - 支持多种样式
  const tocContainer = document.createElement('div');
  tocContainer.id = 'github-toc';
  
  // 根据配置应用不同的样式类
  const baseClass = currentConfig.tocStyle === 'skeleton' ? 'github-toc-skeleton' : 'github-toc';
  const positionClass = currentConfig.tocStyle === 'skeleton' ? `position-${currentConfig.tocPosition}` : '';
  tocContainer.className = `${baseClass} theme-light ${positionClass}`.trim();
  
  // 可访问性改进 - ARIA标签和属性
  tocContainer.setAttribute('role', 'navigation');
  tocContainer.setAttribute('aria-label', 'Table of Contents');
  tocContainer.setAttribute('aria-expanded', 'false');
  tocContainer.setAttribute('tabindex', '0');
  
  document.body.appendChild(tocContainer);

  // 根据样式类型创建不同的UI结构
  let iconContainer = null;
  
  if (currentConfig.tocStyle === 'classic') {
    // 经典模式：圆形图标按钮
    iconContainer = document.createElement('div');
    iconContainer.className = 'toc-icon';
    
    // 创建SVG元素而不是使用innerHTML
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '30');
    svg.setAttribute('viewBox', '0 0 24 24');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M3 5h18v2H3V5zm0 6h18v2H3v-2zm0 6h18v2H3v-2z');
    
    svg.appendChild(path);
    iconContainer.appendChild(svg);
    tocContainer.appendChild(iconContainer);
    
    // 在经典模式也添加设置按钮
    const settingsBtn = document.createElement('div');
    settingsBtn.className = 'toc-settings-btn-classic';
    settingsBtn.setAttribute('title', 'TOC Settings');
    settingsBtn.innerHTML = '⚙️';
    tocContainer.appendChild(settingsBtn);
  } else {
    // 骨架模式：创建设置按钮
    const settingsBtn = document.createElement('div');
    settingsBtn.className = 'toc-settings-btn';
    settingsBtn.setAttribute('title', 'TOC Settings');
    settingsBtn.innerHTML = '⚙️';
    tocContainer.appendChild(settingsBtn);
  }

  // 创建目录树结构
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
  tocList.setAttribute('role', 'list');
  tocList.setAttribute('aria-label', 'Table of Contents Items');
  tocTree.appendChild(tocList);

  // 将目录树添加到容器中
  tocContainer.appendChild(tocTree);

  // 创建设置面板
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'toc-settings-panel';
  settingsPanel.style.display = 'none';
  settingsPanel.innerHTML = `
    <div class="settings-header">
      <h3>TOC Settings</h3>
      <button class="close-btn">&times;</button>
    </div>
    <div class="settings-content">
      <div class="setting-group">
        <label>Style:</label>
        <select id="toc-style-select">
          <option value="classic">Classic</option>
          <option value="skeleton">Skeleton</option>
        </select>
      </div>
      <div class="setting-group" id="position-group" style="display: none;">
        <label>Position:</label>
        <select id="toc-position-select">
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="auto-hide-checkbox">
          Auto Hide
        </label>
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" id="show-performance-checkbox">
          Show Performance
        </label>
      </div>
      <button class="apply-btn">Apply</button>
    </div>
  `;
  document.body.appendChild(settingsPanel);

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

  // 工具函数 - 改进的清理机制
  function cleanup() {
    // 清理MutationObserver
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    // 清理所有定时器
    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    
    if (performanceInterval) {
      clearInterval(performanceInterval);
      performanceInterval = null;
    }
    
    if (githubMonitorInterval) {
      clearInterval(githubMonitorInterval);
      githubMonitorInterval = null;
    }
    
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
      scrollTimeout = null;
    }
    
    // 清理数据结构
    lastProcessedHeaders.clear();
    
    // 清理性能监控数据，防止内存累积
    performanceMetrics.tocGeneration.length = 0;
    performanceMetrics.tocUpdate.length = 0;
    performanceMetrics.scrollPerformance.length = 0;
    performanceMetrics.memoryUsage.length = 0;
    
    // 清理全局状态标记，允许重新初始化
    delete window[INSTANCE_KEY];
    delete window[INIT_LOCK_KEY];
  }

  // 安全地清空DOM元素
  function clearElement(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  // 安全地创建文本节点和元素
  function createSafeElement(tagName, textContent, className) {
    const element = document.createElement(tagName);
    if (textContent) {
      element.textContent = textContent;
    }
    if (className) {
      element.className = className;
    }
    return element;
  }

  // 安全的样式计算，带错误处理
  function safeGetComputedStyle(element, property) {
    try {
      const style = window.getComputedStyle(element);
      return property ? style.getPropertyValue(property) : style;
    } catch (error) {
      console.warn('Failed to get computed style:', error);
      return property ? '' : {};
    }
  }

  // 安全的数值解析
  function safeParseInt(value, defaultValue = 0) {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  // 安全的DOM查询
  function safeQuerySelector(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.warn('Invalid selector:', selector, error);
      return null;
    }
  }

  function safeQuerySelectorAll(selector, parent = document) {
    try {
      return parent.querySelectorAll(selector);
    } catch (error) {
      console.warn('Invalid selector:', selector, error);
      return [];
    }
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
    // 安全地获取标题，带错误处理
    if (!contentContainer) {
      console.warn('Content container not found');
      return [];
    }
    
    try {
      const standardHeaders = Array.from(safeQuerySelectorAll('h1, h2, h3, h4, h5, h6', contentContainer));
      const customHeaders = Array.from(safeQuerySelectorAll('[class*="title"], [class*="heading"], [class*="header"]', contentContainer))
        .filter(el => {
          const style = safeGetComputedStyle(el);
          if (!style || typeof style === 'string') return false;
          
          const fontSize = safeParseInt(style.fontSize, 0);
          const fontWeight = safeParseInt(style.fontWeight, 0);
          return fontSize >= 16 && fontWeight >= 500;
        });

      return [...standardHeaders, ...customHeaders]
        .filter(header => {
          const style = safeGetComputedStyle(header);
          if (!style || typeof style === 'string') return true; // 默认显示
          
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }

          // 安全地检查父元素
          let parent = header.parentElement;
          let depth = 0;
          while (parent && parent !== contentContainer && depth < 10) { // 限制深度防止无限循环
            try {
              if (excludeContainers.some(selector => parent.matches(selector))) {
                return false;
              }
            } catch (error) {
              // 如果matches失败，跳过这个检查
              console.warn('Failed to match selector on parent element:', error);
            }
            parent = parent.parentElement;
            depth++;
          }

          // 安全地获取文本内容
          const headerText = (header.textContent || '').trim();
          if (!headerText) return false;
          
          // 创建安全的ID
          const headerId = `${headerText}-${header.tagName || 'unknown'}-${header.offsetTop || 0}`;
          if (lastProcessedHeaders.has(headerId)) {
            return false;
          }
          lastProcessedHeaders.add(headerId);

          return true;
        })
        .sort((a, b) => {
          try {
            return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
          } catch (error) {
            // 如果compareDocumentPosition失败，保持原序
            return 0;
          }
        });
    } catch (error) {
      console.error('Error in getHeaders:', error);
      return [];
    }
  }

  // 性能监控工具函数 - 带错误处理
  function measurePerformance(metricName, callback) {
    if (!performanceMetrics[metricName]) {
      console.warn('Invalid performance metric name:', metricName);
      return callback();
    }
    
    try {
      const startTime = performance.now();
      let startMemory = 0;
      
      // 安全地获取内存信息
      try {
        startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      } catch (memError) {
        // 内存API不可用时静默忽略
      }

      const result = callback();

      const endTime = performance.now();
      let endMemory = 0;
      
      try {
        endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      } catch (memError) {
        // 内存API不可用时使用startMemory
        endMemory = startMemory;
      }

      const duration = endTime - startTime;
      const memoryDelta = endMemory - startMemory;

      performanceMetrics[metricName].push({
        timestamp: Date.now(),
        duration: Math.max(0, duration), // 确保非负值
        memoryDelta,
        memoryUsage: endMemory
      });

      // 只保留最近100条记录，防止内存泄漏
      if (performanceMetrics[metricName].length > 100) {
        performanceMetrics[metricName].shift();
      }

      return result;
    } catch (error) {
      console.error('Performance measurement failed:', error);
      // 性能监控失败时仍然执行回调
      return callback();
    }
  }

  function getPerformanceStats(metricName) {
    try {
      const metrics = performanceMetrics[metricName];
      if (!metrics || metrics.length === 0) return null;

      const durations = metrics.map(m => m.duration || 0).filter(d => !isNaN(d));
      const memoryDeltas = metrics.map(m => m.memoryDelta || 0).filter(d => !isNaN(d));

      if (durations.length === 0) return null;

      return {
        count: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        avgMemoryDelta: memoryDeltas.length > 0 ? memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length : 0,
        latestMemoryUsage: metrics[metrics.length - 1]?.memoryUsage || 0
      };
    } catch (error) {
      console.error('Failed to get performance stats:', error);
      return null;
    }
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

    // 定期更新性能统计 - 安全的DOM操作，防止内存泄漏
    performanceInterval = setInterval(() => {
      const stats = {
        generation: getPerformanceStats('tocGeneration'),
        update: getPerformanceStats('tocUpdate'),
        scroll: getPerformanceStats('scrollPerformance')
      };

      if (!stats.generation && !stats.update && !stats.scroll) return;

      // 安全地重建性能统计显示
      clearElement(statsContainer);
      
      const title = createSafeElement('h3', 'TOC Performance Stats');
      statsContainer.appendChild(title);

      if (stats.generation) {
        const genDiv = createSafeElement('div');
        genDiv.appendChild(createSafeElement('h4', 'Generation'));
        genDiv.appendChild(createSafeElement('p', `Count: ${stats.generation.count}`));
        genDiv.appendChild(createSafeElement('p', `Avg Duration: ${stats.generation.avgDuration.toFixed(2)}ms`));
        genDiv.appendChild(createSafeElement('p', `Min/Max: ${stats.generation.minDuration.toFixed(2)}ms / ${stats.generation.maxDuration.toFixed(2)}ms`));
        genDiv.appendChild(createSafeElement('p', `Memory Usage: ${(stats.generation.latestMemoryUsage / 1024 / 1024).toFixed(2)}MB`));
        statsContainer.appendChild(genDiv);
      }

      if (stats.update) {
        const updateDiv = createSafeElement('div');
        updateDiv.appendChild(createSafeElement('h4', 'Updates'));
        updateDiv.appendChild(createSafeElement('p', `Count: ${stats.update.count}`));
        updateDiv.appendChild(createSafeElement('p', `Avg Duration: ${stats.update.avgDuration.toFixed(2)}ms`));
        updateDiv.appendChild(createSafeElement('p', `Min/Max: ${stats.update.minDuration.toFixed(2)}ms / ${stats.update.maxDuration.toFixed(2)}ms`));
        updateDiv.appendChild(createSafeElement('p', `Memory Delta: ${(stats.update.avgMemoryDelta / 1024 / 1024).toFixed(2)}MB`));
        statsContainer.appendChild(updateDiv);
      }

      if (stats.scroll) {
        const scrollDiv = createSafeElement('div');
        scrollDiv.appendChild(createSafeElement('h4', 'Scroll Performance'));
        scrollDiv.appendChild(createSafeElement('p', `Count: ${stats.scroll.count}`));
        scrollDiv.appendChild(createSafeElement('p', `Avg Duration: ${stats.scroll.avgDuration.toFixed(2)}ms`));
        scrollDiv.appendChild(createSafeElement('p', `Min/Max: ${stats.scroll.minDuration.toFixed(2)}ms / ${stats.scroll.maxDuration.toFixed(2)}ms`));
        statsContainer.appendChild(scrollDiv);
      }
    }, 1000);
  }

  // 修改现有的函数以包含性能监控
  function updateTOC() {
    return measurePerformance('tocUpdate', () => {
      cleanup();
      lastProcessedHeaders.clear();

      const headers = getHeaders();
      if (headers.length === 0) {
        const tocList = document.querySelector('.toc-list');
        if (tocList) {
          // 安全地创建"无标题"状态DOM
          clearElement(tocList);
          
          const li = document.createElement('li');
          li.className = 'toc-item no-headers';
          
          const messageDiv = document.createElement('div');
          messageDiv.className = 'no-headers-message';
          
          // 创建SVG图标
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('width', '24');
          svg.setAttribute('height', '24');
          
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z');
          svg.appendChild(path);
          
          const span = document.createElement('span');
          span.textContent = 'No headers found';
          
          const p = document.createElement('p');
          p.textContent = "This page doesn't have any headings or the content is not loaded yet.";
          
          messageDiv.appendChild(svg);
          messageDiv.appendChild(span);
          messageDiv.appendChild(p);
          li.appendChild(messageDiv);
          tocList.appendChild(li);
        }
        return;
      }

      const tocList = document.querySelector('.toc-list');
      if (!tocList) return;

      clearElement(tocList);

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
        li.dataset.level = level;
        
        // 在骨架模式下，默认添加skeleton-mode类
        if (currentConfig.tocStyle === 'skeleton') {
          li.classList.add('skeleton-mode');
        }

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

          // 更新当前活动标题和骨架模式状态
          updateActiveHeader();
          updateSkeletonMode();
        });

        li.appendChild(a);
        tocList.appendChild(li);
      });

      // 初始化当前活动标题和骨架模式
      updateActiveHeader();
      updateSkeletonMode();
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

  // 添加更新骨架模式的函数
  function updateSkeletonMode() {
    if (currentConfig.tocStyle !== 'skeleton') return;

    const tocItems = document.querySelectorAll('.toc-item');
    const activeItem = document.querySelector('.toc-item.active');
    
    // 首先，给所有项目添加skeleton-mode类
    tocItems.forEach(item => {
      item.classList.add('skeleton-mode');
      item.classList.remove('current', 'parent-of-current');
    });

    if (activeItem) {
      // 移除当前项的skeleton-mode类，显示文本
      activeItem.classList.remove('skeleton-mode');
      activeItem.classList.add('current');

      // 查找并显示所有父级项目
      const currentLevel = parseInt(activeItem.dataset.level);
      let prevItem = activeItem.previousElementSibling;
      let lastParentLevel = currentLevel;

      while (prevItem) {
        const prevLevel = parseInt(prevItem.dataset.level);
        if (prevLevel < lastParentLevel) {
          prevItem.classList.remove('skeleton-mode');
          prevItem.classList.add('parent-of-current');
          lastParentLevel = prevLevel;
        }
        prevItem = prevItem.previousElementSibling;
      }
    }
  }

  // 修改滚动监听以包含性能监控
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }

    scrollTimeout = window.requestAnimationFrame(() => {
      measurePerformance('scrollPerformance', () => {
        const sTop = document.body.scrollTop + document.documentElement.scrollTop;
        tocContainer.style.display = sTop > 468 ? 'block' : 'none';
        updateActiveHeader();
        updateSkeletonMode();
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
    // 竞态条件防护：只有有效实例才能重新初始化
    if (!window[INSTANCE_KEY] || window[INIT_LOCK_KEY]) {
      return;
    }
    
    return measurePerformance('tocGeneration', () => {
      try {
        cleanup();
        contentContainer = findContentContainer();
        setupObserver();
        updateTOC();
      } catch (error) {
        console.error('TOC reinitialization failed:', error);
        // 重新初始化失败时，保持当前状态
      }
    });
  }

  function initialize() {
    contentContainer = findContentContainer();
    setupObserver();
    setupHistoryListener();
    setupGitHubListener();
    displayPerformanceStats();

    if (isGitHubPage()) {
      githubMonitorInterval = setInterval(() => {
        const currentContainer = findContentContainer();
        if (currentContainer !== contentContainer) {
          reinitializeTOC();
        }
      }, 1000);
    }
  }

  // 事件监听 - 包含可访问性支持
  tocContainer.addEventListener('mouseenter', () => {
    tocContainer.classList.add('expanded');
    tocContainer.setAttribute('aria-expanded', 'true');
    if (iconContainer) {
      iconContainer.style.opacity = '0';
    }
    
    // 骨架模式下，鼠标悬停时显示所有项目
    if (currentConfig.tocStyle === 'skeleton') {
      document.querySelectorAll('.toc-item').forEach(item => {
        item.classList.add('hover-show');
      });
    }
  });

  tocContainer.addEventListener('mouseleave', () => {
    tocContainer.classList.remove('expanded');
    tocContainer.setAttribute('aria-expanded', 'false');
    if (iconContainer) {
      iconContainer.style.opacity = '1';
    }
    
    // 骨架模式下，鼠标离开时恢复骨架状态
    if (currentConfig.tocStyle === 'skeleton') {
      document.querySelectorAll('.toc-item').forEach(item => {
        item.classList.remove('hover-show');
      });
      updateSkeletonMode();
    }
  });

  // 键盘导航支持
  tocContainer.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        // 切换展开状态
        const isExpanded = tocContainer.classList.contains('expanded');
        if (isExpanded) {
          tocContainer.classList.remove('expanded');
          tocContainer.setAttribute('aria-expanded', 'false');
          iconContainer.style.opacity = '1';
        } else {
          tocContainer.classList.add('expanded');
          tocContainer.setAttribute('aria-expanded', 'true');
          iconContainer.style.opacity = '0';
          // 聚焦到第一个目录项
          const firstItem = tocContainer.querySelector('.toc-item a');
          if (firstItem) {
            setTimeout(() => firstItem.focus(), 100);
          }
        }
        break;
      case 'Escape':
        // 收起TOC
        if (tocContainer.classList.contains('expanded')) {
          e.preventDefault();
          tocContainer.classList.remove('expanded');
          tocContainer.setAttribute('aria-expanded', 'false');
          iconContainer.style.opacity = '1';
          tocContainer.focus();
        }
        break;
    }
  });

  tocContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'path') {
      const holder = document.body.scrollTop === 0 ? document.documentElement : document.body;
      scrollTo(holder, 0, 348);
    }
  });

  // 设置按钮事件处理
  const settingsBtn = document.querySelector('.toc-settings-btn, .toc-settings-btn-classic');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsPanel.style.display = 'block';
      
      // 设置当前配置值
      document.getElementById('toc-style-select').value = currentConfig.tocStyle;
      document.getElementById('toc-position-select').value = currentConfig.tocPosition;
      document.getElementById('auto-hide-checkbox').checked = currentConfig.autoHide;
      document.getElementById('show-performance-checkbox').checked = currentConfig.showPerformance;
      
      // 显示/隐藏位置选项
      const positionGroup = document.getElementById('position-group');
      positionGroup.style.display = currentConfig.tocStyle === 'skeleton' ? 'block' : 'none';
    });
  }

  // 设置面板事件处理
  const closeBtn = settingsPanel.querySelector('.close-btn');
  closeBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
  });

  // 样式选择变化时显示/隐藏位置选项
  const styleSelect = document.getElementById('toc-style-select');
  styleSelect.addEventListener('change', () => {
    const positionGroup = document.getElementById('position-group');
    positionGroup.style.display = styleSelect.value === 'skeleton' ? 'block' : 'none';
  });

  // 应用设置
  const applyBtn = settingsPanel.querySelector('.apply-btn');
  applyBtn.addEventListener('click', () => {
    const newConfig = {
      tocStyle: document.getElementById('toc-style-select').value,
      tocPosition: document.getElementById('toc-position-select').value,
      autoHide: document.getElementById('auto-hide-checkbox').checked,
      showPerformance: document.getElementById('show-performance-checkbox').checked
    };
    
    saveConfig(newConfig);
    settingsPanel.style.display = 'none';
    
    // 重新加载页面以应用新设置
    location.reload();
  });

  document.addEventListener('focusin', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      tocContainer.classList.remove('expanded');
    }
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

  // 启动初始化
  try {
    initialize();
    
    // 初始化成功，设置实例标记并释放锁
    window[INSTANCE_KEY] = true;
    delete window[INIT_LOCK_KEY];
  } catch (error) {
    // 初始化失败，清理状态
    console.error('Smart TOC initialization failed:', error);
    delete window[INIT_LOCK_KEY];
    delete window[INSTANCE_KEY];
  }

  // 清理机制 - 防止内存泄漏
  window.addEventListener('unload', cleanup);
  window.addEventListener('beforeunload', cleanup);
  
  // 页面可见性变化时也进行清理（移动端支持）
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面隐藏时暂停不必要的操作
      if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
      }
    } else {
      // 页面重新可见时恢复性能监控
      if (!performanceInterval && document.getElementById('toc-performance-stats')) {
        displayPerformanceStats();
      }
    }
  });
})();
