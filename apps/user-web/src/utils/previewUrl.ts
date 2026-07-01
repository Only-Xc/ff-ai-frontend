export function getLocalApiPreviewUrl(previewUrl: string) {
  try {
    const url = new URL(previewUrl, window.location.origin)
    const isApiPath =
      url.pathname === '/api' || url.pathname.startsWith('/api/')

    if (isApiPath) {
      if (
        url.hostname === window.location.hostname &&
        window.location.port === '8083'
      ) {
        url.port = '18083'
        return url.toString()
      }

      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return previewUrl
  }

  return previewUrl
}

export function withPreviewAccessToken(previewUrl: string, accessToken: string) {
  if (!accessToken || !previewUrl.includes('/api/tasks/')) return previewUrl

  try {
    const url = new URL(previewUrl, window.location.origin)
    url.searchParams.set('access_token', accessToken)
    return url.toString()
  } catch {
    return previewUrl
  }
}

export function buildAuthenticatedPreviewUrl(
  previewUrl: string | null | undefined,
  accessToken: string,
  taskId?: string,
) {
  if (!previewUrl) return ''
  const normalizedPreviewUrl =
    taskId && isDockerInternalPreviewUrl(previewUrl)
      ? `/api/tasks/${encodeURIComponent(taskId)}/preview/index.html`
      : previewUrl
  return withPreviewAccessToken(
    getLocalApiPreviewUrl(normalizedPreviewUrl),
    accessToken,
  )
}

function isDockerInternalPreviewUrl(previewUrl: string) {
  try {
    return new URL(previewUrl).hostname.startsWith('ff-wo-')
  } catch {
    return previewUrl.startsWith('http://ff-wo-')
  }
}
