'use strict';

const defaultSettings = {
  themePreset: 'default',
  expandMode: 'hover',
  minHeaders: 3,
  showAfterScrollScreens: 1,
  position: 'right',
  disabledDomains: [],
  avoidExistingWidgets: true,
  forceShow: false
};

const elements = {
  themePreset: document.getElementById('themePreset'),
  themePresetHint: document.getElementById('themePresetHint'),
  expandMode: document.getElementById('expandMode'),
  expandModeHint: document.getElementById('expandModeHint'),
  minHeaders: document.getElementById('minHeaders'),
  showAfterScrollScreens: document.getElementById('showAfterScrollScreens'),
  position: document.getElementById('position'),
  disabledDomains: document.getElementById('disabledDomains'),
  avoidExistingWidgets: document.getElementById('avoidExistingWidgets'),
  forceShow: document.getElementById('forceShow'),
  save: document.getElementById('save'),
  status: document.getElementById('status')
};

const expandModeDescriptions = {
  hover: '推荐给桌面端阅读场景。悬停可预览目录，点击浮标可固定展开；移开后自动收起。',
  click: '适合希望目录稳定停留的场景。点击浮标打开或关闭目录。',
  press: '高级模式。短按直接回到顶部，长按浮标后展开目录。'
};

const themePresetDescriptions = {
  default: '标准目录面板：适合文档站、博客和技术内容页面，信息完整、易理解。',
  sspai: '阅读进度目录：适合沉浸式长文阅读，使用低侵扰线状目录和独立回顶按钮。'
};

function normalizeDomains(input) {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function renderStatus(message) {
  elements.status.textContent = message;
  elements.status.classList.add('visible');
  setTimeout(() => {
    elements.status.classList.remove('visible');
    // 等待淡出动画结束后再清空文字（0.2s）
    setTimeout(() => {
      elements.status.textContent = '';
    }, 200);
  }, 1500);
}

function loadSettings() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    return Promise.resolve({ ...defaultSettings });
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (items) => {
      resolve(items || { ...defaultSettings });
    });
  });
}

function saveSettings(data) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    chrome.storage.sync.set(data, resolve);
  });
}

function bindForm(settings) {
  elements.themePreset.value = settings.themePreset || defaultSettings.themePreset;
  elements.expandMode.value = settings.expandMode || defaultSettings.expandMode;
  elements.minHeaders.value = settings.minHeaders ?? defaultSettings.minHeaders;
  elements.showAfterScrollScreens.value = settings.showAfterScrollScreens ?? defaultSettings.showAfterScrollScreens;
  elements.position.value = settings.position || defaultSettings.position;
  elements.disabledDomains.value = (settings.disabledDomains || []).join(', ');
  elements.avoidExistingWidgets.checked = settings.avoidExistingWidgets ?? defaultSettings.avoidExistingWidgets;
  elements.forceShow.checked = settings.forceShow ?? defaultSettings.forceShow;
  syncThemePreset();
  syncExpandModeHint();
  syncForceShow();
}

function syncExpandModeHint() {
  if (elements.themePreset.value === 'sspai') {
    elements.expandModeHint.textContent = '阅读进度目录固定为悬停展开；短横线靠近正文，标题在外侧展开。';
    return;
  }
  elements.expandModeHint.textContent = expandModeDescriptions[elements.expandMode.value] || expandModeDescriptions.hover;
}

function syncThemePreset() {
  const isSspai = elements.themePreset.value === 'sspai';
  elements.themePresetHint.textContent = themePresetDescriptions[elements.themePreset.value] || themePresetDescriptions.default;
  elements.expandMode.disabled = isSspai;
  syncExpandModeHint();
}

function syncForceShow() {
  if (elements.forceShow.checked) {
    elements.avoidExistingWidgets.checked = false;
    elements.avoidExistingWidgets.disabled = true;
  } else {
    elements.avoidExistingWidgets.disabled = false;
  }
}

elements.save.addEventListener('click', async () => {
  const payload = {
    themePreset: elements.themePreset.value,
    expandMode: elements.expandMode.value,
    minHeaders: Number(elements.minHeaders.value),
    showAfterScrollScreens: Number(elements.showAfterScrollScreens.value),
    position: elements.position.value,
    disabledDomains: normalizeDomains(elements.disabledDomains.value),
    avoidExistingWidgets: elements.avoidExistingWidgets.checked,
    forceShow: elements.forceShow.checked
  };

  await saveSettings(payload);
  renderStatus('已保存');
});

elements.forceShow.addEventListener('change', syncForceShow);
elements.themePreset.addEventListener('change', syncThemePreset);
elements.expandMode.addEventListener('change', syncExpandModeHint);

loadSettings().then(bindForm);
