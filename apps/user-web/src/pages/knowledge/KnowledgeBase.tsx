import {
  DatabaseOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Empty, Modal, Space, Tabs, Tag, Typography } from 'antd'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { PageContainer, PageHeader } from '@ff-ai-frontend/components'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  knowledgeDatasets_create,
  knowledgeDatasets_list,
  knowledgeDatasets_delete,
  knowledgeDatasets_deleteMany,
  knowledgeDatasets_get,
  knowledgeDatasets_update,
  knowledgeDocuments_delete,
  knowledgeDocuments_deleteMany,
  knowledgeDocuments_list,
  knowledgeDocuments_parse,
  knowledgeDocuments_upload,
  knowledgeKeys,
  knowledgeRuntime_status,
  knowledgeSearch_dataset,
  type KnowledgeDatasetCreatePayload,
  type KnowledgeDataset,
  type KnowledgeDocument,
  type KnowledgeSearchPayload,
} from '@/api/knowledge'
import { globalMessage } from '@/utils/message'

import {
  DEFAULT_DOCUMENT_STATUS_FILTER,
  KNOWLEDGE_WORKSPACE_TABS,
} from './constants'
import { KnowledgeSpaces } from './components/KnowledgeSpaces'
import { OverviewPanel } from './components/OverviewPanel'
import { DocumentsPanel } from './components/DocumentsPanel'
import { RetrievalLab } from './components/RetrievalLab'
import { SettingsPanel } from './components/SettingsPanel'
import { DatasetFormDrawer } from './components/DatasetFormDrawer'
import { UploadDocumentsDrawer } from './components/UploadDocumentsDrawer'
import { KnowledgeInspector } from './components/KnowledgeInspector'
import {
  normalizeKnowledgeDocument,
  normalizeKnowledgeList,
  normalizeKnowledgeSearchResult,
} from './utils/adapters'
import { useKnowledgeUrlState } from './hooks/useKnowledgeUrlState'
import type {
  KnowledgeDocumentStatusFilter,
  KnowledgeInspectorTarget,
} from './types'

const { Text } = Typography

export function KnowledgeBase() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const knowledgeUrlState = useKnowledgeUrlState()
  const [datasetFormOpen, setDatasetFormOpen] = useState(false)
  const [editingDatasetId, setEditingDatasetId] = useState<string>()
  const [documentPage, setDocumentPage] = useState(1)
  const [documentPageSize, setDocumentPageSize] = useState(20)
  const [documentStatusFilter, setDocumentStatusFilter] =
    useState<KnowledgeDocumentStatusFilter>(DEFAULT_DOCUMENT_STATUS_FILTER)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [inspectorTarget, setInspectorTarget] =
    useState<KnowledgeInspectorTarget>(null)
  const [searchResults, setSearchResults] = useState<
    ReturnType<typeof normalizeKnowledgeSearchResult>[]
  >([])

  const datasetParams = useMemo(
    () => ({
      page: knowledgeUrlState.page,
      page_size: knowledgeUrlState.pageSize,
      ...(knowledgeUrlState.keyword
        ? {
            keywords: knowledgeUrlState.keyword,
            name: knowledgeUrlState.keyword,
          }
        : {}),
    }),
    [
      knowledgeUrlState.keyword,
      knowledgeUrlState.page,
      knowledgeUrlState.pageSize,
    ],
  )

  const runtimeStatusQuery = useQuery({
    queryKey: knowledgeKeys.runtimeStatus(),
    queryFn: knowledgeRuntime_status,
  })

  const datasetsQuery = useQuery({
    queryKey: knowledgeKeys.datasetList(datasetParams),
    queryFn: () => knowledgeDatasets_list(datasetParams),
    placeholderData: keepPreviousData,
    select: (response) => normalizeKnowledgeList<KnowledgeDataset>(response),
  })

  const isRagflowReady =
    runtimeStatusQuery.data?.ragflow_configured === true &&
    runtimeStatusQuery.data?.ragflow_api_key_configured === true

  const isRuntimeWarningVisible =
    runtimeStatusQuery.isSuccess && !isRagflowReady

  const selectedDataset = datasetsQuery.data?.data.find(
    (item) => item.id === knowledgeUrlState.datasetId,
  )

  useEffect(() => {
    setDocumentPage(1)
    setDocumentStatusFilter(DEFAULT_DOCUMENT_STATUS_FILTER)
    setSelectedDocumentIds([])
    setSearchResults([])
    setInspectorTarget(null)
  }, [knowledgeUrlState.datasetId])

  const editingDatasetQuery = useQuery({
    queryKey: knowledgeKeys.dataset(editingDatasetId),
    queryFn: () => knowledgeDatasets_get(editingDatasetId ?? ''),
    enabled: datasetFormOpen && Boolean(editingDatasetId),
  })

  const documentParams = useMemo(
    () => ({
      page: documentPage,
      page_size: documentPageSize,
    }),
    [documentPage, documentPageSize],
  )

  const documentsQuery = useQuery({
    queryKey: knowledgeKeys.documentList(
      knowledgeUrlState.datasetId,
      documentParams,
    ),
    queryFn: () =>
      knowledgeDocuments_list(knowledgeUrlState.datasetId ?? '', documentParams),
    enabled: Boolean(knowledgeUrlState.datasetId),
    placeholderData: keepPreviousData,
    select: (response) => {
      const normalized = normalizeKnowledgeList<KnowledgeDocument>(response)

      return {
        ...normalized,
        data: normalized.data.map(normalizeKnowledgeDocument),
      }
    },
  })

  const selectedDatasetDetailQuery = useQuery({
    queryKey: knowledgeKeys.dataset(knowledgeUrlState.datasetId),
    queryFn: () => knowledgeDatasets_get(knowledgeUrlState.datasetId ?? ''),
    enabled: Boolean(knowledgeUrlState.datasetId),
  })

  const workspaceDataset = selectedDatasetDetailQuery.data ?? selectedDataset

  const invalidateDatasets = () =>
    queryClient.invalidateQueries({ queryKey: knowledgeKeys.datasets() })

  const deleteDatasetMutation = useMutation({
    mutationFn: knowledgeDatasets_delete,
    onSuccess: async (_, datasetId) => {
      if (datasetId === knowledgeUrlState.datasetId) {
        knowledgeUrlState.clearDataset()
      }
      await invalidateDatasets()
    },
  })

  const deleteDatasetsMutation = useMutation({
    mutationFn: knowledgeDatasets_deleteMany,
    onSuccess: async (_, datasetIds) => {
      if (
        knowledgeUrlState.datasetId &&
        datasetIds.includes(knowledgeUrlState.datasetId)
      ) {
        knowledgeUrlState.clearDataset()
      }
      await invalidateDatasets()
    },
  })

  const createDatasetMutation = useMutation({
    mutationFn: knowledgeDatasets_create,
    onSuccess: async (dataset) => {
      globalMessage.success(t('pages.knowledge.feedback.datasetCreated'))
      setDatasetFormOpen(false)
      setEditingDatasetId(undefined)
      await invalidateDatasets()
      if (dataset.id) {
        knowledgeUrlState.selectDataset(dataset.id)
      }
    },
  })

  const updateDatasetMutation = useMutation({
    mutationFn: ({
      datasetId,
      payload,
    }: {
      datasetId: string
      payload: KnowledgeDatasetCreatePayload
    }) => knowledgeDatasets_update(datasetId, payload),
    onSuccess: async (_, variables) => {
      globalMessage.success(t('pages.knowledge.feedback.datasetUpdated'))
      setDatasetFormOpen(false)
      setEditingDatasetId(undefined)
      await Promise.all([
        invalidateDatasets(),
        queryClient.invalidateQueries({
          queryKey: knowledgeKeys.dataset(variables.datasetId),
        }),
      ])
    },
  })

  const parseDocumentsMutation = useMutation({
    mutationFn: (documentIds: string[]) => {
      if (!knowledgeUrlState.datasetId) {
        throw new Error('dataset_id is required')
      }

      return knowledgeDocuments_parse(knowledgeUrlState.datasetId, documentIds)
    },
    onSuccess: async () => {
      globalMessage.success(t('pages.knowledge.feedback.parseSubmitted'))
      await queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(knowledgeUrlState.datasetId),
      })
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId: string) => {
      if (!knowledgeUrlState.datasetId) {
        throw new Error('dataset_id is required')
      }

      return knowledgeDocuments_delete(knowledgeUrlState.datasetId, documentId)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(knowledgeUrlState.datasetId),
      })
    },
  })

  const deleteDocumentsMutation = useMutation({
    mutationFn: (documentIds: string[]) => {
      if (!knowledgeUrlState.datasetId) {
        throw new Error('dataset_id is required')
      }

      return knowledgeDocuments_deleteMany(
        knowledgeUrlState.datasetId,
        documentIds,
      )
    },
    onSuccess: async () => {
      setSelectedDocumentIds([])
      await queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(knowledgeUrlState.datasetId),
      })
    },
  })

  const uploadDocumentsMutation = useMutation({
    mutationFn: ({
      files,
      parentPath,
    }: {
      files: File[]
      parentPath?: string
    }) => {
      const formData = new FormData()

      files.forEach((file) => {
        formData.append('files', file)
      })

      if (parentPath) {
        formData.append('parent_path', parentPath)
      }

      if (!knowledgeUrlState.datasetId) {
        throw new Error('dataset_id is required')
      }

      return knowledgeDocuments_upload(knowledgeUrlState.datasetId, formData)
    },
    onSuccess: async () => {
      globalMessage.success(t('pages.knowledge.feedback.documentsUploaded'))
      setUploadDrawerOpen(false)
      await queryClient.invalidateQueries({
        queryKey: knowledgeKeys.documents(knowledgeUrlState.datasetId),
      })
    },
  })

  const searchMutation = useMutation({
    mutationFn: (payload: KnowledgeSearchPayload) => {
      if (!knowledgeUrlState.datasetId) {
        throw new Error('dataset_id is required')
      }

      return knowledgeSearch_dataset(knowledgeUrlState.datasetId, payload)
    },
    onSuccess: (results) => {
      setSearchResults(results.map(normalizeKnowledgeSearchResult))
    },
  })

  const handleRefresh = () => {
    void Promise.all([
      runtimeStatusQuery.refetch(),
      datasetsQuery.refetch(),
      documentsQuery.refetch(),
    ])
  }

  const openCreateDataset = () => {
    setEditingDatasetId(undefined)
    setDatasetFormOpen(true)
  }

  const openEditDataset = (dataset: KnowledgeDataset) => {
    setEditingDatasetId(dataset.id)
    setDatasetFormOpen(true)
  }

  const handleCloseDatasetForm = () => {
    setDatasetFormOpen(false)
    setEditingDatasetId(undefined)
  }

  const handleSubmitDataset = (payload: KnowledgeDatasetCreatePayload) => {
    if (editingDatasetId) {
      updateDatasetMutation.mutate({ datasetId: editingDatasetId, payload })
      return
    }

    createDatasetMutation.mutate(payload)
  }

  const handleDocumentPageChange = (page: number, pageSize: number) => {
    setDocumentPageSize(pageSize)
    setDocumentPage(pageSize === documentPageSize ? page : 1)
  }

  const handleDocumentStatusFilterChange = (
    filter: KnowledgeDocumentStatusFilter,
  ) => {
    setDocumentStatusFilter(filter)
    setDocumentPage(1)
  }

  const handleParseDocuments = (documentIds: string[]) => {
    if (documentIds.length === 0) return

    parseDocumentsMutation.mutate(documentIds)
  }

  const confirmDeleteDocument = (document: KnowledgeDocument) => {
    Modal.confirm({
      title: t('pages.knowledge.confirm.deleteDocumentTitle'),
      content: t('pages.knowledge.confirm.deleteDocumentContent'),
      okButtonProps: { danger: true },
      okText: t('common.actions.delete'),
      onOk: () => deleteDocumentMutation.mutateAsync(document.id),
    })
  }

  const confirmDeleteDocuments = (documentIds: string[]) => {
    Modal.confirm({
      title: t('pages.knowledge.confirm.deleteDocumentsTitle'),
      content: t('pages.knowledge.confirm.deleteDocumentsContent', {
        count: documentIds.length,
      }),
      okButtonProps: { danger: true },
      okText: t('common.actions.delete'),
      onOk: () => deleteDocumentsMutation.mutateAsync(documentIds),
    })
  }

  const confirmDeleteDataset = (dataset: KnowledgeDataset) => {
    Modal.confirm({
      title: t('pages.knowledge.confirm.deleteDatasetTitle'),
      content: t('pages.knowledge.confirm.deleteDatasetContent'),
      okButtonProps: { danger: true },
      okText: t('common.actions.delete'),
      onOk: () => deleteDatasetMutation.mutateAsync(dataset.id),
    })
  }

  const confirmDeleteDatasets = (datasetIds: string[]) => {
    Modal.confirm({
      title: t('pages.knowledge.confirm.deleteDatasetsTitle'),
      content: t('pages.knowledge.confirm.deleteDatasetsContent', {
        count: datasetIds.length,
      }),
      okButtonProps: { danger: true },
      okText: t('common.actions.delete'),
      onOk: () => deleteDatasetsMutation.mutateAsync(datasetIds),
    })
  }

  const tabItems = KNOWLEDGE_WORKSPACE_TABS.map((item) => ({
    key: item.key,
    label: t(item.labelKey),
    children: workspaceDataset ? (
      {
        overview: (
          <OverviewPanel
            dataset={workspaceDataset}
            documents={documentsQuery.data?.data ?? []}
            loading={documentsQuery.isFetching}
            onOpenDocuments={() => knowledgeUrlState.setTab('documents')}
            onOpenRetrieval={() => knowledgeUrlState.setTab('retrieval')}
          />
        ),
        documents: (
          <DocumentsPanel
            documents={documentsQuery.data?.data ?? []}
            error={documentsQuery.isError}
            loading={
              documentsQuery.isFetching ||
              parseDocumentsMutation.isPending ||
              deleteDocumentMutation.isPending ||
              deleteDocumentsMutation.isPending
            }
            page={documentPage}
            pageSize={documentPageSize}
            selectedDocumentIds={selectedDocumentIds}
            statusFilter={documentStatusFilter}
            total={documentsQuery.data?.count ?? 0}
            onBatchDelete={confirmDeleteDocuments}
            onBatchParse={handleParseDocuments}
            onDelete={confirmDeleteDocument}
            onOpenDetail={(document) =>
              setInspectorTarget({ type: 'document', document })
            }
            onOpenUpload={() => setUploadDrawerOpen(true)}
            onPageChange={handleDocumentPageChange}
            onParse={(document) => handleParseDocuments([document.id])}
            onRetry={() => void documentsQuery.refetch()}
            onSelectionChange={setSelectedDocumentIds}
            onStatusFilterChange={handleDocumentStatusFilterChange}
          />
        ),
        retrieval: (
          <RetrievalLab
            dataset={workspaceDataset}
            error={searchMutation.error}
            loading={searchMutation.isPending}
            results={searchResults}
            onInspectResult={(result) =>
              setInspectorTarget({ type: 'search-result', result })
            }
            onSearch={(payload) => searchMutation.mutate(payload)}
          />
        ),
        settings: (
          <SettingsPanel
            dataset={workspaceDataset}
            error={selectedDatasetDetailQuery.isError}
            loading={selectedDatasetDetailQuery.isFetching}
            onEdit={() => openEditDataset(workspaceDataset)}
            onRetry={() => void selectedDatasetDetailQuery.refetch()}
          />
        ),
      }[item.key]
    ) : (
      <Empty
        className="py-16"
        description={t('pages.knowledge.empty.selectDatasetDescription')}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    ),
  }))

  return (
    <div className="flex h-[calc(100vh-var(--ant-layout-header-height)-10px)] min-h-0 w-full flex-col bg-transparent">
      <PageHeader
        subtitle={t('pages.knowledge.subtitle')}
        title={t('pages.knowledge.title')}
      >
        <Space wrap size="small">
          <Tag
            color={isRagflowReady ? 'success' : 'warning'}
            icon={<DatabaseOutlined />}
          >
            {isRagflowReady
              ? t('pages.knowledge.runtime.ready')
              : t('pages.knowledge.runtime.notReady')}
          </Tag>
          <Button
            icon={<ReloadOutlined />}
            loading={runtimeStatusQuery.isFetching || datasetsQuery.isFetching}
            onClick={handleRefresh}
          >
            {t('common.actions.refresh')}
          </Button>
          <Button
            icon={<PlusOutlined />}
            type="primary"
            onClick={openCreateDataset}
          >
            {t('pages.knowledge.actions.createDataset')}
          </Button>
        </Space>
      </PageHeader>

      {isRuntimeWarningVisible ? (
        <Alert
          showIcon
          className="mb-3"
          message={t('pages.knowledge.runtime.notConfiguredMessage')}
          type="warning"
        />
      ) : null}

      <div className="flex min-h-0 flex-1 gap-3 max-[900px]:flex-col">
        <PageContainer className="flex min-h-0 w-[360px] shrink-0 flex-col overflow-hidden max-[900px]:h-80 max-[900px]:w-full">
          <KnowledgeSpaces
            datasets={datasetsQuery.data?.data ?? []}
            error={datasetsQuery.isError}
            keyword={knowledgeUrlState.keyword}
            loading={datasetsQuery.isFetching}
            page={knowledgeUrlState.page}
            pageSize={knowledgeUrlState.pageSize}
            selectedDatasetId={knowledgeUrlState.datasetId}
            total={datasetsQuery.data?.count ?? 0}
            onBatchDelete={confirmDeleteDatasets}
            onCreate={openCreateDataset}
            onDelete={confirmDeleteDataset}
            onEdit={openEditDataset}
            onKeywordChange={knowledgeUrlState.setKeyword}
            onPageChange={knowledgeUrlState.setPagination}
            onRetry={() => void datasetsQuery.refetch()}
            onSelect={knowledgeUrlState.selectDataset}
          />
        </PageContainer>

        <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {workspaceDataset ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-b-(--ant-color-border-secondary) px-5 py-4">
              <Space direction="vertical" size={2}>
                <Text strong>{workspaceDataset.name}</Text>
                <Text copyable type="secondary">
                  {workspaceDataset.id}
                </Text>
              </Space>
              <Button
                icon={<ReloadOutlined />}
                loading={datasetsQuery.isFetching}
                onClick={() => void datasetsQuery.refetch()}
              >
                {t('common.actions.refresh')}
              </Button>
            </div>
          ) : null}

          {workspaceDataset ? (
            <Tabs
              activeKey={knowledgeUrlState.tab}
              className="min-h-0 flex-1 px-5"
              items={tabItems}
              onChange={(key) =>
                knowledgeUrlState.setTab(
                  key as (typeof KNOWLEDGE_WORKSPACE_TABS)[number]['key'],
                )
              }
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center px-5">
              <Empty
                description={t('pages.knowledge.empty.selectDatasetDescription')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={openCreateDataset}
                >
                  {t('pages.knowledge.actions.createDataset')}
                </Button>
              </Empty>
            </div>
          )}
        </PageContainer>
      </div>

      <DatasetFormDrawer
        confirmLoading={
          createDatasetMutation.isPending || updateDatasetMutation.isPending
        }
        dataset={editingDatasetQuery.data}
        loadError={editingDatasetQuery.isError}
        loading={editingDatasetQuery.isFetching}
        mode={editingDatasetId ? 'edit' : 'create'}
        open={datasetFormOpen}
        onClose={handleCloseDatasetForm}
        onRetry={() => void editingDatasetQuery.refetch()}
        onSubmit={handleSubmitDataset}
      />

      <UploadDocumentsDrawer
        confirmLoading={uploadDocumentsMutation.isPending}
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        onSubmit={(payload) => uploadDocumentsMutation.mutate(payload)}
      />

      <KnowledgeInspector
        open={Boolean(inspectorTarget)}
        target={inspectorTarget}
        onClose={() => setInspectorTarget(null)}
      />
    </div>
  )
}

export default KnowledgeBase
