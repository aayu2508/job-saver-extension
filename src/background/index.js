console.log('Background service worker loaded');

// Listen for messages from content scripts
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log('Background received message:', request);
  
//   if (request.action === 'jobPageDetected') {
//     console.log('Job page detected:', request.platform, request.url);
//     // Could show a badge or notification here later
//   }
  
//   // Always send a response to avoid connection errors
//   sendResponse({ received: true });
//   return true;
// });