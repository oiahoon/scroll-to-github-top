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

const segmentedControls = Array.from(document.querySelectorAll('[data-control-for]'));
let statusHideTimer = null;
let statusClearTimer = null;

const expandModeDescriptions = {
  hover: '悬停预览目录，点击浮标可固定展开；移开后自动收起。',
  click: '点击浮标打开或关闭目录，适合稳定停留。',
  press: '短按回到顶部，长按展开目录。'
};

const themePresetDescriptions = {
  default: '完整目录，适合文档站和技术长文。',
  sspai: '线状进度目录，适合沉浸式长文阅读。'
};

function normalizeDomains(input) {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function renderStatus(message) {
  clearTimeout(statusHideTimer);
  clearTimeout(statusClearTimer);
  elements.status.textContent = message;
  elements.status.classList.add('visible');
  statusHideTimer = setTimeout(() => {
    elements.status.classList.remove('visible');
    // 等待淡出动画结束后再清空文字（0.2s）
    statusClearTimer = setTimeout(() => {
      elements.status.textContent = '';
    }, 200);
  }, 1500);
}

function setDirtyState(isDirty) {
  elements.save.disabled = !isDirty;
  elements.save.textContent = isDirty ? '保存更改' : '已保存';
  document.querySelector('.settings-panel')?.classList.toggle('has-unsaved-changes', isDirty);

  if (isDirty) {
    clearTimeout(statusHideTimer);
    clearTimeout(statusClearTimer);
    elements.status.classList.remove('visible');
    elements.status.textContent = '';
  }
}

function getControlElement(controlId) {
  return elements[controlId] || document.getElementById(controlId);
}

function syncSegmentedControl(controlId) {
  const source = getControlElement(controlId);
  const control = segmentedControls.find((item) => item.dataset.controlFor === controlId);
  if (!source || !control) return;

  const buttons = Array.from(control.querySelectorAll('button[data-value]'));
  buttons.forEach((button) => {
    const isActive = button.dataset.value === source.value;
    button.classList.remove('is-secondary-active');
    button.classList.toggle('is-active', isActive);
    button.disabled = source.disabled;
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function syncSegmentedControls() {
  segmentedControls.forEach((control) => syncSegmentedControl(control.dataset.controlFor));
}

function setupSegmentedControls() {
  segmentedControls.forEach((control) => {
    const source = getControlElement(control.dataset.controlFor);
    if (!source) return;

    control.querySelectorAll('button[data-value]').forEach((button) => {
      button.addEventListener('click', () => {
        if (source.disabled) return;
        source.value = button.dataset.value;
        source.dispatchEvent(new Event('change', { bubbles: true }));
        syncSegmentedControl(control.dataset.controlFor);
      });
    });
  });
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
  syncSegmentedControls();
}

function syncExpandModeHint() {
  if (elements.themePreset.value === 'sspai') {
    elements.expandModeHint.textContent = '阅读进度目录固定为悬停展开，标题在外侧预览。';
    return;
  }
  elements.expandModeHint.textContent = expandModeDescriptions[elements.expandMode.value] || expandModeDescriptions.hover;
}

function syncThemePreset() {
  const isSspai = elements.themePreset.value === 'sspai';
  elements.themePresetHint.textContent = themePresetDescriptions[elements.themePreset.value] || themePresetDescriptions.default;
  elements.expandMode.disabled = isSspai;
  elements.expandMode.closest('.setting-row')?.classList.toggle('is-locked', isSspai);
  syncExpandModeHint();
  syncSegmentedControl('themePreset');
  syncSegmentedControl('expandMode');
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
  setDirtyState(false);
  renderStatus('设置已保存');
});

elements.forceShow.addEventListener('change', syncForceShow);
elements.themePreset.addEventListener('change', syncThemePreset);
elements.expandMode.addEventListener('change', () => {
  syncExpandModeHint();
  syncSegmentedControl('expandMode');
});
elements.position.addEventListener('change', () => syncSegmentedControl('position'));

[
  elements.themePreset,
  elements.expandMode,
  elements.minHeaders,
  elements.showAfterScrollScreens,
  elements.position,
  elements.disabledDomains,
  elements.avoidExistingWidgets,
  elements.forceShow
].forEach((element) => {
  element.addEventListener('change', () => setDirtyState(true));
});

elements.minHeaders.addEventListener('input', () => setDirtyState(true));
elements.showAfterScrollScreens.addEventListener('input', () => setDirtyState(true));
elements.disabledDomains.addEventListener('input', () => setDirtyState(true));

setupSegmentedControls();

loadSettings().then((settings) => {
  bindForm(settings);
  setDirtyState(false);
});
