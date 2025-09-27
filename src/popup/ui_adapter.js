// ui_adapter.js
(function () {
  const scrapeBtn = document.getElementById('scrapeBtn');
  const saveBtn = document.getElementById('saveNotionBtn');
  const resultEl = document.getElementById('result');
  const companyEl = document.getElementById('company');
  const positionEl = document.getElementById('position');
  const locationEl = document.getElementById('location');
  const toastEl = document.getElementById('toast');

  // this will render icons whenever we change data-lucide attributes.
  function reinitIcons() {
    if (typeof lucide !== 'undefined' && lucide?.createIcons) {
      try { lucide.createIcons(); } catch {}
    }
  }

  function setScrapingState(isLoading) {
    if (!scrapeBtn) return;
    scrapeBtn.disabled = !!isLoading;
    scrapeBtn.classList.toggle('loading', !!isLoading);

    const icon = scrapeBtn.querySelector('.btn-icon');
    const text = scrapeBtn.querySelector('.btn-text') || scrapeBtn;
    if (icon) icon.setAttribute('data-lucide', isLoading ? 'clock' : 'search');
    text.textContent = isLoading ? 'Scraping…' : 'Scrape Job';

    reinitIcons();
  }

  function setSavingState(isLoading) {
    if (!saveBtn) return;
    saveBtn.disabled = !!isLoading;
    saveBtn.classList.toggle('loading', !!isLoading);

    const icon = saveBtn.querySelector('.btn-icon');
    const text = saveBtn.querySelector('.btn-text') || saveBtn;
    if (icon) icon.setAttribute('data-lucide', isLoading ? 'clock' : 'database');
    text.textContent = isLoading ? 'Saving…' : 'Save to Notion';

    reinitIcons();
  }

  function showCard() {
    if (resultEl) resultEl.classList.remove('hidden');
    if (saveBtn) saveBtn.classList.remove('hidden');
  }

  function showToast(msg, type = 'success') {
    if (!toastEl) return;
    toastEl.className = '';
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    toastEl.classList.add(type === 'success' ? 'success' : 'error');
    // Auto-hide for nicer UX
    setTimeout(() => {
      toastEl.className = '';
      toastEl.style.display = 'none';
      toastEl.textContent = '';
    }, 3000);
  }

  // Event-driven UI (your popup.js dispatches these)
  document.addEventListener('ui:scrape:start', () => setScrapingState(true));

  document.addEventListener('ui:scrape:success', (e) => {
    setScrapingState(false);
    const { company, position, location } = e.detail || {};
    if (companyEl) companyEl.textContent = company || '—';
    if (positionEl) positionEl.textContent = position || '—';
    if (locationEl) locationEl.textContent = location || '—';
    showCard();
    showToast('Scrape successful.', 'success');
  });

  document.addEventListener('ui:scrape:error', (e) => {
    setScrapingState(false);
    showToast(e.detail?.message || 'Failed to scrape this page.', 'error');
  });

  document.addEventListener('ui:save:start', () => setSavingState(true));

  document.addEventListener('ui:save:success', () => {
    setSavingState(false);
    showToast('Saved to Notion!!', 'success');
  });

  document.addEventListener('ui:save:error', (e) => {
    setSavingState(false);
    showToast(e.detail?.message || 'Failed to save to Notion.', 'error');
  });
})();
