// popup.js - COMPLETE with context validation

import { checkCapabilities, updateStatusDot } from './ui-utils.js';

console.log('=== POPUP SCRIPT LOADED ===');

// Context validation utility
function isContextValid() {
  return typeof chrome !== 'undefined' && chrome.runtime?.id;
}

async function sendMessageSafely(message) {
  if (!isContextValid()) {
    throw new Error('Extension context invalidated. Please close and reopen the popup.');
  }
  
  try {
    const response = await chrome.runtime.sendMessage(message);
    return response;
  } catch (error) {
    if (error.message.includes('Extension context invalidated') || 
        error.message.includes('message port closed')) {
      throw new Error('Extension was reloaded. Please close and reopen this popup.');
    }
    throw error;
  }
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Sanitize code input
function sanitizeCode(code) {
  const sanitized = code
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .slice(0, 10000);

  if (sanitized.trim().length < 10) {
    throw new Error('Code snippet too short (minimum 10 characters)');
  }

  return sanitized;
}

// UI Helper Functions
function showLoading(message) {
  const result = document.getElementById('result');
  if (result) {
    result.style.display = 'block';
    result.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; padding: 10px;">
        <div class="spinner"></div>
        <span>${message}</span>
      </div>
    `;
  }
}

function hideLoading() {
  const result = document.getElementById('result');
  if (result) {
    result.style.display = 'none';
  }
}

function showResult(message, type = 'info') {
  const result = document.getElementById('result');
  if (result) {
    result.style.display = 'block';
    result.className = type === 'error' ? 'error' : 'success';
    result.textContent = message;
  }
  console.log(`Result: ${message}`);
}

function disableButtons() {
  ['reviewBtn', 'docBtn', 'refactorBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
}

function enableButtons() {
  ['reviewBtn', 'docBtn', 'refactorBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = false;
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup DOM loaded');
  
  // Check context validity first
  if (!isContextValid()) {
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d32f2f;">
        <h3>⚠️ Extension Reloaded</h3>
        <p>Please close and reopen this popup.</p>
        <button onclick="window.close()" style="
          padding: 8px 16px;
          background: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    return;
  }
  
  try {
    const caps = await checkCapabilities();
    if (caps) {
      updateStatusDot('promptStatus', caps.prompt);
      updateStatusDot('writerStatus', caps.writer);
      updateStatusDot('rewriterStatus', caps.rewriter);
      console.log('Capabilities:', caps);
    }

    await loadSelectedText();

    const reviewBtn = document.getElementById('reviewBtn');
    const docBtn = document.getElementById('docBtn');
    const refactorBtn = document.getElementById('refactorBtn');
    const clearBtn = document.getElementById('clearBtn');

    if (reviewBtn) reviewBtn.addEventListener('click', debounce(reviewCode, 1000));
    if (docBtn) docBtn.addEventListener('click', debounce(generateDocs, 1000));
    if (refactorBtn) refactorBtn.addEventListener('click', debounce(refactorCode, 1000));
    if (clearBtn) clearBtn.addEventListener('click', clearAll);

  } catch (error) {
    console.error('Initialization error:', error);
    showResult(`Initialization error: ${error.message}`, 'error');
  }
});

async function loadSelectedText() {
  console.log('Loading selected text...');
  try {
    if (!isContextValid()) return;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab || !tab.id) {
      console.warn('No active tab');
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString().trim()
    });

    const selectedText = results?.[0]?.result || '';
    const textarea = document.getElementById('codeInput');
    
    if (textarea && selectedText) {
      textarea.value = selectedText;
      showResult(`✅ Loaded ${selectedText.length} characters`);
      console.log(`Loaded ${selectedText.length} chars`);
    } else {
      showResult('💡 Enter code below or select text on page');
    }

  } catch (error) {
    console.error('Error loading selection:', error);
    showResult('ℹ️ Enter code below to review');
  }
}

async function reviewCode() {
  const codeInput = document.getElementById('codeInput');
  const code = codeInput?.value?.trim();

  console.log('Review clicked, code length:', code?.length);

  if (!code || code.length < 10) {
    showResult('⚠️ Please enter at least 10 characters of code', 'error');
    return;
  }

  try {
    const sanitizedCode = sanitizeCode(code);
    showLoading('🔍 Reviewing code... First run may take 1-2 minutes.');
    disableButtons();

    console.log('Sending reviewCode message...');
    const response = await sendMessageSafely({
      action: 'reviewCode',
      code: sanitizedCode,
      options: {}
    });

    console.log('Review response:', response);

    if (response.success) {
      await chrome.storage.local.set({ 
        lastReview: response.review,
        lastCode: code
      });
      
      showResult('✅ Review complete! Opening side panel...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      
    } else {
      showResult(`❌ Error: ${response.error || 'Review failed'}`, 'error');
    }

  } catch (error) {
    console.error('Review error:', error);
    showResult(`❌ ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function generateDocs() {
  const codeInput = document.getElementById('codeInput');
  const code = codeInput?.value?.trim();

  if (!code || code.length < 10) {
    showResult('⚠️ Please enter at least 10 characters of code', 'error');
    return;
  }

  try {
    const sanitizedCode = sanitizeCode(code);
    showLoading('📝 Generating documentation...');
    disableButtons();

    const response = await sendMessageSafely({
      action: 'generateDocs',
      code: sanitizedCode,
      options: {}
    });

    if (response.success) {
      await chrome.storage.local.set({ 
        lastDocumentation: response.documentation,
        lastCode: code
      });
      
      showResult('✅ Documentation complete! Opening side panel...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      
    } else {
      showResult(`❌ Error: ${response.error}`, 'error');
    }

  } catch (error) {
    console.error('Docs error:', error);
    showResult(`❌ ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function refactorCode() {
  const codeInput = document.getElementById('codeInput');
  const code = codeInput?.value?.trim();

  if (!code || code.length < 10) {
    showResult('⚠️ Please enter at least 10 characters of code', 'error');
    return;
  }

  try {
    const sanitizedCode = sanitizeCode(code);
    showLoading('🔧 Refactoring code...');
    disableButtons();

    const response = await sendMessageSafely({
      action: 'refactorCode',
      code: sanitizedCode,
      options: {}
    });

    if (response.success) {
      await chrome.storage.local.set({ 
        lastRefactor: response.refactored,
        lastCode: code
      });
      
      showResult('✅ Refactoring complete! Opening side panel...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.sidePanel.open({ windowId: tab.windowId });
      }
      
    } else {
      showResult(`❌ Error: ${response.error}`, 'error');
    }

  } catch (error) {
    console.error('Refactor error:', error);
    showResult(`❌ ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

function clearAll() {
  const codeInput = document.getElementById('codeInput');
  const result = document.getElementById('result');
  
  if (codeInput) codeInput.value = '';
  if (result) {
    result.style.display = 'none';
    result.textContent = '';
  }
  
  chrome.storage.local.remove(['lastReview', 'lastDocumentation', 'lastRefactor', 'lastCode']);
  console.log('Cleared all');
}
