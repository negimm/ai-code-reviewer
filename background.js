// background.js - Enhanced Service Worker with session isolation

import { AIManager } from './utils/ai-manager.js';

// Session map for per-tab isolation
const sessionMap = new Map();

// Get or create AIManager instance for specific tab
function getOrCreateAIManager(tabId) {
  if (!sessionMap.has(tabId)) {
    sessionMap.set(tabId, new AIManager());
  }
  return sessionMap.get(tabId);
}

chrome.runtime.onInstalled.addListener(async () => {
  console.log('🚀 AI Code Reviewer installed');
  
  try {
    // Create a temporary manager for capability check
    const tempManager = new AIManager();
    const capabilities = await tempManager.checkCapabilities();
    await chrome.storage.local.set({ capabilities });
    console.log('✅ Capabilities stored:', capabilities);
    tempManager.cleanup();
  } catch (error) {
    console.error('❌ Installation error:', error);
  }
});

// Enhanced message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received:', request.action, 'from tab:', sender.tab?.id);
  
  handleMessageAsync(request, sender)
    .then(response => {
      console.log('✅ Response sent:', response.success);
      sendResponse(response);
    })
    .catch(error => {
      console.error('❌ Handler error:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    });
  
  return true; // Keep message channel open
});

async function handleMessageAsync(request, sender) {
  const tabId = sender.tab?.id || 'global';
  const aiManager = tabId !== 'global' 
    ? getOrCreateAIManager(tabId)
    : new AIManager();

  try {
    switch (request.action) {
      case 'checkAICapabilities':
        const capabilities = await aiManager.checkCapabilities();
        return { success: true, capabilities };

      case 'reviewCode':
        if (!request.code || request.code.trim().length < 10) {
          throw new Error('Code is too short or empty');
        }
        const review = await aiManager.reviewCode(request.code, request.options || {});
        return { success: true, review: review.raw };

      case 'generateDocs':
        if (!request.code || request.code.trim().length < 10) {
          throw new Error('Code is too short or empty');
        }
        const docs = await aiManager.generateDocumentation(request.code, request.options || {});
        return { success: true, documentation: docs };

      case 'refactorCode':
        if (!request.code || request.code.trim().length < 10) {
          throw new Error('Code is too short or empty');
        }
        const refactored = await aiManager.refactorCode(request.code, request.options || {});
        return { success: true, refactored };

      case 'summarizePR':
        if (!request.content) {
          throw new Error('No content to summarize');
        }
        const summary = await aiManager.summarizePR(request.content, request.options || {});
        return { success: true, summary };

      case 'translateComment':
        if (!request.text) {
          throw new Error('No text to translate');
        }
        const translated = await aiManager.translateComment(
          request.text,
          request.targetLanguage || 'es',
          request.sourceLanguage || 'en'
        );
        return { success: true, translated };

      case 'openSidePanel':
        if (sender.tab?.id) {
          await chrome.sidePanel.open({ tabId: sender.tab.id });
          return { success: true };
        }
        throw new Error('No tab ID available');

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }
  } catch (error) {
    console.error(`❌ Action '${request.action}' failed:`, error);
    throw error;
  } finally {
    // Cleanup for global manager
    if (tabId === 'global') {
      aiManager.cleanup();
    }
  }
}

// Cleanup on tab close
chrome.tabs.onRemoved.addListener((tabId) => {
  const manager = sessionMap.get(tabId);
  if (manager) {
    console.log(`🧹 Cleaning up session for tab ${tabId}`);
    manager.cleanup();
    sessionMap.delete(tabId);
  }
});

// Periodic cleanup for stale sessions (every 30 minutes)
setInterval(() => {
  chrome.tabs.query({}, (tabs) => {
    const activeTabs = new Set(tabs.map(tab => tab.id));
    
    sessionMap.forEach((manager, tabId) => {
      if (!activeTabs.has(tabId)) {
        console.log(`🧹 Removing stale session for tab ${tabId}`);
        manager.cleanup();
        sessionMap.delete(tabId);
      }
    });
  });
}, 30 * 60 * 1000);

console.log('✅ Background service worker initialized');
