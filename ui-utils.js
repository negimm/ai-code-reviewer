// ui-utils.js - Fixed status indicator

export async function checkCapabilities() {
  const capabilities = {
    prompt: false,
    writer: false,
    rewriter: false,
    apiFound: false
  };

  try {
    if (typeof LanguageModel !== 'undefined') {
      capabilities.apiFound = true;
      const availability = await LanguageModel.availability();
      capabilities.prompt = (availability === 'readily' || availability === 'available');
    }
  } catch (error) {
    console.error('Capability check failed:', error);
  }

  return capabilities;
}

export function updateStatusDot(elementId, isAvailable) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element ${elementId} not found`);
    return;
  }
  
  // Remove both classes first
  element.classList.remove('status-available', 'status-unavailable');
  
  // Add appropriate class
  if (isAvailable) {
    element.classList.add('status-available');
  } else {
    element.classList.add('status-unavailable');
  }
}