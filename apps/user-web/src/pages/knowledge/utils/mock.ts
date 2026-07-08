import type {
  KnowledgeDataset,
  KnowledgeDocument,
  KnowledgeSearchResult,
} from '@/api/knowledge'

export const mockKnowledgeDatasets: KnowledgeDataset[] = [
  {
    id: 'dataset-project-docs',
    name: 'Project Docs',
    description: 'Product and engineering documents.',
    embedding_model: 'text-embedding-v4@Tongyi-Qianwen',
    permission: 'me',
    chunk_method: 'naive',
    parser_config: {
      chunk_token_num: 256,
      delimiter: '\n',
    },
    created_at: '2026-07-08T08:00:00Z',
    updated_at: '2026-07-08T08:20:00Z',
  },
]

export const mockKnowledgeDocuments: Record<string, KnowledgeDocument[]> = {
  'dataset-project-docs': [
    {
      id: 'doc-product-prd',
      name: 'product-prd.md',
      parse_status: 'success',
      chunk_count: 18,
      size_bytes: 34_120,
      created_at: '2026-07-08T08:05:00Z',
      updated_at: '2026-07-08T08:12:00Z',
    },
    {
      id: 'doc-api-contract',
      name: 'api-contract.pdf',
      parse_status: 'failed',
      chunk_count: 0,
      size_bytes: 112_800,
      error: 'Parser timeout',
      created_at: '2026-07-08T08:08:00Z',
      updated_at: '2026-07-08T08:18:00Z',
    },
  ],
}

export const mockKnowledgeSearchResults: KnowledgeSearchResult[] = [
  {
    chunk_id: 'chunk-prd-001',
    content: 'Knowledge ingestion should upload documents before parsing.',
    document_name: 'product-prd.md',
    score: 0.9123,
  },
]

export function createMockKnowledgeDataset(
  payload: Pick<KnowledgeDataset, 'name'> & Partial<KnowledgeDataset>,
) {
  const dataset: KnowledgeDataset = {
    id: `dataset-${Date.now()}`,
    name: payload.name,
    chunk_method: payload.chunk_method ?? 'naive',
    created_at: new Date().toISOString(),
    description: payload.description ?? null,
    embedding_model: payload.embedding_model ?? null,
    parser_config: payload.parser_config ?? {
      chunk_token_num: 256,
      delimiter: '\n',
    },
    permission: payload.permission ?? 'me',
    updated_at: new Date().toISOString(),
  }

  mockKnowledgeDatasets.unshift(dataset)
  mockKnowledgeDocuments[dataset.id] = []

  return dataset
}

export function deleteMockKnowledgeDataset(datasetId: string) {
  const index = mockKnowledgeDatasets.findIndex((item) => item.id === datasetId)

  if (index >= 0) mockKnowledgeDatasets.splice(index, 1)
  delete mockKnowledgeDocuments[datasetId]
}

export function uploadMockKnowledgeDocuments(datasetId: string, files: File[]) {
  const documents = mockKnowledgeDocuments[datasetId] ?? []
  const now = new Date().toISOString()

  const nextDocuments = files.map<KnowledgeDocument>((file) => ({
    id: `doc-${Date.now()}-${file.name}`,
    name: file.name,
    parse_status: 'pending',
    size_bytes: file.size,
    created_at: now,
    updated_at: now,
  }))

  mockKnowledgeDocuments[datasetId] = [...nextDocuments, ...documents]

  return nextDocuments
}

export function parseMockKnowledgeDocuments(
  datasetId: string,
  documentIds: string[],
) {
  const now = new Date().toISOString()

  mockKnowledgeDocuments[datasetId] = (
    mockKnowledgeDocuments[datasetId] ?? []
  ).map((document) =>
    documentIds.includes(document.id)
      ? {
          ...document,
          parse_status: 'processing',
          updated_at: now,
        }
      : document,
  )
}

export function retryFailedMockKnowledgeDocument(
  datasetId: string,
  documentId: string,
) {
  parseMockKnowledgeDocuments(datasetId, [documentId])
}

export function searchMockKnowledge(query: string): KnowledgeSearchResult[] {
  if (!query.trim()) return []
  if (query.toLowerCase().includes('empty')) return []
  if (query.toLowerCase().includes('error')) {
    throw new Error('Mock search failed')
  }

  return mockKnowledgeSearchResults
}
