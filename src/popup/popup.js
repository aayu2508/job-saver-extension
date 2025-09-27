// popup.js
const scrapeBtn = document.getElementById('scrapeBtn');
const saveBtn = document.getElementById('saveNotionBtn');
const resultEl = document.getElementById('result');
const errorEl = document.getElementById('error');
const toastEl = document.getElementById('toast');

const companyEl = document.getElementById('company');
const positionEl = document.getElementById('position');
const locationEl = document.getElementById('location');

let lastScraped = null; // holds the latest scraped job to save

function showToast(type, msg) {
  if (!toastEl) return;
  toastEl.className = '';
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  toastEl.classList.add(type === 'success' ? 'success' : 'error');
}

function clearToast() {
  if (!toastEl) return;
  toastEl.className = '';
  toastEl.style.display = 'none';
  toastEl.textContent = '';
}

function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError() {
  if (!errorEl) return;
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

scrapeBtn.addEventListener('click', async () => {
  clearError();
  clearToast();
  document.dispatchEvent(new CustomEvent('ui:scrape:start'));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      const message = 'No active tab found.';
      showError(message);
      document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeJob' });

    if (!response?.success) {
      const message = response?.error || 'Failed to scrape this page.';
      showError(message);
      document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
      return;
    }

    // Your content returns: { success: true, data: { ...jobData, metadata } }
    const { data } = response || {};

    const company =
      data?.companyName ||
      data?.company ||
      data?.employer ||
      '';
    const position =
      data?.position ||
      data?.title ||
      '';
    const location =
      data?.location ||
      data?.jobLocation ||
      '';
    const applicationDate = data?.applicationDate;

    console.log('Data received from content script:', data);

    // Update UI
    companyEl.textContent = company || '—';
    positionEl.textContent = position || '—';
    locationEl.textContent = location || '—';

    resultEl.classList.remove('hidden');
    saveBtn.classList.remove('hidden');

    lastScraped = { company, position, location, applicationDate, metadata: data?.metadata };

    showToast('success', 'Scrape successful.');
    document.dispatchEvent(new CustomEvent('ui:scrape:success', { detail: { company, position, location } }));
  } catch (e) {
    console.error(e);
    const message = 'Could not scrape this page.';
    showError(message);
    document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
  }
});

saveBtn.addEventListener('click', async () => {
  clearError();
  clearToast();

  if (!lastScraped) {
    showError('Please scrape a job first.');
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    document.dispatchEvent(new CustomEvent('ui:save:start'));

    // Background listener uses your message contract
    const res = await chrome.runtime.sendMessage({
      action: 'saveJob',
      job: lastScraped
    });

    if (res?.ok) {
      showToast('success', 'Saved to Notion!!');
      document.dispatchEvent(new CustomEvent('ui:save:success'));
    } else {
      const message = res?.message || 'Failed to save to Notion.';
      showToast('error', message);
      document.dispatchEvent(new CustomEvent('ui:save:error', { detail: { message } }));
    }
  } catch (e) {
    console.error(e);
    const message = 'Error saving to Notion.';
    showToast('error', message);
    document.dispatchEvent(new CustomEvent('ui:save:error', { detail: { message } }));
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save to Notion';
  }
});
