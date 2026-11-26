// Keep these keys stable so existing installations retain their configuration.
export const getConfig = async () =>
  (await chrome.storage.local.get('config')).config;
export const saveConfig = (config) => chrome.storage.local.set({ config });
export const clearConfig = () => chrome.storage.local.remove('config');
export const getPreferences = async () =>
  (await chrome.storage.local.get('preferences')).preferences;
export const savePreferences = (preferences) =>
  chrome.storage.local.set({ preferences });
