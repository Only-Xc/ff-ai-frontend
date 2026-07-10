import type {
  KnowledgeDataset,
  KnowledgeDocument,
  KnowledgeRetrievalChunk,
} from '@/api/knowledge'

export type KnowledgeWorkspaceTab = 'details' | 'documents' | 'retrieval'

export type KnowledgeInspectorTarget =
  | { type: 'dataset'; dataset: KnowledgeDataset }
  | { type: 'document'; document: KnowledgeDocument }
  | { type: 'search-result'; result: KnowledgeRetrievalChunk }
  | null
