'use strict';

(function() {
  // 获取页面主要颜色
  function getMainColor() {
    // 获取所有文本元素
    const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
    const colors = new Map();

    // 统计颜色出现次数
    textElements.forEach(element => {
      const color = window.getComputedStyle(element).color;
      colors.set(color, (colors.get(color) || 0) + 1);
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

  // 根据背景色选择合适的主题
  function selectTheme() {
    const mainColor = getMainColor();
    if (!mainColor) return 'theme-light';

    const hsl = rgbToHsl(mainColor);
    if (!hsl) return 'theme-light';

    // 根据亮度和色相选择主题
    if (hsl.l > 70) {
      // 浅色背景使用浅色主题
      return 'theme-light';
    } else if (hsl.l < 30) {
      // 深色背景使用深色主题
      return 'theme-dark';
    } else {
      // 根据色相选择彩色主题
      if (hsl.h >= 0 && hsl.h <= 60) {
        // 红色/黄色背景使用绿色主题
        return 'theme-green';
      } else if (hsl.h >= 60 && hsl.h <= 180) {
        // 绿色/青色背景使用紫色主题
        return 'theme-purple';
      } else if (hsl.h >= 180 && hsl.h <= 300) {
        // 蓝色/紫色背景使用蓝色主题
        return 'theme-blue';
      } else {
        // 其他情况使用浅色主题
        return 'theme-light';
      }
    }
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

  // 监听DOM变化，以便在页面内容更新时重新检测主题
  const observer = new MutationObserver(() => {
    applyTheme();
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 初始应用主题
  applyTheme();
})();