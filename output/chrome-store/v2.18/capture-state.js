// Reproduce the photographed state using the extension's actual controls.
// This fixture does not ship in the extension package.
if (new URLSearchParams(location.search).has('capture')) {
  const prepare = () => {
    const toc = document.querySelector('#github-toc');
    const links = toc?.querySelectorAll('.toc-item a');
    if (!links?.length) return setTimeout(prepare, 100);
    const mode = new URLSearchParams(location.search).get('mode');
    if (mode === 'standard') {
      toc.querySelector('.toc-icon').click();
    } else {
      links[Math.min(4, links.length - 1)].focus();
      setTimeout(() => {
        if (mode === 'sspai') toc.querySelector('.toc-sspai-pin').click();
        if (mode === 'gpt') {
          const search = document.querySelector('.toc-gpt-search');
          search.focus();
          search.value = '关键词';
          search.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 350);
    }
  };
  window.addEventListener('load', () => setTimeout(prepare, 500));
}
