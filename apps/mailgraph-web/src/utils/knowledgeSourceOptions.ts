import type { KnowledgeFolder } from '@/api'

export function findKnowledgeFolderTrail(
  folders: KnowledgeFolder[],
  id: string,
): KnowledgeFolder[] {
  if (!id) return []

  for (const folder of folders) {
    if (folder.id === id) return [folder]
    const childTrail = findKnowledgeFolderTrail(folder.children || [], id)
    if (childTrail.length) return [folder, ...childTrail]
  }
  return []
}

export function findKnowledgeFolder(
  folders: KnowledgeFolder[],
  id: string,
): KnowledgeFolder | undefined {
  const trail = findKnowledgeFolderTrail(folders, id)
  return trail[trail.length - 1]
}
