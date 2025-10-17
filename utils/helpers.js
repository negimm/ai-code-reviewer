// utils/helpers.js - Shared utility functions

/**
 * Debounce function to limit rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
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

/**
 * Throttle function to limit function execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Sanitize code input to prevent security issues
 * @param {string} code - Code to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized code
 * @throws {Error} If code is invalid
 */
export function sanitizeCode(code, maxLength = 10000) {
  if (!code || typeof code !== 'string') {
    throw new Error('Invalid code input');
  }

  // Remove potentially harmful content
  const sanitized = code
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
    .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
    .replace(/<embed[^>]*>/gi, '') // Remove embeds
    .slice(0, maxLength);

  // Validate minimum length
  if (sanitized.trim().length < 10) {
    throw new Error('Code snippet too short (minimum 10 characters)');
  }

  return sanitized;
}

/**
 * Format content for HTML display with basic markdown support
 * @param {string} content - Content to format
 * @returns {string} Formatted HTML
 */
export function formatContent(content) {
  if (!content) return '';

  return content
    // Convert newlines to breaks
    .replace(/\n/g, '<br>')
    // Convert inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert italic
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Convert headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>');
}

/**
 * Detect programming language from filename or content
 * @param {string} filename - File name or path
 * @param {string} content - File content (optional)
 * @returns {string} Detected language
 */
export function detectLanguage(filename, content = '') {
  if (!filename) return 'unknown';

  const ext = filename.split('.').pop().toLowerCase();
  
  const languageMap = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'c',
    'h': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'kts': 'kotlin',
    'scala': 'scala',
    'sh': 'bash',
    'bash': 'bash',
    'sql': 'sql',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'r': 'r',
    'dart': 'dart',
    'lua': 'lua',
    'vim': 'vim',
    'dockerfile': 'docker'
  };

  return languageMap[ext] || 'unknown';
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    
    // Fallback method for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {number} duration - Display duration in milliseconds
 */
export function showNotification(message, type = 'success', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 6px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: slideInRight 0.3s ease-out;
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 300);
  }, duration);
}

/**
 * Validate and parse GitHub URL
 * @param {string} url - GitHub URL
 * @returns {Object|null} Parsed URL info or null
 */
export function parseGitHubURL(url) {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    
    // Check if it's GitHub
    if (!urlObj.hostname.includes('github.com')) {
      return null;
    }

    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    return {
      owner: pathParts[0] || null,
      repo: pathParts[1] || null,
      type: pathParts[2] || null, // 'blob', 'pull', 'issues', etc.
      path: pathParts.slice(3).join('/') || null,
      isPR: pathParts[2] === 'pull',
      isFile: pathParts[2] === 'blob',
      isGist: urlObj.hostname.includes('gist.github.com')
    };
  } catch (error) {
    console.error('URL parsing error:', error);
    return null;
  }
}

/**
 * Extract code blocks from text
 * @param {string} text - Text containing code blocks
 * @returns {Array} Array of code blocks with language info
 */
export function extractCodeBlocks(text) {
  if (!text) return [];

  const codeBlockRegex = /``````/g;
  const blocks = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    blocks.push({
      language: match[1] || 'unknown',
      code: match[2].trim(),
      startIndex: match.index,
      endIndex: match.index + match[0].length
    });
  }

  return blocks;
}

/**
 * Calculate code metrics
 * @param {string} code - Code to analyze
 * @returns {Object} Code metrics
 */
export function calculateCodeMetrics(code) {
  if (!code) {
    return {
      lines: 0,
      nonEmptyLines: 0,
      characters: 0,
      words: 0
    };
  }

  const lines = code.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  
  return {
    lines: lines.length,
    nonEmptyLines: nonEmptyLines.length,
    characters: code.length,
    words: code.split(/\s+/).filter(word => word.length > 0).length,
    averageLineLength: Math.round(code.length / lines.length)
  };
}

/**
 * Format timestamp to readable string
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Formatted timestamp
 */
export function formatTimestamp(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Timestamp formatting error:', error);
    return 'Unknown';
  }
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of function
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Retry attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed after ${maxRetries + 1} attempts: ${lastError.message}`);
}

/**
 * Check if running in development mode
 * @returns {boolean} True if in development mode
 */
export function isDevelopment() {
  return !('update_url' in chrome.runtime.getManifest());
}

/**
 * Log with timestamp (only in development)
 * @param {...any} args - Arguments to log
 */
export function devLog(...args) {
  if (isDevelopment()) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, ...args);
  }
}
