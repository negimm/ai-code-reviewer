// sidepanel.js - Process AI DIRECTLY in sidepanel (not via service worker)

import { checkCapabilities, updateStatusDot } from './ui-utils.js';
import { AIManager } from './utils/ai-manager.js';

console.log('=== SIDEPANEL SCRIPT LOADED ===');

// Create AIManager DIRECTLY in sidepanel context (has access to LanguageModel)
const aiManager = new AIManager();

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sidepanel DOM loaded');
  
  // Check AI capabilities DIRECTLY in sidepanel
  const caps = await aiManager.checkCapabilities();
  if (caps) {
    updateStatusDot('promptStatus', caps.prompt);
    console.log('AI Capabilities:', caps);
  }

  // Load selected code
  await loadSelectedCode();
  
  // Load stored results
  await loadStoredResults();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update character count
  updateCharCount();
});

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
    document.getElementById('reviewContent').innerHTML = formatContent(lastReview);
    switchTab('review');
    showResults();
    await chrome.storage.local.remove('lastReview');
  } 
  else if (lastDocumentation) {
    document.getElementById('docsContent').innerHTML = formatContent(lastDocumentation);
    switchTab('docs');
    showResults();
    await chrome.storage.local.remove('lastDocumentation');
  } 
  else if (lastRefactor) {
    document.getElementById('refactorContent').innerHTML = formatContent(lastRefactor);
    switchTab('refactor');
    showResults();
    await chrome.storage.local.remove('lastRefactor');
  }
}

function formatContent(content) {
  if (!content) return '';
  return content
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
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

// CRITICAL: Process AI DIRECTLY in sidepanel (NO service worker communication)
async function reviewCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    showNotification('⚠️ Please enter at least 10 characters of code', 'warning');
    return;
  }

  showLoading('🔍 Reviewing code... This may take 1-2 minutes on first run.');
  disableButtons();

  try {
    console.log('Processing review DIRECTLY in sidepanel...');
    
    // Call AIManager DIRECTLY (not through service worker)
    const reviewResult = await aiManager.reviewCode(code, {});

    console.log('✅ Review completed');
    document.getElementById('reviewContent').innerHTML = formatContent(reviewResult.raw);
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

    document.getElementById('docsContent').innerHTML = formatContent(docsResult);
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

    document.getElementById('refactorContent').innerHTML = formatContent(refactorResult);
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

// UI Helper Functions
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
  document.getElementById('resultsContainer').style.display = 'block';
  document.getElementById('placeholder').style.display = 'none';
}

function showLoading(message) {
  const loading = document.getElementById('loadingIndicator');
  if (loading) {
    loading.querySelector('div:last-child').textContent = message;
    loading.style.display = 'block';
  }
}

function hideLoading() {
  document.getElementById('loadingIndicator').style.display = 'none';
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

  const text = element.textContent || element.innerText;
  
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
    position: fixed; top: 20px; right: 20px; padding: 12px 20px;
    background: ${colors[type] || colors.success}; color: white;
    border-radius: 6px; z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

console.log('✅ Sidepanel initialized with DIRECT AI processing');
