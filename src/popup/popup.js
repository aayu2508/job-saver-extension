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
  toastEl.className = '';
  toastEl.textContent = msg;
  toastEl.style.display = 'block'; // ensure visible
  toastEl.classList.add(type === 'success' ? 'success' : 'error');
}

function clearToast() {
  toastEl.className = '';
  toastEl.style.display = 'none';
  toastEl.textContent = '';
}

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove('hidden');
}

function clearError() {
  errorEl.textContent = '';
  errorEl.classList.add('hidden');
}

scrapeBtn.addEventListener('click', async () => {
  clearError();
  clearToast();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showError('No active tab found.');
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeJob' });

    if (!response?.success) {
      showError(response?.error || 'Failed to scrape this page.');
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
    
    console.log("Data received from content script:", data); 
    // Update UI
    companyEl.textContent = company || '—';
    positionEl.textContent = position || '—';
    locationEl.textContent = location || '—';

    resultEl.classList.remove('hidden');
    saveBtn.classList.remove('hidden');

    lastScraped = { company, position, location, applicationDate, metadata: data?.metadata };

    showToast('success', 'Scrape successful.');
  } catch (e) {
    console.error(e);
    showError('Could not scrape this page.');
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

    // Background listener uses your own message contract
    const res = await chrome.runtime.sendMessage({
      action: 'saveJob',
      job: lastScraped
    });

    if (res?.ok) {
      showToast('success', 'Saved to Notion!!');
    } else {
      showToast('error', res?.message || 'Failed to save to Notion.');
    }
  } catch (e) {
    console.error(e);
    showToast('error', 'Error saving to Notion.');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save to Notion';
  }
});
