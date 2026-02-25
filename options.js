'use strict';

const defaultSettings = {
  expandMode: 'press',
  minHeaders: 3,
  showAfterScrollScreens: 1,
  position: 'right',
  disabledDomains: [],
  avoidExistingWidgets: true,
  forceShow: false
};

const elements = {
  expandMode: document.getElementById('expandMode'),
  minHeaders: document.getElementById('minHeaders'),
  showAfterScrollScreens: document.getElementById('showAfterScrollScreens'),
  position: document.getElementById('position'),
  disabledDomains: document.getElementById('disabledDomains'),
  avoidExistingWidgets: document.getElementById('avoidExistingWidgets'),
  forceShow: document.getElementById('forceShow'),
  save: document.getElementById('save'),
  status: document.getElementById('status')
};

function normalizeDomains(input) {
  return input
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function renderStatus(message) {
  elements.status.textContent = message;
  setTimeout(() => {
    elements.status.textContent = '';
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
  elements.expandMode.value = settings.expandMode || defaultSettings.expandMode;
  elements.minHeaders.value = settings.minHeaders ?? defaultSettings.minHeaders;
  elements.showAfterScrollScreens.value = settings.showAfterScrollScreens ?? defaultSettings.showAfterScrollScreens;
  elements.position.value = settings.position || defaultSettings.position;
  elements.disabledDomains.value = (settings.disabledDomains || []).join(', ');
  elements.avoidExistingWidgets.checked = settings.avoidExistingWidgets ?? defaultSettings.avoidExistingWidgets;
  elements.forceShow.checked = settings.forceShow ?? defaultSettings.forceShow;
  syncForceShow();
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

loadSettings().then(bindForm);
