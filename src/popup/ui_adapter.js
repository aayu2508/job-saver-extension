// ui_adapter.js (light cleanup, same behavior)
(function () {
  const rootReady = document.readyState === 'loading'
    ? new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }))
    : Promise.resolve();

  rootReady.then(() => {

    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }

    const scrapeBtn  = document.getElementById('scrapeBtn');
    const saveBtn    = document.getElementById('saveNotionBtn');
    const resultEl   = document.getElementById('result');
    const companyEl  = document.getElementById('company');
    const positionEl = document.getElementById('position');
    const locationEl = document.getElementById('location');
    const toastEl    = document.getElementById('toast');

    // Capture initial labels so we don't hard-code strings
    const labels = {
      scrapeIdle:  scrapeBtn?.dataset.labelIdle     || 'Scrape Job',
      scrapeBusy:  scrapeBtn?.dataset.labelLoading  || 'Scraping…',
      saveIdle:    saveBtn?.dataset.labelIdle       || 'Save to Notion',
      saveBusy:    saveBtn?.dataset.labelLoading    || 'Saving…',
    };

    // Toast timer
    let toastTimer = null;

    function setScrapingState(isLoading) {
      if (!scrapeBtn) return;
      scrapeBtn.disabled = !!isLoading;
      scrapeBtn.classList.toggle('loading', !!isLoading);

      const icon = scrapeBtn.querySelector('.btn-icon');
      const text = scrapeBtn.querySelector('.btn-text');

      if (icon) icon.setAttribute('data-lucide', isLoading ? 'clock' : 'search');
      if (text) text.textContent = isLoading ? labels.scrapeBusy : labels.scrapeIdle;
      
      if (window.lucide?.createIcons) window.lucide.createIcons();
    }

    function setSavingState(isLoading) {
      if (!saveBtn) return;
      saveBtn.disabled = !!isLoading;
      saveBtn.classList.toggle('loading', !!isLoading);

      const icon = saveBtn.querySelector('.btn-icon');
      const text = saveBtn.querySelector('.btn-text');

      if (icon) icon.setAttribute('data-lucide', isLoading ? 'clock' : 'database');
      if (text) text.textContent = isLoading ? labels.saveBusy : labels.saveIdle;
      
      if (window.lucide?.createIcons) window.lucide.createIcons();
    }

    function showCard() {
      resultEl?.classList.remove('hidden');
      saveBtn?.classList.remove('hidden');
    }

    function showToast(msg, type = 'success') {
      if (!toastEl) return;
      toastEl.classList.remove('success', 'error');
      toastEl.textContent = msg;
      toastEl.style.display = 'block';
      toastEl.classList.add(type === 'success' ? 'success' : 'error');

      // Auto-hide
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toastEl.classList.remove('success', 'error');
        toastEl.style.display = 'none';
        toastEl.textContent = '';
      }, 3000);
    }

    // Event-driven UI (popup.js dispatches these)
    document.addEventListener('ui:scrape:start',   () => setScrapingState(true));
    document.addEventListener('ui:scrape:success', (e) => {
      setScrapingState(false);
      const { company, position, location } = e.detail || {};
      if (companyEl)  companyEl.textContent  = company  || '—';
      if (positionEl) positionEl.textContent = position || '—';
      if (locationEl) locationEl.textContent = location || '—';
      showCard();
      showToast('Scrape successful.', 'success');
    });
    document.addEventListener('ui:scrape:error', (e) => {
      setScrapingState(false);
      showToast(e.detail?.message || 'Failed to scrape this page.', 'error');
    });

    document.addEventListener('ui:save:start',   () => setSavingState(true));
    document.addEventListener('ui:save:success', () => {
      setSavingState(false);
      showToast('Saved to Notion successfully.', 'success');
    });
    document.addEventListener('ui:save:error',   (e) => {
      setSavingState(false);
      showToast(e.detail?.message || 'Failed to save to Notion.', 'error');
    });
  });
})();
