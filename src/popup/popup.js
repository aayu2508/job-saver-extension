// popup.js
const scrapeBtn = document.getElementById('scrapeBtn');
const saveBtn = document.getElementById('saveNotionBtn');

let lastScraped = null;

scrapeBtn.addEventListener('click', async () => {
  document.dispatchEvent(new CustomEvent('ui:scrape:start'));

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      const message = 'No active tab found.';
      document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeJob' });

    if (!response?.success) {
      const message = response?.error || 'Failed to scrape this page.';
      document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
      return;
    }

    const { data } = response || {};
    const company = data?.companyName || data?.company || data?.employer || '';
    const position = data?.position || data?.title || '';
    const location = data?.location || data?.jobLocation || '';
    const applicationDate = data?.applicationDate;

    console.log('Data received from content script:', data);

    lastScraped = { company, position, location, applicationDate, metadata: data?.metadata };

    document.dispatchEvent(new CustomEvent('ui:scrape:success', { detail: { company, position, location } }));
  } catch (e) {
    console.error(e);
    const message = 'Could not scrape this page.';
    document.dispatchEvent(new CustomEvent('ui:scrape:error', { detail: { message } }));
  }
});

saveBtn.addEventListener('click', async () => {
  if (!lastScraped) {
    document.dispatchEvent(new CustomEvent('ui:save:error', { detail: { message: 'Please scrape a job first.' } }));
    return;
  }

  try {
    document.dispatchEvent(new CustomEvent('ui:save:start'));

    const res = await chrome.runtime.sendMessage({
      action: 'saveJob',
      job: lastScraped
    });

    if (res?.ok) {
      document.dispatchEvent(new CustomEvent('ui:save:success'));
    } else {
      const message = res?.message || 'Failed to save to Notion.';
      document.dispatchEvent(new CustomEvent('ui:save:error', { detail: { message } }));
    }
  } catch (e) {
    console.error(e);
    const message = 'Error saving to Notion.';
    document.dispatchEvent(new CustomEvent('ui:save:error', { detail: { message } }));
  }
});
