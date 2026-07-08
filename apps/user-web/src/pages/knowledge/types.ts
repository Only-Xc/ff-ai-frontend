import type {
  KnowledgeDataset,
  KnowledgeDocument,
  KnowledgeDocumentParseStatus,
  KnowledgeSearchResult,
} from '@/api/knowledge'

export type KnowledgeWorkspaceTab =
  | 'overview'
  | 'documents'
  | 'retrieval'
  | 'settings'

export type KnowledgeIngestionStage =
  | 'uploaded'
  | 'parsing'
  | 'indexed'
  | 'failed'
  | 'unknown'

export type KnowledgeDocumentStatusFilter = 'all' | KnowledgeIngestionStage

export type KnowledgeInspectorTarget =
  | { type: 'dataset'; dataset: KnowledgeDataset }
  | { type: 'document'; document: KnowledgeDocument }
  | { type: 'search-result'; result: NormalizedKnowledgeSearchResult }
  | null

export interface NormalizedKnowledgeDataset extends KnowledgeDataset {
  displayCreatedAt?: string | null
  displayUpdatedAt?: string | null
}

export interface NormalizedKnowledgeDocument extends KnowledgeDocument {
  displayName: string
  displayCreatedAt?: string | null
  displayUpdatedAt?: string | null
  ingestionStage: KnowledgeIngestionStage
  parseStatus?: KnowledgeDocumentParseStatus | null
}

export interface NormalizedKnowledgeSearchResult
  extends KnowledgeSearchResult {
  displayContent: string
  displayDocumentName: string
  displayScore?: number
  displayChunkId?: string
}
