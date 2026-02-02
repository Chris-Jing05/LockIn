// YouTube-specific content script for smart filtering

console.log('LockIn YouTube content script loaded');

let currentVideoId: string | null = null;

// Check if extension context is valid
function isExtensionValid(): boolean {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}

// Watch for video page loads
function checkYouTubeVideo() {
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get('v');

  if (videoId && videoId !== currentVideoId) {
    currentVideoId = videoId;
    classifyAndBlockIfNeeded(videoId);
  }
}

async function classifyAndBlockIfNeeded(videoId: string) {
  // Don't try to classify if extension context is invalid
  if (!isExtensionValid()) {
    console.log('LockIn: Extension context invalidated, skipping classification');
    return;
  }

  try {
    // Get user preferences
    const { preferences } = await chrome.storage.local.get('preferences');

    // Extract video metadata
    const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent ||
                  document.querySelector('h1.title')?.textContent || '';

    const channelName = document.querySelector('ytd-channel-name a')?.textContent ||
                       document.querySelector('#channel-name')?.textContent || '';

    const description = document.querySelector('ytd-text-inline-expander')?.textContent || '';

    // Ask background script to classify
    const result = await chrome.runtime.sendMessage({
      type: 'CLASSIFY_CONTENT',
      data: {
        url: window.location.href,
        videoId,
        title: title.trim(),
        channelName: channelName.trim(),
        description: description.trim().substring(0, 500), // First 500 chars
      },
    });

    if (result && !result.error) {
      const blockedCategories = preferences?.youtubeBlockedCategories || [];
      const shouldBlock = blockedCategories.includes(result.category);

      if (shouldBlock) {
        // Block video based on category
        blockVideo(result.category);
      }
    }
  } catch (error) {
    // Silently handle errors when extension is reloaded
    if (error instanceof Error && error.message.includes('Extension context invalidated')) {
      console.log('LockIn: Extension was reloaded');
    } else {
      console.error('Failed to classify YouTube video:', error);
    }
  }
}

function blockVideo(category?: string) {
  // Aggressively stop video playback
  const video = document.querySelector('video') as HTMLVideoElement;

  if (video) {
    // Pause and mute
    video.pause();
    video.muted = true;
    video.volume = 0;

    // Remove video source to fully stop playback
    video.src = '';
    video.load();

    // Prevent any play attempts
    const preventPlay = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      video.pause();
      return false;
    };

    video.addEventListener('play', preventPlay);
    video.addEventListener('playing', preventPlay);
    video.addEventListener('canplay', preventPlay);

    // Continuously enforce pause (in case YouTube tries to restart)
    const enforceBlock = setInterval(() => {
      if (!video.paused) {
        video.pause();
        video.muted = true;
        video.volume = 0;
      }
    }, 100);

    // Store interval ID to clean up later if needed
    (video as any)._blockInterval = enforceBlock;
  }

  // Show overlay
  const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');

  if (player) {
    const overlay = document.createElement('div');
    overlay.id = 'lockin-block-overlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: all;
    `;

    const categoryText = category ? `<p style="font-size: 16px; opacity: 0.8; margin-top: 10px;">Category: <strong>${category}</strong></p>` : '';

    overlay.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h1 style="font-size: 36px; margin-bottom: 20px;">🚫 Content Blocked</h1>
        <p style="font-size: 18px; opacity: 0.9;">This ${category || 'entertainment'} video is blocked by LockIn.</p>
        ${categoryText}
        <p style="font-size: 14px; margin-top: 20px; opacity: 0.7;">
          You can adjust blocked categories in your dashboard settings.
        </p>
      </div>
    `;

    // Prevent clicks from reaching the player
    overlay.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    });

    (player as HTMLElement).style.position = 'relative';

    // Remove any existing overlay first
    const existingOverlay = document.getElementById('lockin-block-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    player.appendChild(overlay);
  }
}

// Check on initial load
setTimeout(checkYouTubeVideo, 2000);

// Watch for navigation changes (YouTube is a SPA)
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;
    setTimeout(checkYouTubeVideo, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

export {};
