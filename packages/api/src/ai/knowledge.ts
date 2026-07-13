import { createRequest, path } from '../client.js'

const AI_GENERATION_PREFIX = '/api/v1/ai-generation'
const KNOWLEDGE_API_PREFIX = `${AI_GENERATION_PREFIX}/api/ai/knowledge`

type KnowledgeDateTime = number | string | null

export type KnowledgePermission = 'me' | 'team'
export type KnowledgeChunkMethod =
  | 'book'
  | 'email'
  | 'laws'
  | 'manual'
  | 'naive'
  | 'one'
  | 'paper'
  | 'picture'
  | 'presentation'
  | 'qa'
  | 'table'
  | 'tag'

export type KnowledgeDocumentRunStatus =
  | 'UNSTART'
  | 'RUNNING'
  | 'CANCEL'
  | 'DONE'
  | 'FAIL'

export interface KnowledgeParserConfig {
  chunk_token_num?: number
  delimiter?: string
  [key: string]: unknown
}

export interface KnowledgeDataset {
  id: string
  name: string
  avatar?: string | null
  description?: string | null
  embedding_model: string
  permission: KnowledgePermission
  chunk_method: KnowledgeChunkMethod
  parser_config: KnowledgeParserConfig
  create_time: KnowledgeDateTime
  create_date?: KnowledgeDateTime
  update_time: KnowledgeDateTime
  update_date?: KnowledgeDateTime
  document_count: number
  chunk_count: number
  token_num?: number
  language?: string | null
  similarity_threshold?: number
  vector_similarity_weight?: number
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

export interface KnowledgeUploadedDocument {
  id: string
  name: string
  dataset_id: string
  chunk_method: KnowledgeChunkMethod
  parser_config: KnowledgeParserConfig
  run: KnowledgeDocumentRunStatus
  size: number
  type: string
  location?: string | null
  created_by?: string
  thumbnail?: string | null
}

export interface KnowledgeDocument extends KnowledgeUploadedDocument {
  progress: number
  progress_msg: string
  chunk_count: number
  token_count: number
  source_type: string
  process_begin_at?: KnowledgeDateTime
  process_duration: number
  create_time: KnowledgeDateTime
  create_date?: KnowledgeDateTime
  update_time: KnowledgeDateTime
  update_date?: KnowledgeDateTime
}

export interface KnowledgeDocumentQuery {
  page?: number
  page_size?: number
  keywords?: string
  orderby?: string
  desc?: boolean
  run?: KnowledgeDocumentRunStatus[]
}

export interface KnowledgeSearchPayload {
  question: string
  top_k: number
  dataset_ids?: string[]
  page?: number
  page_size?: number
  similarity_threshold?: number
  vector_similarity_weight?: number
}

export interface KnowledgeRetrievalChunk {
  id: string
  content: string
  document_id: string
  document_keyword: string
  dataset_id: string
  similarity: number
  vector_similarity: number
  term_similarity: number
  important_keywords?: string[]
  questions?: string[]
  highlight?: string
}

export interface KnowledgeRetrievalDocumentAggregation {
  count: number
  doc_id: string
  doc_name: string
}

export interface KnowledgeRetrievalResult {
  total: number
  chunks: KnowledgeRetrievalChunk[]
  doc_aggs: KnowledgeRetrievalDocumentAggregation[]
}

export interface KnowledgeListResult<T> {
  data: T[]
  count: number
}

export interface UploadKnowledgeDocumentsPayload {
  files: File[]
  parent_path?: string
}

interface KnowledgeDataResponse<T> {
  code: number
  data: T
  message?: string
}

interface KnowledgeProxyResponse<T> {
  code: number
  data: T
  message?: string
}

interface KnowledgeDatasetListResponse {
  code: number
  data: KnowledgeDataset[]
  total_datasets: number
  message?: string
}

interface KnowledgeDocumentListResponse {
  code: number
  data: {
    docs: KnowledgeDocument[]
    total: number
  }
  message?: string
}

function readKnowledgeData<T>(
  response: KnowledgeProxyResponse<KnowledgeDataResponse<T>>,
): T {
  return response.data.data
}

function readDatasetList(
  response: KnowledgeProxyResponse<KnowledgeDatasetListResponse>,
): KnowledgeListResult<KnowledgeDataset> {
  return {
    data: response.data.data,
    count: response.data.total_datasets,
  }
}

function readDocumentList(
  response: KnowledgeProxyResponse<KnowledgeDocumentListResponse>,
): KnowledgeListResult<KnowledgeDocument> {
  return {
    data: response.data.data.docs,
    count: response.data.data.total,
  }
}

function readDocumentItem(
  response: KnowledgeProxyResponse<KnowledgeDocumentListResponse>,
): KnowledgeDocument {
  return response.data.data.docs[0]
}

export const listKnowledgeDatasetsRequest = (params: KnowledgeDatasetQuery) =>
  createRequest<KnowledgeListResult<KnowledgeDataset>>(
    'GET',
    `${KNOWLEDGE_API_PREFIX}/datasets`,
    { params },
    readDatasetList,
  )

export const createKnowledgeDatasetRequest = (
  data: KnowledgeDatasetCreatePayload,
) =>
  createRequest<KnowledgeDataset>(
    'POST',
    `${KNOWLEDGE_API_PREFIX}/datasets`,
    { data },
    readKnowledgeData,
  )

export const getKnowledgeDatasetRequest = (datasetId: string) =>
  createRequest<KnowledgeDataset>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}`,
    undefined,
    (response: KnowledgeProxyResponse<KnowledgeDatasetListResponse>) =>
      response.data.data[0],
  )

export const updateKnowledgeDatasetRequest = (
  datasetId: string,
  data: KnowledgeDatasetUpdatePayload,
) =>
  createRequest<KnowledgeDataset>(
    'PUT',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}`,
    { data },
    readKnowledgeData,
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
  createRequest<KnowledgeRetrievalResult>(
    'POST',
    `${KNOWLEDGE_API_PREFIX}/search`,
    { data },
    readKnowledgeData,
  )

export const searchKnowledgeDatasetRequest = (
  datasetId: string,
  data: KnowledgeSearchPayload,
) =>
  createRequest<KnowledgeRetrievalResult>(
    'POST',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/search`,
    { data },
    readKnowledgeData,
  )

export const listKnowledgeDocumentsRequest = (
  datasetId: string,
  params: KnowledgeDocumentQuery,
) =>
  createRequest<KnowledgeListResult<KnowledgeDocument>>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents`,
    { params },
    readDocumentList,
  )

export const uploadKnowledgeDocumentsRequest = (
  datasetId: string,
  data: FormData,
) =>
  createRequest<KnowledgeUploadedDocument[]>(
    'POST',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents`,
    { data, headers: { 'Content-Type': 'multipart/form-data' } },
    readKnowledgeData,
  )

export const getKnowledgeDocumentRequest = (
  datasetId: string,
  documentId: string,
) =>
  createRequest<KnowledgeDocument>(
    'GET',
    path`/api/v1/ai-generation/api/ai/knowledge/datasets/${datasetId}/documents/${documentId}`,
    undefined,
    readDocumentItem,
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
