// Background service worker for blocking and sync

interface UserPreferences {
  focusModeEnabled: boolean;
  whitelist: string[];
  blacklist: string[];
  youtubeBlockedCategories?: string[];
  scheduleStart?: string;
  scheduleEnd?: string;
}

const API_URL = 'http://localhost:3000';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('LockIn extension installed');

  chrome.storage.local.set({
    preferences: {
      focusModeEnabled: true,
      whitelist: ['stackoverflow.com', 'github.com', 'coursera.org'],
      blacklist: ['instagram.com', 'tiktok.com', 'reddit.com', 'netflix.com'],
    },
    blockedToday: 0,
    streak: 0,
  });

  chrome.alarms.create('sync', { periodInMinutes: 0.5 });
});

// Sync with backend
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') {
    syncWithBackend();
  }
});

async function syncWithBackend() {
  try {
    const { syncToken } = await chrome.storage.local.get('syncToken');

    if (!syncToken) return;

    const response = await fetch(`${API_URL}/api/sync?token=${syncToken}`);

    if (response.ok) {
      const data = await response.json();

      await chrome.storage.local.set({
        preferences: {
          focusModeEnabled: data.focusModeEnabled,
          whitelist: data.whitelist,
          blacklist: data.blacklist,
          youtubeBlockedCategories: data.youtubeBlockedCategories || [],
          scheduleStart: data.scheduleStart,
          scheduleEnd: data.scheduleEnd,
        },
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

function shouldBlockUrl(url: string, preferences: UserPreferences): boolean {
  if (!preferences.focusModeEnabled) return false;

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');

    const isWhitelisted = preferences.whitelist.some(allowed =>
      domain.includes(allowed) || allowed.includes(domain)
    );

    if (isWhitelisted) return false;

    const isBlacklisted = preferences.blacklist.some(blocked =>
      domain.includes(blocked) || blocked.includes(domain)
    );

    return isBlacklisted;
  } catch (error) {
    return false;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const { preferences } = await chrome.storage.local.get('preferences');

  if (shouldBlockUrl(details.url, preferences)) {
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html'),
    });

    const { blockedToday } = await chrome.storage.local.get('blockedToday');
    await chrome.storage.local.set({ blockedToday: (blockedToday || 0) + 1 });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PREFERENCES') {
    chrome.storage.local.get('preferences', (data) => {
      sendResponse(data.preferences);
    });
    return true;
  }

  if (message.type === 'UPDATE_PREFERENCES') {
    chrome.storage.local.set({ preferences: message.preferences }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CHECK_URL') {
    chrome.storage.local.get('preferences', (data) => {
      const shouldBlock = shouldBlockUrl(message.url, data.preferences);
      sendResponse({ shouldBlock });
    });
    return true;
  }

  if (message.type === 'CLASSIFY_CONTENT') {
    classifyContent(message.data).then(sendResponse);
    return true;
  }
});

async function classifyContent(data: any) {
  try {
    const { syncToken } = await chrome.storage.local.get('syncToken');
    if (!syncToken) return { error: 'Not authenticated' };

    const response = await fetch(`${API_URL}/api/classify-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        syncToken,
      }),
    });

    return response.ok ? await response.json() : { error: 'Classification failed' };
  } catch (error) {
    return { error: 'Classification failed' };
  }
}

export {};
