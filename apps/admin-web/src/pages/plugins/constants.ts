export const PLUGIN_STATUS_META: Record<
  string,
  { color: string; labelKey: string }
> = {
  active: { color: 'green', labelKey: 'pages.pluginCenter.status.active' },
  enabled: { color: 'green', labelKey: 'pages.pluginCenter.status.enabled' },
  healthy: { color: 'green', labelKey: 'pages.pluginCenter.status.healthy' },
  installed: { color: 'blue', labelKey: 'pages.pluginCenter.status.installed' },
  registered: { color: 'default', labelKey: 'pages.pluginCenter.status.registered' },
  pending: { color: 'processing', labelKey: 'pages.pluginCenter.status.pending' },
  installing: { color: 'processing', labelKey: 'pages.pluginCenter.status.installing' },
  starting: { color: 'processing', labelKey: 'pages.pluginCenter.status.starting' },
  upgrading: { color: 'processing', labelKey: 'pages.pluginCenter.status.upgrading' },
  disabled: { color: 'default', labelKey: 'pages.pluginCenter.status.disabled' },
  unhealthy: { color: 'orange', labelKey: 'pages.pluginCenter.status.unhealthy' },
  failed: { color: 'red', labelKey: 'pages.pluginCenter.status.failed' },
  uninstalled: { color: 'default', labelKey: 'pages.pluginCenter.status.uninstalled' },
}

export const INSTALLABLE_SOURCE_TYPES = new Set(['oci_image', 'source_repository', 'oci'])
