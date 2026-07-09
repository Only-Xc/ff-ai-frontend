export function getTaskPreviewUrl(taskId: string) {
  return `/app/${encodeURIComponent(taskId)}/preview`
}
