// Extension configuration is independent of the React application.
export function createManifest(
  version: string,
  popup = 'popup.html'
): chrome.runtime.ManifestV3 {
  return {
    manifest_version: 3,
    name: 'Fichaje Frappe HR',
    version,
    description: 'Fichaje en Frappe HR, objetivos e historial semanal.',
    action: { default_popup: popup, default_title: 'Fichaje' },
    permissions: ['storage', 'geolocation'],
    optional_host_permissions: ['https://*/*', 'http://*/*']
  }
}
