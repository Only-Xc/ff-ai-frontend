import { createRequest, path } from '../client.js'

const AI_GENERATION_PREFIX = '/api/v1/ai-generation'
const KNOWLEDGE_API_PREFIX = `${AI_GENERATION_PREFIX}/api/ai/knowledge`

type LooseString<T extends string> = T | (string & {})

export type KnowledgePermission = LooseString<'me' | 'team'>
export type KnowledgeChunkMethod = LooseString<
  'manual' | 'naive' | 'qa' | 'table'
>
export type KnowledgeDocumentParseStatus =
  LooseString<
    | 'failed'
    | 'fail'
    | 'pending'
    | 'processing'
    | 'running'
    | 'success'
    | 'succeeded'
    | 'done'
    | 'unstart'
  >

export interface KnowledgeParserConfig {
  chunk_token_num?: number
  delimiter?: string
  [key: string]: unknown
}

export interface KnowledgeDataset {
  id: string
  name: string
  description?: string | null
  embedding_model?: string | null
  permission?: KnowledgePermission | null
  chunk_method?: KnowledgeChunkMethod | null
  parser_config?: KnowledgeParserConfig | null
  create_time?: string | null
  created_at?: string | null
  updated_at?: string | null
  document_count?: number | null
  chunk_count?: number | null
  [key: string]: unknown
}

export interface KnowledgeDatasetQuery {
  page: number
  page_size: number
  keywords?: string
  name?: string
}

export interface KnowledgeDatasetCreatePayload {
  name: string
  description?: string
  embedding_model?: string
  permission?: KnowledgePermission
  chunk_method?: KnowledgeChunkMethod
  parser_config?: KnowledgeParserConfig
}

export type KnowledgeDatasetUpdatePayload =
  Partial<KnowledgeDatasetCreatePayload>

export interface KnowledgeDocument {
  id: string
  name?: string | null
  filename?: string | null
  run?: KnowledgeDocumentParseStatus | null
  status?: KnowledgeDocumentParseStatus | null
  parse_status?: KnowledgeDocumentParseStatus | null
  chunk_count?: number | null
  size?: number | null
  size_bytes?: number | null
  parser_id?: string | null
  chunk_method?: KnowledgeChunkMethod | null
  create_time?: string | null
  created_at?: string | null
  updated_at?: string | null
  parse_time?: string | null
  error?: string | null
  [key: string]: unknown
}

export interface KnowledgeDocumentQuery {
  page?: number
  page_size?: number
  keywords?: string
  name?: string
  status?: KnowledgeDocumentParseStatus
}

export interface KnowledgeSearchPayload {
  query: string
  top_k: number
  dataset_ids?: string[]
}

export interface KnowledgeSearchResult {
  id?: string
  chunk_id?: string
  content?: string
  content_ltks?: string
  content_with_weight?: string
  text?: string
  document_name?: string
  document_id?: string
  doc_name?: string
  docnm_kwd?: string
  score?: number
  similarity?: number
  term_similarity?: number
  vector_similarity?: number
  [key: string]: unknown
}

export interface KnowledgeListResult<T> {
  data: T[]
  count: number
}

export interface UploadKnowledgeDocumentsPayload {
  files: File[]
  parent_path?: string
}

const KNOWLEDGE_COLLECTION_KEYS = [
  'chunks',
  'data',
  'datasets',
  'docs',
  'documents',
  'items',
  'list',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function unwrapKnowledgeData(value: unknown): unknown {
  if (!isRecord(value) || !('data' in value)) return value

  return value.data
}

function readArrayFromRecord(record: Record<string, unknown>): unknown[] | undefined {
  for (const key of KNOWLEDGE_COLLECTION_KEYS) {
    const value = record[key]

    if (isUnknownArray(value)) return value

    if (isRecord(value)) {
      const nested = readArrayFromRecord(value)
      if (nested) return nested
    }
  }

  return undefined
}

function readArrayPayload(value: unknown): unknown[] | undefined {
  if (isUnknownArray(value)) return value
  if (!isRecord(value)) return undefined

  return readArrayFromRecord(value)
}

function readCount(value: unknown, fallback: number): number {
  if (!isRecord(value)) return fallback

  const count = value.count ?? value.total

  return typeof count === 'number' ? count : fallback
}

function adaptKnowledgeList<T>(value: unknown): KnowledgeListResult<T> {
  const payload = unwrapKnowledgeData(value)
  const data = readArrayPayload(payload) ?? []

  return {
    count: readCount(payload, data.length),
    data: data as T[],
  }
}

function adaptKnowledgeItem<T>(value: unknown): T {
  const payload = unwrapKnowledgeData(value)

  if (Array.isArray(payload)) return (payload[0] ?? {}) as T

  if (isRecord(payload)) {
    const data = readArrayPayload(payload)

    if (data && !('id' in payload)) return (data[0] ?? {}) as T

    return payload as T
  }

  return payload as T
}

function adaptKnowledgeArray<T>(value: unknown): T[] {
  const payload = unwrapKnowledgeData(value)
  const data = readArrayPayload(payload)

  if (data) return data as T[]
  if (Array.isArray(payload)) return payload as T[]
  if (isRecord(payload) && 'id' in payload) return [payload as T]

  return []
}

export const listKnowledgeDatasetsRequest = (
  params: KnowledgeDatasetQuery,
) =>
  createRequest<KnowledgeListResult<KnowledgeDataset>>(
    'GET',
    `${KNOWLEDGE_API_PREFIX}/datasets`,
    { params },
    adaptKnowledgeList,
  )

export const createKnowledgeDatasetRequest = (
  data: KnowledgeDatasetCreatePayload,
) =>
  createRequest<KnowledgeDataset>(
    'POST',
    `${KNOWLEDGE_API_PREFIX}/datasets`,
    { data },
    adaptKnowledgeItem,
  )

export const getKnowledgeDatasetRequest = (datasetId: string) =>
  createRequest<KnowledgeDataset>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}`,
    undefined,
    adaptKnowledgeItem,
  )

export const updateKnowledgeDatasetRequest = (
  datasetId: string,
  data: KnowledgeDatasetUpdatePayload,
) =>
  createRequest<KnowledgeDataset>(
    'PUT',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}`,
    { data },
    adaptKnowledgeItem,
  )

export const deleteKnowledgeDatasetRequest = (datasetId: string) =>
  createRequest<unknown>(
    'DELETE',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}`,
  )

export const deleteKnowledgeDatasetsRequest = (ids: string[]) =>
  createRequest<unknown>('DELETE', `${KNOWLEDGE_API_PREFIX}/datasets`, {
    data: { ids },
  })

export const searchKnowledgeRequest = (data: KnowledgeSearchPayload) =>
  createRequest<KnowledgeSearchResult[]>(
    'POST',
    `${KNOWLEDGE_API_PREFIX}/search`,
    { data },
    adaptKnowledgeArray,
  )

export const searchKnowledgeDatasetRequest = (
  datasetId: string,
  data: KnowledgeSearchPayload,
) =>
  createRequest<KnowledgeSearchResult[]>(
    'POST',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/search`,
    { data },
    adaptKnowledgeArray,
  )

export const listKnowledgeDocumentsRequest = (
  datasetId: string,
  params: KnowledgeDocumentQuery,
) =>
  createRequest<KnowledgeListResult<KnowledgeDocument>>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents`,
    { params },
    adaptKnowledgeList,
  )

export const uploadKnowledgeDocumentsRequest = (
  datasetId: string,
  data: FormData,
) =>
  createRequest<KnowledgeDocument[]>(
    'POST',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents`,
    { data, headers: { 'Content-Type': 'multipart/form-data' } },
    adaptKnowledgeArray,
  )

export const getKnowledgeDocumentRequest = (
  datasetId: string,
  documentId: string,
) =>
  createRequest<KnowledgeDocument>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents/${documentId}`,
    undefined,
    adaptKnowledgeItem,
  )

export const parseKnowledgeDocumentsRequest = (
  datasetId: string,
  documentIds: string[],
) =>
  createRequest<unknown>(
    'POST',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents/parse`,
    { data: { document_ids: documentIds } },
  )

export const deleteKnowledgeDocumentRequest = (
  datasetId: string,
  documentId: string,
) =>
  createRequest<unknown>(
    'DELETE',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents/${documentId}`,
  )

export const deleteKnowledgeDocumentsRequest = (
  datasetId: string,
  ids: string[],
) =>
  createRequest<unknown>(
    'DELETE',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents`,
    { data: { ids } },
  )
