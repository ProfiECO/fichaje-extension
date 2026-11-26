import type { AccountConfig, Preferences } from '@/shared/types.ts'
// Keep these keys stable so existing installations retain their configuration.
export const getConfig = async (): Promise<AccountConfig | undefined> =>
  (await chrome.storage.local.get<{ config?: AccountConfig }>('config')).config
export const saveConfig = (config: AccountConfig) =>
  chrome.storage.local.set({ config })
export const clearConfig = () => chrome.storage.local.remove('config')
export const getPreferences = async (): Promise<Preferences | undefined> =>
  (await chrome.storage.local.get<{ preferences?: Preferences }>('preferences'))
    .preferences
export const savePreferences = (preferences: Preferences) =>
  chrome.storage.local.set({ preferences })
