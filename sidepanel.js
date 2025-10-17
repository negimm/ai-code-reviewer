// sidepanel.js - With code loading and action buttons

import { checkCapabilities, updateStatusDot } from './ui-utils.js';

console.log('=== SIDEPANEL SCRIPT LOADED ===');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Sidepanel DOM loaded');
  
  // Check API capabilities
  const caps = await checkCapabilities();
  if (caps) {
    updateStatusDot('promptStatus', caps.prompt);
    updateStatusDot('writerStatus', caps.writer);
    updateStatusDot('rewriterStatus', caps.rewriter);
  }

  // Load selected code if available
  await loadSelectedCode();
  
  // Load any stored results
  await loadStoredResults();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update character count
  updateCharCount();
});

// Load selected code from storage
async function loadSelectedCode() {
  const { selectedCode, codeSource } = await chrome.storage.local.get(['selectedCode', 'codeSource']);
  
  const codeInput = document.getElementById('codeInput');
  if (codeInput && selectedCode) {
    codeInput.value = selectedCode;
    updateCharCount();
    console.log(`Loaded ${selectedCode.length} chars from ${codeSource}`);
    
    // Clear selected code from storage
    await chrome.storage.local.remove(['selectedCode', 'codeSource']);
  }
}

// Update character count
function updateCharCount() {
  const codeInput = document.getElementById('codeInput');
  const charCount = document.getElementById('charCount');
  if (codeInput && charCount) {
    charCount.textContent = `${codeInput.value.length} characters`;
  }
}

// Load stored results
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

// Format content with markdown
function formatContent(content) {
  if (!content) return '';

  return content
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Setup all event listeners
function setupEventListeners() {
  // Character count on input
  const codeInput = document.getElementById('codeInput');
  if (codeInput) {
    codeInput.addEventListener('input', updateCharCount);
  }

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Action buttons
  document.getElementById('reviewBtn')?.addEventListener('click', reviewCode);
  document.getElementById('docBtn')?.addEventListener('click', generateDocs);
  document.getElementById('refactorBtn')?.addEventListener('click', refactorCode);

  // Copy buttons
  document.getElementById('copyReviewBtn')?.addEventListener('click', () => {
    copyToClipboard('reviewContent');
  });
  document.getElementById('copyDocsBtn')?.addEventListener('click', () => {
    copyToClipboard('docsContent');
  });
  document.getElementById('copyRefactorBtn')?.addEventListener('click', () => {
    copyToClipboard('refactorContent');
  });
}

// Action functions
async function reviewCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    alert('Please enter at least 10 characters of code');
    return;
  }

  showLoading('Reviewing code...');
  disableButtons();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'reviewCode',
      code: code,
      options: {}
    });

    if (response.success) {
      document.getElementById('reviewContent').innerHTML = formatContent(response.review);
      switchTab('review');
      showResults();
    } else {
      alert(`Review failed: ${response.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function generateDocs() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    alert('Please enter at least 10 characters of code');
    return;
  }

  showLoading('Generating documentation...');
  disableButtons();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateDocs',
      code: code,
      options: {}
    });

    if (response.success) {
      document.getElementById('docsContent').innerHTML = formatContent(response.documentation);
      switchTab('docs');
      showResults();
    } else {
      alert(`Documentation failed: ${response.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    hideLoading();
    enableButtons();
  }
}

async function refactorCode() {
  const code = document.getElementById('codeInput')?.value?.trim();
  if (!code || code.length < 10) {
    alert('Please enter at least 10 characters of code');
    return;
  }

  showLoading('Refactoring code...');
  disableButtons();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'refactorCode',
      code: code,
      options: {}
    });

    if (response.success) {
      document.getElementById('refactorContent').innerHTML = formatContent(response.refactored);
      switchTab('refactor');
      showResults();
    } else {
      alert(`Refactoring failed: ${response.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    hideLoading();
    enableButtons();
  }
}

// UI Helper functions
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
    showNotification('❌ Copy failed');
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: #4CAF50;
    color: white;
    border-radius: 6px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

console.log('✅ Sidepanel initialized');
