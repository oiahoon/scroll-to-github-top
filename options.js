'use strict';

const defaultSettings = {
  themePreset: 'default',
  barcodePreview: 'spotlight',
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
  barcodePreview: document.getElementById('barcodePreview'),
  barcodePreviewHint: document.getElementById('barcodePreviewHint'),
  barcodePreviewRow: document.getElementById('barcodePreviewRow'),
  standardInteractionRow: document.getElementById('standardInteractionRow'),
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
let isSaving = false;
let editRevision = 0;

const expandModeDescriptions = {
  hover: '悬停预览目录，点击浮标可固定展开；移开后自动收起。',
  click: '点击浮标打开或关闭目录，适合稳定停留。',
  press: '短按回到顶部，长按展开目录。'
};

const navigationTypeDescriptions = {
  default: '完整目录，适合文档站和技术长文。',
  barcode: '用低透明度的边缘短横线表达长文结构，再选择按需出现的标题预览。'
};

const barcodePreviewDescriptions = {
  spotlight: '目标标题与前后各一项，适合附近定位。原滚轮与聚光灯已合并，移开收起。',
  gpt: '按关键词筛选全文标题，适合查找长文中的特定内容；方向键选结果，Enter 跳转。',
  sspai: '展开后可固定在页边，适合反复对照文章结构；红色标记阅读位置，Esc 收起。'
};

function normalizeSettings(input = {}) {
  const normalized = { ...defaultSettings, ...input };
  if (input.themePreset === 'sspai') {
    normalized.themePreset = 'barcode';
    normalized.barcodePreview = 'spotlight';
  } else if (input.themePreset === 'glimmer') {
    normalized.themePreset = 'barcode';
    normalized.barcodePreview = 'spotlight';
  }
  if (!['default', 'barcode'].includes(normalized.themePreset)) {
    normalized.themePreset = defaultSettings.themePreset;
  }
  // Legacy wheel preferences now use the shared, static nearby preview.
  if (normalized.barcodePreview === 'wheel') normalized.barcodePreview = 'spotlight';
  if (!['spotlight', 'gpt', 'sspai'].includes(normalized.barcodePreview)) {
    normalized.barcodePreview = defaultSettings.barcodePreview;
  }
  return normalized;
}

function normalizeDomains(input) {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function renderStatus(message, persistent = false) {
  clearTimeout(statusHideTimer);
  clearTimeout(statusClearTimer);
  elements.status.textContent = message;
  elements.status.classList.add('visible');
  if (persistent) return;
  statusHideTimer = setTimeout(() => {
    elements.status.classList.remove('visible');
    // 等待淡出动画结束后再清空文字（0.2s）
    statusClearTimer = setTimeout(() => {
      elements.status.textContent = '';
    }, 200);
  }, 1500);
}

function setDirtyState(isDirty) {
  if (isDirty) editRevision += 1;
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
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime?.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function bindForm(settings) {
  const normalized = normalizeSettings(settings);
  elements.themePreset.value = normalized.themePreset;
  elements.barcodePreview.value = normalized.barcodePreview;
  elements.expandMode.value = normalized.expandMode;
  elements.minHeaders.value = normalized.minHeaders;
  elements.showAfterScrollScreens.value = normalized.showAfterScrollScreens;
  elements.position.value = normalized.position;
  elements.disabledDomains.value = (normalized.disabledDomains || []).join(', ');
  elements.avoidExistingWidgets.checked = normalized.avoidExistingWidgets;
  elements.forceShow.checked = normalized.forceShow;
  syncThemePreset();
  syncExpandModeHint();
  syncForceShow();
  syncSegmentedControls();
}

function syncExpandModeHint() {
  elements.expandModeHint.textContent = expandModeDescriptions[elements.expandMode.value] || expandModeDescriptions.hover;
}

function syncThemePreset() {
  const isBarcode = elements.themePreset.value === 'barcode';
  elements.themePresetHint.textContent = navigationTypeDescriptions[elements.themePreset.value] || navigationTypeDescriptions.default;
  elements.barcodePreviewRow.hidden = !isBarcode;
  elements.standardInteractionRow.hidden = isBarcode;
  elements.barcodePreview.disabled = !isBarcode;
  elements.expandMode.disabled = isBarcode;
  elements.barcodePreviewHint.textContent = barcodePreviewDescriptions[elements.barcodePreview.value] || barcodePreviewDescriptions.spotlight;
  syncExpandModeHint();
  syncSegmentedControl('themePreset');
  syncSegmentedControl('barcodePreview');
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
  if (isSaving) return;
  for (const field of [elements.minHeaders, elements.showAfterScrollScreens]) {
    if (!field.reportValidity()) return;
  }
  const payload = {
    themePreset: elements.themePreset.value,
    barcodePreview: elements.barcodePreview.value,
    expandMode: elements.expandMode.value,
    minHeaders: Number(elements.minHeaders.value),
    showAfterScrollScreens: Number(elements.showAfterScrollScreens.value),
    position: elements.position.value,
    disabledDomains: normalizeDomains(elements.disabledDomains.value),
    avoidExistingWidgets: elements.avoidExistingWidgets.checked,
    forceShow: elements.forceShow.checked
  };

  isSaving = true;
  const revision = editRevision;
  elements.save.disabled = true;
  elements.save.textContent = '保存中…';
  try {
    await saveSettings(payload);
    setDirtyState(editRevision !== revision);
    renderStatus(editRevision === revision ? '设置已保存，刷新文章页后生效' : '已保存，另有新更改待保存');
  } catch {
    setDirtyState(true);
    renderStatus('保存失败，请重试。更改仍保留。', true);
  } finally {
    isSaving = false;
  }
});

elements.forceShow.addEventListener('change', syncForceShow);
elements.themePreset.addEventListener('change', syncThemePreset);
elements.barcodePreview.addEventListener('change', () => {
  elements.barcodePreviewHint.textContent = barcodePreviewDescriptions[elements.barcodePreview.value] || barcodePreviewDescriptions.spotlight;
  syncSegmentedControl('barcodePreview');
});
elements.expandMode.addEventListener('change', () => {
  syncExpandModeHint();
  syncSegmentedControl('expandMode');
});
elements.position.addEventListener('change', () => syncSegmentedControl('position'));

[
  elements.themePreset,
  elements.barcodePreview,
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
