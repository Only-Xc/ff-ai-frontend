import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { DEFAULT_KNOWLEDGE_TAB, KNOWLEDGE_WORKSPACE_TABS } from '../constants'
import type { KnowledgeWorkspaceTab } from '../types'

const VALID_TABS = new Set(KNOWLEDGE_WORKSPACE_TABS.map((item) => item.key))

function normalizeTab(value: string | null): KnowledgeWorkspaceTab {
  if (value === 'overview' || value === 'settings') return 'details'

  return VALID_TABS.has(value as KnowledgeWorkspaceTab)
    ? (value as KnowledgeWorkspaceTab)
    : DEFAULT_KNOWLEDGE_TAB
}

function normalizePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function useKnowledgeUrlState() {
  const [searchParams, setSearchParams] = useSearchParams()

  const state = useMemo(
    () => ({
      datasetId: searchParams.get('dataset_id') ?? undefined,
      keyword: searchParams.get('keyword') ?? '',
      page: normalizePositiveInt(searchParams.get('page'), 1),
      pageSize: normalizePositiveInt(searchParams.get('page_size'), 20),
      tab: normalizeTab(searchParams.get('tab')),
    }),
    [searchParams],
  )

  const updateState = (patch: {
    datasetId?: string | null
    keyword?: string | null
    page?: number | null
    pageSize?: number | null
    tab?: KnowledgeWorkspaceTab | null
  }) => {
    const next = new URLSearchParams(searchParams)

    if ('datasetId' in patch) {
      if (patch.datasetId) next.set('dataset_id', patch.datasetId)
      else next.delete('dataset_id')
    }

    if ('keyword' in patch) {
      if (patch.keyword) next.set('keyword', patch.keyword)
      else next.delete('keyword')
    }

    if ('page' in patch) {
      if (patch.page && patch.page > 1) next.set('page', String(patch.page))
      else next.delete('page')
    }

    if ('pageSize' in patch) {
      if (patch.pageSize) next.set('page_size', String(patch.pageSize))
      else next.delete('page_size')
    }

    if ('tab' in patch) {
      if (patch.tab) next.set('tab', patch.tab)
      else next.delete('tab')
    }

    setSearchParams(next, { replace: true })
  }

  const selectDataset = (datasetId: string) => {
    updateState({
      datasetId,
      tab: DEFAULT_KNOWLEDGE_TAB,
    })
  }

  const clearDataset = () => {
    updateState({
      datasetId: null,
      tab: DEFAULT_KNOWLEDGE_TAB,
    })
  }

  const setTab = (tab: KnowledgeWorkspaceTab) => {
    updateState({ tab })
  }

  const setKeyword = (keyword: string) => {
    updateState({
      keyword,
      page: 1,
    })
  }

  const setPagination = (page: number, pageSize: number) => {
    updateState({
      page,
      pageSize,
    })
  }

  return {
    ...state,
    clearDataset,
    selectDataset,
    setKeyword,
    setPagination,
    setTab,
    updateState,
  }
}
