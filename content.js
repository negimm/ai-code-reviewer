// content.js - Auto-open sidepanel on text selection (no popup button)

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
 * Handle text selection and AUTO-OPEN sidepanel (no popup button)
 */
let selectionTimeout;
let lastSelectionLength = 0;

function handleTextSelection() {
  clearTimeout(selectionTimeout);

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Minimum 20 characters to avoid accidental selections
  if (selectedText.length < 20) {
    lastSelectionLength = 0;
    return;
  }

  // Only trigger if selection changed significantly
  if (Math.abs(selectedText.length - lastSelectionLength) < 10) {
    return;
  }

  lastSelectionLength = selectedText.length;

  // Show a brief toast notification instead of popup
  showToast(`✅ Selected ${selectedText.length} characters - Opening side panel...`);

  // Auto-open sidepanel after brief delay
  selectionTimeout = setTimeout(async () => {
    try {
      const sanitizedCode = sanitizeCode(selectedText);
      
      // Store selected code
      await chrome.storage.local.set({ 
        selectedCode: sanitizedCode,
        codeSource: 'selection',
        selectionTimestamp: Date.now()
      });
      
      // Open sidepanel automatically
      await chrome.runtime.sendMessage({ action: 'openSidePanel' });
      
      console.log('✅ Sidepanel opened with selected code');
      
    } catch (error) {
      console.error('Selection error:', error);
      showToast(`❌ Failed: ${error.message}`, 'error');
    }
  }, 500); // 500ms delay to ensure selection is complete
}

/**
 * Show a brief toast notification (replaces the purple popup)
 */
function showToast(message, type = 'success') {
  // Remove existing toasts
  document.querySelectorAll('.ai-review-toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'ai-review-toast';
  toast.textContent = message;
  
  const colors = {
    success: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    error: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
  };
  
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    padding: 12px 20px;
    background: ${colors[type] || colors.success};
    color: white;
    border-radius: 8px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    animation: slideUp 0.3s ease-out;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  // Auto-remove after 2 seconds
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(20px);
    }
  }
`;
document.head.appendChild(style);

// Listen for text selection (debounced)
let mouseUpTimeout;
document.addEventListener('mouseup', () => {
  clearTimeout(mouseUpTimeout);
  mouseUpTimeout = setTimeout(handleTextSelection, 300);
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
