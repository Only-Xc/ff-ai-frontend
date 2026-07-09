import type { TagProps } from 'antd'

import type {
  KnowledgeIngestionStage,
  KnowledgeWorkspaceTab,
} from './types'

export const KNOWLEDGE_WORKSPACE_TABS: Array<{
  key: KnowledgeWorkspaceTab
  labelKey: string
}> = [
  { key: 'details', labelKey: 'pages.knowledge.tabs.details' },
  { key: 'documents', labelKey: 'pages.knowledge.tabs.documents' },
  { key: 'retrieval', labelKey: 'pages.knowledge.tabs.retrieval' },
]

export const DEFAULT_KNOWLEDGE_TAB: KnowledgeWorkspaceTab = 'documents'

export const KNOWLEDGE_PERMISSION_LABEL_KEYS: Record<string, string> = {
  me: 'pages.knowledge.permissions.me',
  team: 'pages.knowledge.permissions.team',
}

export const KNOWLEDGE_CHUNK_METHOD_LABEL_KEYS: Record<string, string> = {
  manual: 'pages.knowledge.chunkMethods.manual',
  naive: 'pages.knowledge.chunkMethods.naive',
  qa: 'pages.knowledge.chunkMethods.qa',
  table: 'pages.knowledge.chunkMethods.table',
}

export const INGESTION_STAGE_LABEL_KEYS: Record<
  KnowledgeIngestionStage,
  string
> = {
  failed: 'pages.knowledge.ingestion.failed',
  indexed: 'pages.knowledge.ingestion.indexed',
  parsing: 'pages.knowledge.ingestion.parsing',
  unknown: 'pages.knowledge.ingestion.unknown',
  uploaded: 'pages.knowledge.ingestion.uploaded',
}

export const INGESTION_STAGE_COLORS: Record<
  KnowledgeIngestionStage,
  TagProps['color']
> = {
  failed: 'error',
  indexed: 'success',
  parsing: 'processing',
  unknown: 'warning',
  uploaded: 'default',
}

export const DOCUMENT_STATUS_STAGE_MAP: Record<string, KnowledgeIngestionStage> =
  {
    cancel: 'failed',
    cancelled: 'failed',
    done: 'indexed',
    failed: 'failed',
    fail: 'failed',
    none: 'uploaded',
    pending: 'uploaded',
    processing: 'parsing',
    running: 'parsing',
    success: 'indexed',
    succeeded: 'indexed',
    unstart: 'uploaded',
  }
