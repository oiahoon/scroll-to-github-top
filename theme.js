'use strict';

(function() {
  // 性能优化：缓存主题检测结果
  let cachedTheme = null;
  let lastThemeCheck = 0;
  let lastDomChangeTime = 0;
  const THEME_CACHE_DURATION = 5000; // 5秒缓存
  const DOM_SAMPLE_SIZE = 100; // 限制采样元素数量
  
  // 获取页面主要颜色 - 优化版本
  function getMainColor() {
    // 使用采样而非遍历所有元素
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    const sampleElements = Array.from(textElements).slice(0, DOM_SAMPLE_SIZE); // 只采样前100个元素
    const colors = new Map();

    // 统计颜色出现次数 - 使用采样元素
    sampleElements.forEach(element => {
      try {
        const color = window.getComputedStyle(element).color;
        if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          colors.set(color, (colors.get(color) || 0) + 1);
        }
      } catch (error) {
        // 忽略样式计算错误
      }
    });

    // 获取出现最多的颜色
    let maxCount = 0;
    let mainColor = null;
    colors.forEach((count, color) => {
      if (count > maxCount) {
        maxCount = count;
        mainColor = color;
      }
    });

    return mainColor;
  }

  // 将RGB颜色转换为HSL
  function rgbToHsl(rgb) {
    // 解析RGB值
    const rgbMatch = rgb.match(/\d+/g);
    if (!rgbMatch) return null;

    const r = parseInt(rgbMatch[0]) / 255;
    const g = parseInt(rgbMatch[1]) / 255;
    const b = parseInt(rgbMatch[2]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }

      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  // 根据背景色选择合适的主题 - 带缓存优化
  function selectTheme() {
    const now = Date.now();
    
    // 使用缓存结果，减少重复计算
    if (cachedTheme && (now - lastThemeCheck) < THEME_CACHE_DURATION) {
      return cachedTheme;
    }
    
    const mainColor = getMainColor();
    if (!mainColor) {
      cachedTheme = 'theme-light';
      lastThemeCheck = now;
      return cachedTheme;
    }

    const hsl = rgbToHsl(mainColor);
    if (!hsl) {
      cachedTheme = 'theme-light';
      lastThemeCheck = now;
      return cachedTheme;
    }

    // 根据亮度和色相选择主题
    let selectedTheme;
    if (hsl.l > 70) {
      // 浅色背景使用浅色主题
      selectedTheme = 'theme-light';
    } else if (hsl.l < 30) {
      // 深色背景使用深色主题
      selectedTheme = 'theme-dark';
    } else {
      // 根据色相选择彩色主题
      if (hsl.h >= 0 && hsl.h <= 60) {
        // 红色/黄色背景使用绿色主题
        selectedTheme = 'theme-green';
      } else if (hsl.h >= 60 && hsl.h <= 180) {
        // 绿色/青色背景使用紫色主题
        selectedTheme = 'theme-purple';
      } else if (hsl.h >= 180 && hsl.h <= 300) {
        // 蓝色/紫色背景使用蓝色主题
        selectedTheme = 'theme-blue';
      } else {
        // 其他情况使用浅色主题
        selectedTheme = 'theme-light';
      }
    }
    
    // 缓存结果
    cachedTheme = selectedTheme;
    lastThemeCheck = now;
    return selectedTheme;
  }

  // 应用主题
  function applyTheme() {
    const tocContainer = document.getElementById('github-toc');
    if (!tocContainer) return;

    // 移除所有主题类
    tocContainer.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple');

    // 添加新主题类
    const theme = selectTheme();
    tocContainer.classList.add(theme);
  }

  // 防抖函数，减少频繁的主题检测
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

  // 监听DOM变化，以便在页面内容更新时重新检测主题
  const debouncedApplyTheme = debounce(() => {
    lastDomChangeTime = Date.now();
    applyTheme();
  }, 300); // 300ms防抖

  const observer = new MutationObserver((mutations) => {
    // 只在有意义的变化时触发主题更新
    const hasSignificantChanges = mutations.some(mutation => 
      mutation.type === 'childList' && 
      (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
    );
    
    if (hasSignificantChanges) {
      debouncedApplyTheme();
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 初始应用主题
  applyTheme();
})();