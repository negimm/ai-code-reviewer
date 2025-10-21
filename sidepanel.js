// sidepanel.js - Complete with 3 API status support and textarea results

import { AIManager } from './utils/ai-manager.js';

console.log('=== SIDEPANEL SCRIPT LOADED ===');

const aiManager = new AIManager();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sidepanel DOM loaded');
  
  // Check AI capabilities for all 3 APIs
  const caps = await aiManager.checkCapabilities();
  if (caps) {
    updateStatusIndicator('promptStatus', 'promptStatusItem', caps.prompt);
    updateStatusIndicator('writerStatus', 'writerStatusItem', caps.writer);
    updateStatusIndicator('rewriterStatus', 'rewriterStatusItem', caps.rewriter);
    console.log('AI Capabilities:', caps);
  }

  await loadSelectedCode();
  await loadStoredResults();
  setupEventListeners();
  updateCharCount();
});

// Helper function to update status indicators
function updateStatusIndicator(badgeId, itemId, isAvailable) {
  const badge = document.getElementById(badgeId);
  const item = document.getElementById(itemId);
  
  if (badge && item) {
    if (isAvailable) {
      badge.classList.add('status-available');
      item.classList.add('active');
    } else {
      badge.classList.remove('status-available');
      item.classList.remove('active');
    }
  }
}

async function loadSelectedCode() {
  const { selectedCode, codeSource } = await chrome.storage.local.get(['selectedCode', 'codeSource']);
  
  const codeInput = document.getElementById('codeInput');
  if (codeInput && selectedCode) {
    codeInput.value = selectedCode;
    updateCharCount();
    console.log(`✅ Loaded ${selectedCode.length} chars from ${codeSource}`);
    showNotification(`✅ Code loaded (${selectedCode.length} chars)`);
    await chrome.storage.local.remove(['selectedCode', 'codeSource']);
  }
}

function updateCharCount() {
  const codeInput = document.getElementById('codeInput');
  const charCount = document.getElementById('charCount');
  if (codeInput && charCount) {
    charCount.textContent = `${codeInput.value.length} characters`;
  }
}

async function loadStoredResults() {
  const { lastReview, lastDocumentation, lastRefactor } = 
    await chrome.storage.local.get(['lastReview', 'lastDocumentation', 'lastRefactor']);

  if (lastReview) {
    document.getElementById('reviewContent').value = lastReview;
    switchTab('review');
    showResults();
    await chrome.storage.local.remove('lastReview');
  } 
  else if (lastDocumentation) {
    document.getElementById('docsContent').value = lastDocumentation;
    switchTab('docs');
    showResults();
    await chrome.storage.local.remove('lastDocumentation');
  } 
  else if (lastRefactor) {
    document.getElementById('refactorContent').value = lastRefactor;
    switchTab('refactor');
    showResults();
    await chrome.storage.local.remove('lastRefactor');
  }
}

function setupEventListeners() {
  const codeInput = document.getElementById('codeInput');
  if (codeInput) {
    codeInput.addEventListener('input', updateCharCount);
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  document.getElementById('reviewBtn')?.addEventListener('click', reviewCode);
  document.getElementById('docBtn')?.addEventListener('click', generateDocs);
  document.getElementById('refactorBtn')?.addEventListener('click', refactorCode);

  document.getElementById('copyReviewBtn')?.addEventListener('click', () => copyToClipboard('reviewContent'));
  document.getElementById('copyDocsBtn')?.addEventListener('click', () => copyToClipboard('docsContent'));
  document.getElementById('copyRefactorBtn')?.addEventListener('click', () => copyToClipboard('refactorContent'));
}

async function reviewCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    showNotification('⚠️ Please enter at least 10 characters of code', 'warning');
    return;
  }

  showLoading('🔍 Reviewing code...');
  disableButtons();

  try {
    console.log('Processing review...');
    const reviewResult = await aiManager.reviewCode(code, {});

    console.log('✅ Review completed');
    document.getElementById('reviewContent').value = reviewResult.raw;
    switchTab('review');
    showResults();
    showNotification('✅ Review complete!');
    
  } catch (error) {
    console.error('Review error:', error);
    showNotification(`❌ Review failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function generateDocs() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    showNotification('⚠️ Please enter at least 10 characters of code', 'warning');
    return;
  }

  showLoading('📝 Generating documentation...');
  disableButtons();

  try {
    console.log('Generating documentation...');
    const docsResult = await aiManager.generateDocumentation(code, {});

    document.getElementById('docsContent').value = docsResult;
    switchTab('docs');
    showResults();
    showNotification('✅ Documentation complete!');
  } catch (error) {
    console.error('Documentation error:', error);
    showNotification(`❌ Documentation failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function refactorCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    showNotification('⚠️ Please enter at least 10 characters of code', 'warning');
    return;
  }

  showLoading('🔧 Refactoring code...');
  disableButtons();

  try {
    console.log('Refactoring code...');
    const refactorResult = await aiManager.refactorCode(code, {});

    document.getElementById('refactorContent').value = refactorResult;
    switchTab('refactor');
    showResults();
    showNotification('✅ Refactoring complete!');
  } catch (error) {
    console.error('Refactor error:', error);
    showNotification(`❌ Refactoring failed: ${error.message}`, 'error');
  } finally {
    hideLoading();
    enableButtons();
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  document.getElementById(`${tabName}Tab`)?.classList.add('active');
}

function showResults() {
  const resultsContainer = document.getElementById('resultsContainer');
  const placeholder = document.getElementById('placeholder');
  
  if (resultsContainer) {
    resultsContainer.classList.add('show');
    resultsContainer.style.display = 'block';
  }
  if (placeholder) {
    placeholder.style.display = 'none';
  }
}

function showLoading(message) {
  const loading = document.getElementById('loadingIndicator');
  if (loading) {
    const loadingText = loading.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = message;
    }
    loading.style.display = 'block';
  }
}

function hideLoading() {
  const loading = document.getElementById('loadingIndicator');
  if (loading) {
    loading.style.display = 'none';
  }
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

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const text = element.value || element.textContent || element.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    showNotification('✅ Copied to clipboard!');
  }).catch(err => {
    console.error('Copy failed:', err);
    showNotification('❌ Copy failed', 'error');
  });
}

function showNotification(message, type = 'success') {
  document.querySelectorAll('.notification').forEach(n => n.remove());
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800'
  };
  
  notification.style.cssText = `
    position: fixed; top: 80px; right: 24px; padding: 14px 20px;
    background: ${colors[type] || colors.success}; color: white;
    border-radius: 12px; z-index: 10000; font-size: 14px; font-weight: 600;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

console.log('✅ Sidepanel initialized with DIRECT AI processing');
