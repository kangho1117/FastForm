// FastForm - Background Service Worker (100% Free & Unlocked Edition)
// Handles shortcut commands and messaging across tabs

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-form') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const data = await chrome.storage.local.get(['profiles', 'activeProfileIndex']);
      const profiles = data.profiles || [];
      const activeIndex = data.activeProfileIndex ?? 0;
      const activeProfile = profiles[activeIndex];

      if (!activeProfile) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            window.postMessage({ type: 'FASTFORM_NOTIFY', message: 'No profiles saved. Please create a profile in FastForm first.' }, '*');
          }
        });
        return;
      }

      // Send the profile data & full features unlocked to content script
      await chrome.tabs.sendMessage(tab.id, {
        action: 'fillForm',
        profile: activeProfile,
        isPro: true
      });
    } catch (error) {
      console.error('FastForm: Error filling form', error);
    }
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'fillFormFromPopup') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
          sendResponse({ success: false, error: 'No active tab' });
          return;
        }

        await chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          profile: message.profile,
          isPro: true
        });
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }
});
