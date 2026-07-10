export function getTaskPreviewUrl(taskId: string) {
  return `/runtime/api/runtime/deployments/${encodeURIComponent(taskId)}/proxy`
}
