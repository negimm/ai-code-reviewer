// background.js - ONLY handles sidepanel (NO AI processing)

console.log('🚀 Background service worker starting...');

chrome.runtime.onInstalled.addListener(async () => {
  console.log('✅ AI Code Reviewer installed');
  await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  console.log('✅ Sidepanel configured to open on icon click');
});

// Handle messages from content script (ONLY sidepanel opening)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received:', request.action);
  
  if (request.action === 'openSidePanel') {
    if (sender.tab?.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId })
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
    } else {
      sendResponse({ success: false, error: 'No window ID' });
    }
    return true;
  }
  
  sendResponse({ success: false, error: 'Unknown action' });
});

console.log('✅ Background service worker initialized');
