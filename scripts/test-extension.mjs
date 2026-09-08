import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { chromium } from 'playwright';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'manifest.json')));
assert.deepEqual(manifest.permissions, ['storage']);
assert.equal(manifest.host_permissions, undefined);
assert.deepEqual(manifest.content_scripts[0].matches, ['http://*/*', 'https://*/*']);
const temp = await mkdtemp(join(tmpdir(), 'smart-toc-regression-'));
const extension = join(temp, 'extension');
execFileSync('unzip', ['-q', join(root, `dist/smart-toc-scroll-${manifest.version}.zip`), '-d', extension]);
const key = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({ type: 'spki', format: 'der' });
manifest.key = key.toString('base64');
const id = createHash('sha256').update(key).digest('hex').slice(0, 32).replace(/[0-9a-f]/g, c => String.fromCharCode(97 + parseInt(c, 16)));
await writeFile(join(extension, 'manifest.json'), JSON.stringify(manifest));
const article = `<main>${Array.from({ length: 40 }, (_, i) => `<section style="height:300px"><h2${i === 0 ? ' id="original"' : ''}>章节 ${i} ${i % 2 ? 'searchable' : '内容'}</h2><p>Reading content</p></section>`).join('')}</main>`;
const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><title>Extension regression</title><style>body{margin:0;background:#fff;color:#222}main{width:650px;margin:auto}.toc-item a{font-size:21px;padding:2px;display:inline}.toc-icon{position:static;width:37px}</style><div class="toc-icon">Host</div><ul><li class="toc-item"><a href="#original">Host link</a></li></ul>${article}`);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`;
let context;
try {
  context = await chromium.launchPersistentContext(join(temp, 'profile'), {
    channel: 'chromium', headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    ignoreDefaultArgs: ['--disable-back-forward-cache'],
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce'
  });
  const options = await context.newPage();
  await options.goto(`chrome-extension://${id}/options.html`);
  await options.locator('#save').waitFor();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  options.on('pageerror', error => errors.push(error.message));
  await options.locator('#minHeaders').fill('4');
  await options.locator('#save').click();
  await options.waitForFunction(() => document.querySelector('#status').textContent.includes('设置已保存'));
  assert.equal(await options.evaluate(async () => (await chrome.storage.sync.get('minHeaders')).minHeaders), 4);
  for (const mode of ['default', 'spotlight', 'gpt', 'sspai']) {
    await options.evaluate(async mode => {
      await chrome.storage.sync.set({ themePreset: mode === 'default' ? 'default' : 'barcode', barcodePreview: mode === 'default' ? 'spotlight' : mode, showAfterScrollScreens: 0, forceShow: true, minHeaders: 3, disabledDomains: [] });
    }, mode);
    await page.goto(url);
    await page.locator('#github-toc').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('#github-toc .toc-item').length === 40);
    assert.equal(await page.locator('main h2[id]').count(), 1, 'host IDs preserved');
    assert.equal(await page.locator('body > ul a').evaluate(e => getComputedStyle(e).fontSize), '21px');
    assert.equal(await page.locator('body > .toc-icon').evaluate(e => getComputedStyle(e).position), 'static');
    if (mode === 'default') await page.locator('#github-toc .toc-icon').click();
    else await page.locator('#github-toc .toc-rail-link').first().focus();
    await page.screenshot({ path: join(temp, `${mode}.png`) });
    if (mode === 'gpt') {
      const search = page.locator('.toc-gpt-search');
      await search.fill('searchable');
      assert.equal(await page.locator('.toc-gpt-preview-row:visible').count(), 20);
      await search.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    } else {
      await page.locator('#github-toc .toc-item a').nth(3).evaluate(e => e.click());
    }
    await page.waitForFunction(() => scrollY > 400);
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      history.pushState({}, '', '/next');
      document.querySelector('main').outerHTML = '<main><h2>New One</h2><h2>New Two</h2><h2>New Three</h2></main>';
    });
    await page.waitForFunction(() => document.querySelectorAll('#github-toc .toc-item').length === 3);
    await page.locator('main h2').first().evaluate(e => { e.textContent = 'Updated Heading'; });
    await page.waitForFunction(() => document.querySelector('#github-toc').textContent.includes('Updated Heading'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: join(temp, `${mode}-narrow.png`) });
    await page.setViewportSize({ width: 1280, height: 800 });
    console.log(`PASS ${mode}: native extension, host isolation, jump, SPA, heading updates, narrow viewport`);
  }
  await options.evaluate(() => chrome.storage.sync.set({ themePreset: 'default', forceShow: false, avoidExistingWidgets: true, showAfterScrollScreens: 0 }));
  await page.goto(url);
  await page.locator('#github-toc').waitFor();
  await page.evaluate(() => { window.restoreMarker = 'retained'; });
  await page.goto(`${url}/other`);
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForFunction(() => document.querySelectorAll('#github-toc .toc-item').length === 40);
  assert.equal(await page.evaluate(() => window.restoreMarker === 'retained'), true, 'BFCache retains and restores the page');
  console.log('PASS back/forward recovery with actual BFCache retention');
  await options.evaluate(() => chrome.storage.sync.set({ forceShow: false, avoidExistingWidgets: true }));
  // Retest initial skip on a page whose navigation exists before script injection.
  await page.route(`${url}/skip`, route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: `<!doctype html><title>Skip fixture</title><nav class="toc-sidebar" style="position:fixed;left:0;top:100px;width:180px;height:240px"><a href="#a">A</a><a href="#b">B</a><a href="#c">C</a></nav>${article}` }));
  await page.goto(`${url}/skip`);
  await page.waitForFunction(() => document.documentElement.hasAttribute('data-smart-toc-skip-reason'));
  assert.equal(await page.locator('#github-toc').count(), 0);
  await page.evaluate(() => { document.querySelector('nav').remove(); history.pushState({}, '', '/recovered'); document.querySelector('h2').textContent = 'Recovered article'; });
  await page.locator('#github-toc').waitFor();
  console.log('PASS skip-to-article SPA recovery and settings save');
  await options.evaluate(() => chrome.storage.sync.set({ disabledDomains: ['127.0.0.1'] }));
  await page.goto(url);
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#github-toc').count(), 0);
  assert.equal(await page.locator('body > ul a').evaluate(e => getComputedStyle(e).fontSize), '21px');
  assert.deepEqual(errors, []);
  console.log(`PASS disabled domain and console health. Screenshots: ${temp}`);
} finally {
  await context?.close();
  server.close();
}
