// General content script for all pages

console.log('LockIn content script loaded');

// Check if extension context is valid
function isExtensionValid(): boolean {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

// Listen for URL changes in single-page apps
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    checkCurrentPage();
  }
}).observe(document, { subtree: true, childList: true });

async function checkCurrentPage() {
  // Don't try to send messages if extension context is invalid
  if (!isExtensionValid()) {
    console.log('LockIn: Extension context invalidated, stopping content script');
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_URL',
      url: window.location.href,
    });

    if (response?.shouldBlock) {
      window.location.href = chrome.runtime.getURL('blocked.html');
    }
  } catch (error) {
    // Silently handle errors when extension is reloaded
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.log('LockIn: Extension was reloaded');
    } else {
      console.error('LockIn: Error checking URL:', error);
    }
  }
}

export {};
