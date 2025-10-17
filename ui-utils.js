// ui-utils.js

/**
 * Checks the availability of all AI APIs via the Service Worker.
 * @returns {Promise<Object|null>} An object with capabilities (prompt, writer, rewriter) or null on error.
 */
export async function checkCapabilities() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkAICapabilities' });
    if (response?.success) {
      return response.capabilities;
    }
    console.error('Failed to get capabilities:', response?.error || 'Unknown error.');
    return null;
  } catch (error) {
    console.error('Error checking capabilities:', error);
    return null;
  }
}

/**
 * Updates the visual status dot in the UI.
 * @param {string} elementId - The ID of the status badge element (e.g., 'promptStatus').
 * @param {boolean} isAvailable - Whether the API is available.
 */
export function updateStatusDot(elementId, isAvailable) {
  const element = document.getElementById(elementId);
  if (element) {
    element.className = `status-badge ${isAvailable ? 'status-available' : 'status-unavailable'}`;
    element.textContent = isAvailable ? 'Available' : 'Unavailable';
  }
}