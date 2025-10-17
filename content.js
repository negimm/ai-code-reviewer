// content.js - Enhanced with auto sidepanel opening on selection

console.log('🔍 AI Code Reviewer content script loaded');

// GitHub-specific selectors
const GITHUB_CODE_SELECTORS = {
  prFiles: '.file .blob-code-inner',
  prDiff: '.blob-code-addition, .blob-code-deletion',
  fileView: '.blob-code-content',
  gist: '.gist-file .blob-code',
  prHeader: '.gh-header-title'
};

const REVIEW_BTN_CLASS = 'ai-reviewer-btn';
const INJECTED_FLAG_CLASS = 'ai-reviewer-injected';

// Helper functions
function isGitHubPR() {
  return window.location.pathname.includes('/pull/');
}

function isGitHubFile() {
  return window.location.pathname.includes('/blob/');
}

function isGist() {
  return window.location.hostname.includes('gist.github.com');
}

function sanitizeCode(code) {
  const sanitized = code
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .slice(0, 10000);
    
  if (sanitized.trim().length < 10) {
    throw new Error('Code snippet too short');
  }
  
  return sanitized;
}

/**
 * Inject 'AI Review' buttons next to code blocks
 */
function injectReviewButtons(container) {
  if (!isGitHubPR() && !isGitHubFile() && !isGist()) {
    return;
  }

  let selector;
  if (isGist()) {
    selector = GITHUB_CODE_SELECTORS.gist;
  } else if (isGitHubPR()) {
    selector = GITHUB_CODE_SELECTORS.prFiles;
  } else {
    selector = GITHUB_CODE_SELECTORS.fileView;
  }

  const codeBlocks = container.querySelectorAll(selector);
  
  codeBlocks.forEach(codeBlock => {
    let attachPoint = codeBlock.closest('.file, .gist-file, .blob-wrapper');
    if (!attachPoint) attachPoint = codeBlock.parentElement;

    if (attachPoint.classList.contains(INJECTED_FLAG_CLASS)) {
      return;
    }

    const codeText = codeBlock.textContent || '';
    if (codeText.length < 50) {
      return;
    }

    attachPoint.classList.add(INJECTED_FLAG_CLASS);

    const reviewBtn = document.createElement('button');
    reviewBtn.className = REVIEW_BTN_CLASS;
    reviewBtn.textContent = '🤖 AI Review';
    reviewBtn.title = 'Review this code with AI';

    reviewBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        const sanitizedCode = sanitizeCode(codeText);
        
        reviewBtn.textContent = '⏳ Opening...';
        reviewBtn.disabled = true;

        // Store code and open sidepanel
        await chrome.storage.local.set({ 
          selectedCode: sanitizedCode,
          codeSource: 'button'
        });
        
        await chrome.runtime.sendMessage({ action: 'openSidePanel' });

      } catch (error) {
        console.error('Review error:', error);
        alert(`Failed: ${error.message}`);
      } finally {
        reviewBtn.textContent = '🤖 AI Review';
        reviewBtn.disabled = false;
      }
    });

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'ai-reviewer-btn-container';
    buttonContainer.appendChild(reviewBtn);
    
    const fileHeader = attachPoint.querySelector('.file-header, .gist-file-header');
    if (fileHeader) {
      fileHeader.appendChild(buttonContainer);
    } else {
      attachPoint.insertBefore(buttonContainer, attachPoint.firstChild);
    }
  });
}

/**
 * Detect programming language from code block
 */
function detectLanguage(codeBlock) {
  const classList = Array.from(codeBlock.classList);
  for (const cls of classList) {
    if (cls.startsWith('language-')) {
      return cls.replace('language-', '');
    }
  }
  
  const fileInfo = codeBlock.closest('[data-file-type]');
  if (fileInfo) {
    return fileInfo.getAttribute('data-file-type');
  }
  
  return 'unknown';
}

/**
 * Handle text selection and auto-open sidepanel
 */
let selectionTimeout;
function handleTextSelection() {
  // Clear existing timeout
  clearTimeout(selectionTimeout);
  
  // Remove existing indicator
  const existingIndicator = document.getElementById('ai-reviewer-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length < 20) {
    return;
  }

  // Create floating indicator
  const indicator = document.createElement('div');
  indicator.id = 'ai-reviewer-indicator';
  indicator.className = 'ai-reviewer-indicator';
  indicator.innerHTML = `
    <div class="selection-info">
      <span class="icon">🤖</span>
      <span class="text">${selectedText.length} characters selected</span>
      <button class="review-btn" id="openSidepanelBtn">Open Side Panel</button>
    </div>
  `;

  document.body.appendChild(indicator);

  // Position near selection
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  indicator.style.position = 'fixed';
  indicator.style.top = `${Math.min(rect.bottom + 10, window.innerHeight - 100)}px`;
  indicator.style.left = `${Math.min(rect.left, window.innerWidth - 400)}px`;
  indicator.style.zIndex = '10000';

  // Add click handler to open sidepanel
  document.getElementById('openSidepanelBtn').addEventListener('click', async () => {
    try {
      const sanitizedCode = sanitizeCode(selectedText);
      
      indicator.querySelector('.review-btn').textContent = 'Opening...';
      
      // Store selected code
      await chrome.storage.local.set({ 
        selectedCode: sanitizedCode,
        codeSource: 'selection',
        selectionTimestamp: Date.now()
      });
      
      // Open sidepanel
      await chrome.runtime.sendMessage({ action: 'openSidePanel' });
      
      indicator.remove();
    } catch (error) {
      console.error('Selection error:', error);
      alert(`Failed: ${error.message}`);
    }
  });

  // Auto-remove after 10 seconds
  selectionTimeout = setTimeout(() => {
    if (indicator.parentElement) {
      indicator.remove();
    }
  }, 10000);
}

// Listen for text selection
document.addEventListener('mouseup', () => {
  setTimeout(handleTextSelection, 100);
});

// Clear indicator when user clicks elsewhere
document.addEventListener('mousedown', (e) => {
  const indicator = document.getElementById('ai-reviewer-indicator');
  if (indicator && !indicator.contains(e.target)) {
    indicator.remove();
  }
});

// Initial injection
injectReviewButtons(document);

// Watch for dynamic content changes
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          injectReviewButtons(node);
        }
      });
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('✅ AI Code Reviewer ready on GitHub');
