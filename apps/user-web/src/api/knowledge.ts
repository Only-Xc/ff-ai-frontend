import {
  createKnowledgeDatasetRequest,
  deleteKnowledgeDatasetRequest,
  deleteKnowledgeDatasetsRequest,
  deleteKnowledgeDocumentRequest,
  deleteKnowledgeDocumentsRequest,
  getAiRuntimeStatusRequest,
  getKnowledgeDatasetRequest,
  getKnowledgeDocumentRequest,
  listKnowledgeDatasetsRequest,
  listKnowledgeDocumentsRequest,
  parseKnowledgeDocumentsRequest,
  searchKnowledgeDatasetRequest,
  searchKnowledgeRequest,
  updateKnowledgeDatasetRequest,
  uploadKnowledgeDocumentsRequest,
  type KnowledgeDatasetQuery,
  type KnowledgeDocumentQuery,
  type KnowledgeSearchPayload,
} from '@ff-ai-frontend/api'

import { request } from './_request'

export type {
  AiRuntimeStatus,
  KnowledgeChunkMethod,
  KnowledgeDataset,
  KnowledgeDatasetCreatePayload,
  KnowledgeDatasetQuery,
  KnowledgeDatasetUpdatePayload,
  KnowledgeDocument,
  KnowledgeDocumentParseStatus,
  KnowledgeDocumentQuery,
  KnowledgeListResult,
  KnowledgeParserConfig,
  KnowledgePermission,
  KnowledgeSearchPayload,
  KnowledgeSearchResult,
} from '@ff-ai-frontend/api'

export const knowledgeKeys = {
  all: ['knowledge'] as const,
  runtimeStatus: () => [...knowledgeKeys.all, 'runtime-status'] as const,
  datasets: () => [...knowledgeKeys.all, 'datasets'] as const,
  datasetList: (params: KnowledgeDatasetQuery) =>
    [...knowledgeKeys.datasets(), 'list', params] as const,
  dataset: (datasetId: string | undefined) =>
    [...knowledgeKeys.datasets(), 'detail', datasetId] as const,
  documents: (datasetId: string | undefined) =>
    [...knowledgeKeys.all, 'documents', datasetId] as const,
  documentList: (
    datasetId: string | undefined,
    params: KnowledgeDocumentQuery,
  ) => [...knowledgeKeys.documents(datasetId), 'list', params] as const,
  document: (datasetId: string | undefined, documentId: string | undefined) =>
    [...knowledgeKeys.documents(datasetId), 'detail', documentId] as const,
  search: (
    datasetId: string | undefined,
    payload: KnowledgeSearchPayload | undefined,
  ) => [...knowledgeKeys.all, 'search', datasetId, payload] as const,
}

export const knowledgeRuntime_status = request(getAiRuntimeStatusRequest)
export const knowledgeDatasets_list = request(listKnowledgeDatasetsRequest)
export const knowledgeDatasets_create = request(createKnowledgeDatasetRequest)
export const knowledgeDatasets_get = request(getKnowledgeDatasetRequest)
export const knowledgeDatasets_update = request(updateKnowledgeDatasetRequest)
export const knowledgeDatasets_delete = request(deleteKnowledgeDatasetRequest)
export const knowledgeDatasets_deleteMany = request(
  deleteKnowledgeDatasetsRequest,
)
export const knowledgeDocuments_list = request(listKnowledgeDocumentsRequest)
export const knowledgeDocuments_upload = request(
  uploadKnowledgeDocumentsRequest,
)
export const knowledgeDocuments_get = request(getKnowledgeDocumentRequest)
export const knowledgeDocuments_parse = request(parseKnowledgeDocumentsRequest)
export const knowledgeDocuments_delete = request(deleteKnowledgeDocumentRequest)
export const knowledgeDocuments_deleteMany = request(
  deleteKnowledgeDocumentsRequest,
)
export const knowledgeSearch_all = request(searchKnowledgeRequest)
export const knowledgeSearch_dataset = request(searchKnowledgeDatasetRequest)
