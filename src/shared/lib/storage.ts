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

// Temporary credentials survive popup teardown but remain in browser-session memory.
export const getConnectionDraft = async (): Promise<
  AccountConfig | undefined
> =>
  (
    await chrome.storage.session.get<{ connectionDraft?: AccountConfig }>(
      'connectionDraft'
    )
  ).connectionDraft
export const saveConnectionDraft = (connectionDraft: AccountConfig) =>
  chrome.storage.session.set({ connectionDraft })
export const clearConnectionDraft = () =>
  chrome.storage.session.remove('connectionDraft')
