import type {
  KnowledgeDataset,
  KnowledgeDocument,
  KnowledgeDocumentParseStatus,
  KnowledgeListResult,
  KnowledgeSearchResult,
} from '@/api/knowledge'

import { DOCUMENT_STATUS_STAGE_MAP } from '../constants'
import type {
  NormalizedKnowledgeDataset,
  NormalizedKnowledgeDocument,
  NormalizedKnowledgeSearchResult,
} from '../types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function pickArray(value: unknown): unknown[] | undefined {
  if (isUnknownArray(value)) return value
  if (!isRecord(value)) return undefined

  const candidates = [value.data, value.items, value.list]
  const data = candidates.find(isUnknownArray)

  return data
}

function pickCount(value: unknown, fallback: number): number {
  if (!isRecord(value)) return fallback

  const count = value.count ?? value.total

  return typeof count === 'number' ? count : fallback
}

export function normalizeKnowledgeList<T>(value: unknown): KnowledgeListResult<T> {
  const root = isRecord(value) && isRecord(value.data) ? value.data : value
  const data = pickArray(root) ?? []

  return {
    data: data as T[],
    count: pickCount(root, data.length),
  }
}

export function getDocumentParseStatus(
  document: KnowledgeDocument,
): KnowledgeDocumentParseStatus | null | undefined {
  return document.parse_status ?? document.status ?? document.run
}

export function normalizeKnowledgeDataset(
  dataset: KnowledgeDataset,
): NormalizedKnowledgeDataset {
  return {
    ...dataset,
    displayCreatedAt: dataset.created_at ?? dataset.create_time ?? null,
    displayUpdatedAt:
      dataset.updated_at ?? dataset.created_at ?? dataset.create_time ?? null,
  }
}

export function normalizeKnowledgeDocument(
  document: KnowledgeDocument,
): NormalizedKnowledgeDocument {
  const parseStatus = getDocumentParseStatus(document)
  const statusKey = String(parseStatus ?? '').toLowerCase()

  return {
    ...document,
    displayCreatedAt: document.created_at ?? document.create_time ?? null,
    displayName: document.name ?? document.filename ?? document.id,
    displayUpdatedAt:
      document.updated_at ?? document.parse_time ?? document.created_at ?? null,
    ingestionStage: DOCUMENT_STATUS_STAGE_MAP[statusKey] ?? 'unknown',
    parseStatus,
  }
}

export function normalizeKnowledgeSearchResult(
  result: KnowledgeSearchResult,
): NormalizedKnowledgeSearchResult {
  return {
    ...result,
    displayChunkId: result.chunk_id ?? result.id,
    displayContent:
      result.content ??
      result.content_with_weight ??
      result.content_ltks ??
      result.text ??
      '',
    displayDocumentName:
      result.document_name ??
      result.doc_name ??
      result.docnm_kwd ??
      result.document_id ??
      '-',
    displayScore:
      result.score ??
      result.similarity ??
      result.term_similarity ??
      result.vector_similarity,
  }
}
