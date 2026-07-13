import type { TagProps } from 'antd'

import type { KnowledgeDocumentRunStatus } from '@/api/knowledge'

import type { KnowledgeWorkspaceTab } from './types'

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

export const DOCUMENT_RUN_STATUS_LABEL_KEYS: Record<
  KnowledgeDocumentRunStatus,
  string
> = {
  CANCEL: 'pages.knowledge.ingestion.cancelled',
  DONE: 'pages.knowledge.ingestion.indexed',
  FAIL: 'pages.knowledge.ingestion.failed',
  RUNNING: 'pages.knowledge.ingestion.parsing',
  UNSTART: 'pages.knowledge.ingestion.uploaded',
}

export const DOCUMENT_RUN_STATUS_COLORS: Record<
  KnowledgeDocumentRunStatus,
  TagProps['color']
> = {
  CANCEL: 'warning',
  DONE: 'success',
  FAIL: 'error',
  RUNNING: 'processing',
  UNSTART: 'default',
}
