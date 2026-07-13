import {
  DatabaseOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { Alert, Button, Empty, Modal, Space, Tabs, Tag } from 'antd'
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
  type KnowledgeRetrievalChunk,
  type KnowledgeSearchPayload,
} from '@/api/knowledge'
import { globalMessage } from '@/utils/message'

import { KNOWLEDGE_WORKSPACE_TABS } from './constants'
import { KnowledgeSpaces } from './components/KnowledgeSpaces'
import { OverviewPanel } from './components/OverviewPanel'
import { DocumentsPanel } from './components/DocumentsPanel'
import { RetrievalLab } from './components/RetrievalLab'
import { DatasetFormDrawer } from './components/DatasetFormDrawer'
import { UploadDocumentsDrawer } from './components/UploadDocumentsDrawer'
import { KnowledgeInspector } from './components/KnowledgeInspector'
import { useKnowledgeUrlState } from './hooks/useKnowledgeUrlState'
import type { KnowledgeInspectorTarget } from './types'

export function KnowledgeBase() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const knowledgeUrlState = useKnowledgeUrlState()
  const [datasetFormOpen, setDatasetFormOpen] = useState(false)
  const [editingDatasetId, setEditingDatasetId] = useState<string>()
  const [documentPage, setDocumentPage] = useState(1)
  const [documentPageSize, setDocumentPageSize] = useState(20)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false)
  const [inspectorTarget, setInspectorTarget] =
    useState<KnowledgeInspectorTarget>(null)
  const [searchResults, setSearchResults] = useState<KnowledgeRetrievalChunk[]>(
    [],
  )

  const datasetParams = useMemo(
    () => ({
      page: knowledgeUrlState.page,
      page_size: knowledgeUrlState.pageSize,
      ...(knowledgeUrlState.keyword
        ? {
            keywords: knowledgeUrlState.keyword,
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
      knowledgeDocuments_list(
        knowledgeUrlState.datasetId ?? '',
        documentParams,
      ),
    enabled: Boolean(knowledgeUrlState.datasetId),
    placeholderData: keepPreviousData,
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
    onSuccess: (result) => {
      setSearchResults(result.chunks)
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

  const tabItems = KNOWLEDGE_WORKSPACE_TABS.map((item) => ({
    key: item.key,
    label: t(item.labelKey),
    children: workspaceDataset ? (
      {
        details: (
          <OverviewPanel
            dataset={workspaceDataset}
            loading={selectedDatasetDetailQuery.isFetching}
            onEdit={() => openEditDataset(workspaceDataset)}
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
        <Space wrap className="justify-end" size="small">
          <Tag
            className="m-0! inline-flex h-8 items-center justify-center rounded-md! px-2.5! text-[12px] font-medium leading-none"
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
            size="middle"
            onClick={handleRefresh}
          >
            {t('common.actions.refresh')}
          </Button>
        </Space>
      </PageHeader>

      {isRuntimeWarningVisible ? (
        <Alert
          showIcon
          className="mb-3 rounded-lg! border-(--ant-color-warning-border)!"
          message={t('pages.knowledge.runtime.notConfiguredMessage')}
          type="warning"
        />
      ) : null}

      <div className="flex min-h-0 flex-1 gap-4 max-[900px]:flex-col">
        <PageContainer className="flex min-h-0 w-[376px] shrink-0 flex-col overflow-hidden shadow-[0_1px_2px_rgb(15_23_42/0.04)] [contain:paint] max-[900px]:h-[21rem] max-[900px]:w-full">
          <KnowledgeSpaces
            datasets={datasetsQuery.data?.data ?? []}
            error={datasetsQuery.isError}
            keyword={knowledgeUrlState.keyword}
            loading={datasetsQuery.isFetching}
            page={knowledgeUrlState.page}
            pageSize={knowledgeUrlState.pageSize}
            selectedDatasetId={knowledgeUrlState.datasetId}
            total={datasetsQuery.data?.count ?? 0}
            onCreate={openCreateDataset}
            onDelete={confirmDeleteDataset}
            onEdit={openEditDataset}
            onKeywordChange={knowledgeUrlState.setKeyword}
            onPageChange={knowledgeUrlState.setPagination}
            onRetry={() => void datasetsQuery.refetch()}
            onSelect={knowledgeUrlState.selectDataset}
          />
        </PageContainer>

        <PageContainer className="flex min-h-0 flex-1 flex-col overflow-hidden shadow-[0_1px_2px_rgb(15_23_42/0.04)] [contain:paint]">
          {workspaceDataset ? (
            <Tabs
              activeKey={knowledgeUrlState.tab}
              className="flex min-h-0 flex-1 flex-col [&_.ant-tabs-content-holder]:min-h-0 [&_.ant-tabs-content-holder]:flex-1 [&_.ant-tabs-content-holder]:px-6 [&_.ant-tabs-content-holder]:py-5 [&_.ant-tabs-content]:h-full [&_.ant-tabs-content]:min-h-0 [&_.ant-tabs-nav]:mb-0! [&_.ant-tabs-nav]:px-6 [&_.ant-tabs-tab]:py-3 [&_.ant-tabs-tab-btn]:text-[13px] [&_.ant-tabs-tab-btn]:font-medium [&_.ant-tabs-tabpane]:h-full [&_.ant-tabs-tabpane]:min-h-0"
              items={tabItems}
              tabBarGutter={24}
              onChange={(key) =>
                knowledgeUrlState.setTab(
                  key as (typeof KNOWLEDGE_WORKSPACE_TABS)[number]['key'],
                )
              }
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center px-5">
              <Empty
                className="max-w-md rounded-xl border border-dashed border-(--ant-color-border-secondary) bg-[color-mix(in_srgb,var(--ant-color-bg-container)_94%,var(--ant-color-bg-layout))] px-8 py-14"
                description={t(
                  'pages.knowledge.empty.selectDatasetDescription',
                )}
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
