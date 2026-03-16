'use strict';

(function() {
  // 将RGB字符串解析为HSL对象
  // 参数格式：'rgb(r, g, b)' 或 'rgba(r, g, b, a)'
  function rgbToHsl(rgb) {
    const match = rgb.match(/\d+/g);
    if (!match || match.length < 3) return null;

    const r = parseInt(match[0]) / 255;
    const g = parseInt(match[1]) / 255;
    const b = parseInt(match[2]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s;
    let l = (max + min) / 2;

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

  // 判断一个颜色字符串是否为透明（rgba(0,0,0,0) 或 transparent）
  function isTransparent(color) {
    if (!color) return true;
    if (color === 'transparent') return true;
    // rgba(0, 0, 0, 0) 形式
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match && match[4] !== undefined && parseFloat(match[4]) === 0) return true;
    return false;
  }

  // 直接检测页面背景色，返回 HSL 亮度值（0-100）
  // 检测优先级（UI_DESIGN_SPEC.md §7.5）：
  //   1. document.body 的 background-color
  //   2. document.documentElement 的 background-color
  //   3. <html> 上的 color-scheme 属性
  //   4. prefers-color-scheme 媒体查询
  //   5. 最终兜底：假设浅色背景（l = 100）
  function getPageBackgroundLightness() {
    // 策略 1：body 背景色
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    if (!isTransparent(bodyBg)) {
      const hsl = rgbToHsl(bodyBg);
      if (hsl) return hsl.l;
    }

    // 策略 2：html 元素背景色
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    if (!isTransparent(htmlBg)) {
      const hsl = rgbToHsl(htmlBg);
      if (hsl) return hsl.l;
    }

    // 策略 3：<html> 上的 color-scheme 属性
    const colorScheme = document.documentElement.getAttribute('color-scheme') ||
                        document.documentElement.style.colorScheme ||
                        window.getComputedStyle(document.documentElement).colorScheme;
    if (colorScheme) {
      if (colorScheme.includes('dark')) return 10;   // 深色系统 → 低亮度
      if (colorScheme.includes('light')) return 100; // 浅色系统 → 高亮度
    }

    // 策略 4：prefers-color-scheme 媒体查询
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 10; // 深色偏好 → 低亮度
    }

    // 最终兜底：假设浅色背景
    return 100;
  }

  // 根据背景亮度选择主题
  // L > 60：浅色背景页面 → 使用深色浮层（theme-dark）
  // L <= 60：深色/中色背景页面 → 使用浅色浮层（theme-light）
  function selectTheme() {
    const lightness = getPageBackgroundLightness();
    return lightness > 60 ? 'theme-dark' : 'theme-light';
  }

  const themeClassNames = ['theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-auto'];
  let themeApplyTimer = null;
  let lastAppliedTheme = null;

  function applyThemeClass(element, theme) {
    if (!element) return;
    element.classList.remove(...themeClassNames);
    element.classList.add(theme);
  }

  // 应用主题到扩展注入的浮层元素
  function applyTheme() {
    const theme = selectTheme();
    if (theme === lastAppliedTheme && document.getElementById('github-toc')) {
      return;
    }
    lastAppliedTheme = theme;
    applyThemeClass(document.getElementById('github-toc'), theme);
  }

  function scheduleApplyTheme() {
    clearTimeout(themeApplyTimer);
    themeApplyTimer = setTimeout(applyTheme, 120);
  }

  function startThemeObserver() {
    if (!document.body) return;

    // 监听 DOM 变化，在页面内容更新时重新检测主题（如 SPA 路由切换后背景色改变）
    const observer = new MutationObserver((mutations) => {
      const shouldRefreshTheme = mutations.some((mutation) => {
        if (mutation.type === 'attributes') {
          return mutation.target === document.body || mutation.target === document.documentElement;
        }
        return mutation.type === 'childList';
      });

      if (shouldRefreshTheme) {
        scheduleApplyTheme();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // 初始应用主题
    applyTheme();
  }

  if (document.body) {
    startThemeObserver();
  } else {
    document.addEventListener('DOMContentLoaded', startThemeObserver, { once: true });
  }
})();
