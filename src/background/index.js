import { saveJobToNotion } from './notion.js';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  if (request?.action === 'jobPageDetected') {
    console.log('Job page detected:', request.platform, request.url);
    // Optionally set a badge or notification
    sendResponse({ received: true });
    return true;
  }

  if (request?.action === 'saveJob' && request?.job) {
    saveJobToNotion(request.job)
      .then((page) => sendResponse({ ok: true, pageId: page.id }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true; // keep the message channel open for async response
  }

  sendResponse({ received: true });
  return true;
});