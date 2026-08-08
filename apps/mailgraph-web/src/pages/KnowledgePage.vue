<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  knowledgeApi,
  type KnowledgeFile,
  type KnowledgeFolder,
  type KnowledgeSearchChunk,
} from '@/api'
import SvgIcon from '@/components/SvgIcon.vue'
import { platformLocale, t } from '@/platformContext'

const router = useRouter()

const tree = ref<KnowledgeFolder[]>([])
const files = ref<KnowledgeFile[]>([])
const totalFiles = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const selectedFileIds = ref<Set<string>>(new Set())
const moveMode = ref<'files' | 'folder' | null>(null)
const targetFolderId = ref('')
const moving = ref(false)
const selectedFolderId = ref('')
const expanded = ref<Set<string>>(new Set())
const loading = ref(false)
const uploading = ref(false)
const dragging = ref(false)
const error = ref('')
const fileInput = ref<HTMLInputElement>()
const fileKeyword = ref('')
const createParent = ref<string | null | undefined>(undefined)
const newFolderName = ref('')
const searchOpen = ref(false)
const searchQuery = ref('')
const searching = ref(false)
const searchError = ref('')
const searchResults = ref<KnowledgeSearchChunk[]>([])
const searchHasRun = ref(false)
const searchEmbeddingModel = ref('text-embedding-v4')
const folderIdCopyStatus = ref<'idle' | 'success' | 'error'>('idle')
const RETRIEVAL_TOP_K = 10
const MAX_UPLOAD_FILE_SIZE = 500 * 1024 * 1024
let pollTimer: ReturnType<typeof setInterval> | null = null
let folderIdCopyTimer: ReturnType<typeof setTimeout> | null = null

interface FlatFolder extends KnowledgeFolder { depth: number }

const flatFolders = computed<FlatFolder[]>(() => {
  const result: FlatFolder[] = []
  const visit = (nodes: KnowledgeFolder[], depth: number) => {
    for (const node of nodes) {
      result.push({ ...node, depth })
      if (expanded.value.has(node.id)) visit(node.children || [], depth + 1)
    }
  }
  visit(tree.value, 0)
  return result
})

const folderMap = computed(() => {
  const map = new Map<string, KnowledgeFolder>()
  const visit = (nodes: KnowledgeFolder[]) => nodes.forEach(node => {
    map.set(node.id, node)
    visit(node.children || [])
  })
  visit(tree.value)
  return map
})

const selectedFolder = computed(() => folderMap.value.get(selectedFolderId.value))
const hasSelectedFolder = computed(() => Boolean(selectedFolderId.value))
const allFolders = computed<FlatFolder[]>(() => {
  const result: FlatFolder[] = []
  const visit = (nodes: KnowledgeFolder[], depth: number) => {
    for (const node of nodes) {
      result.push({ ...node, depth })
      visit(node.children || [], depth + 1)
    }
  }
  visit(tree.value, 0)
  return result
})
const selectedCount = computed(() => selectedFileIds.value.size)
const allPageSelected = computed(() => (
  files.value.length > 0 && files.value.every(item => selectedFileIds.value.has(item.id))
))
const blockedFolderTargets = computed(() => {
  if (moveMode.value !== 'folder' || !selectedFolderId.value) return new Set<string>()
  return new Set(folderDescendantIds(selectedFolderId.value))
})
const moveTargetFolders = computed(() => allFolders.value.filter((folder) => {
  if (moveMode.value === 'files') return folder.id !== selectedFolderId.value
  if (blockedFolderTargets.value.has(folder.id)) return false
  return folder.id !== selectedFolder.value?.parent_id
}))
const bestSimilarity = computed(() => {
  if (!searchResults.value.length) return null
  return Math.max(...searchResults.value.map(item => item.similarity))
})

async function refreshTree() {
  const result = await knowledgeApi.tree()
  tree.value = result.items
  if (!selectedFolderId.value || !folderMap.value.has(selectedFolderId.value)) {
    selectedFolderId.value = tree.value[0]?.id || ''
  }
  for (const root of tree.value) expanded.value.add(root.id)
}

async function refreshFiles() {
  if (!selectedFolderId.value) {
    files.value = []
    totalFiles.value = 0
    totalPages.value = 1
    return
  }
  const result = await knowledgeApi.filePage(
    selectedFolderId.value,
    page.value,
    pageSize.value,
    fileKeyword.value,
  )
  if (page.value > result.pages) {
    page.value = result.pages
    await refreshFiles()
    return
  }
  files.value = result.items
  totalFiles.value = result.total
  totalPages.value = result.pages
}

async function refreshAll() {
  loading.value = true
  error.value = ''
  try {
    await refreshTree()
    await refreshFiles()
  } catch (err: any) {
    error.value = err.message || String(err)
  } finally {
    loading.value = false
  }
}

async function selectFolder(id: string) {
  selectedFolderId.value = id
  page.value = 1
  fileKeyword.value = ''
  selectedFileIds.value = new Set()
  clearFolderIdCopyStatus()
  searchOpen.value = false
  searchResults.value = []
  searchHasRun.value = false
  searchError.value = ''
  await refreshFiles()
}

function toggleFolder(id: string) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

function beginCreate(parentId: string | null) {
  createParent.value = parentId
  newFolderName.value = ''
  error.value = ''
}

async function createFolder() {
  const name = newFolderName.value.trim()
  if (!name) return
  try {
    const created = await knowledgeApi.createFolder(name, createParent.value || null)
    if (createParent.value) expanded.value.add(createParent.value)
    createParent.value = undefined
    await refreshTree()
    await selectFolder(created.id)
  } catch (err: any) {
    error.value = err.message || String(err)
  }
}

async function renameFolder() {
  const folder = selectedFolder.value
  if (!folder) return
  const name = window.prompt(t('新的目录名称'), folder.name)?.trim()
  if (!name || name === folder.name) return
  try {
    await knowledgeApi.updateFolder(folder.id, { name })
    await refreshTree()
  } catch (err: any) { error.value = err.message || String(err) }
}

async function deleteFolder() {
  const folder = selectedFolder.value
  if (!folder || !window.confirm(`${t('删除空目录')}“${folder.name}”？`)) return
  try {
    await knowledgeApi.deleteFolder(folder.id)
    selectedFolderId.value = ''
    await refreshAll()
  } catch (err: any) { error.value = err.message || String(err) }
}

function chooseFiles() {
  fileInput.value?.click()
}

async function upload(selected: File[]) {
  if (!selectedFolderId.value || !selected.length) return
  const oversized = selected.find(file => file.size > MAX_UPLOAD_FILE_SIZE)
  if (oversized) {
    error.value = `${t('单个文件不能超过 500MB')}：${oversized.name}`
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  uploading.value = true
  error.value = ''
  try {
    await knowledgeApi.upload(selectedFolderId.value, selected)
    page.value = 1
    await refreshFiles()
  } catch (err: any) {
    error.value = err.message || String(err)
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onFileChange(event: Event) {
  upload(Array.from((event.target as HTMLInputElement).files || []))
}

function onDrop(event: DragEvent) {
  dragging.value = false
  upload(Array.from(event.dataTransfer?.files || []))
}

async function removeFile(item: KnowledgeFile) {
  if (!window.confirm(`${t('删除')}“${item.name}”？`)) return
  try {
    await knowledgeApi.deleteFile(item.id)
    selectedFileIds.value.delete(item.id)
    selectedFileIds.value = new Set(selectedFileIds.value)
    await refreshFiles()
    await refreshTree()
  } catch (err: any) { error.value = err.message || String(err) }
}

function folderDescendantIds(folderId: string) {
  const result: string[] = []
  const visit = (nodes: KnowledgeFolder[]) => {
    for (const node of nodes) {
      if (node.id === folderId || result.includes(node.parent_id)) result.push(node.id)
      visit(node.children || [])
    }
  }
  visit(tree.value)
  return result
}

function toggleFile(fileId: string, checked: boolean) {
  const next = new Set(selectedFileIds.value)
  checked ? next.add(fileId) : next.delete(fileId)
  selectedFileIds.value = next
}

function toggleCurrentPage(checked: boolean) {
  const next = new Set(selectedFileIds.value)
  for (const item of files.value) checked ? next.add(item.id) : next.delete(item.id)
  selectedFileIds.value = next
}

function openFileMove() {
  if (!selectedCount.value) return
  moveMode.value = 'files'
  targetFolderId.value = moveTargetFolders.value[0]?.id || ''
}

function openFolderMove() {
  if (!selectedFolder.value) return
  moveMode.value = 'folder'
  targetFolderId.value = ''
}

function closeMove() {
  if (moving.value) return
  moveMode.value = null
  targetFolderId.value = ''
}

async function confirmMove() {
  if (!moveMode.value || (moveMode.value === 'files' && !targetFolderId.value)) return
  moving.value = true
  error.value = ''
  try {
    if (moveMode.value === 'files') {
      await knowledgeApi.moveFiles([...selectedFileIds.value], targetFolderId.value)
      selectedFileIds.value = new Set()
    } else if (selectedFolder.value) {
      await knowledgeApi.updateFolder(selectedFolder.value.id, { parent_id: targetFolderId.value })
    }
    moveMode.value = null
    targetFolderId.value = ''
    await refreshTree()
    await refreshFiles()
  } catch (err: any) {
    error.value = err.message || String(err)
  } finally {
    moving.value = false
  }
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) return
  page.value = nextPage
  await refreshFiles()
}

async function changePageSize() {
  page.value = 1
  await refreshFiles()
}

async function searchFilesByName() {
  page.value = 1
  selectedFileIds.value = new Set()
  await refreshFiles()
}

async function clearFileSearch() {
  if (!fileKeyword.value) return
  fileKeyword.value = ''
  await searchFilesByName()
}

function formatSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(timestamp: string) {
  const value = Number(timestamp) * 1000
  return Number.isFinite(value) ? new Date(value).toLocaleString(platformLocale.value) : '-'
}

async function openFolderGraph() {
  if (!selectedFolderId.value) return
  await router.push({
    name: 'graph',
    query: { scope: 'files', source: `folder:${selectedFolderId.value}` },
  })
}

function openFolderSearch() {
  if (!selectedFolderId.value) return
  searchOpen.value = true
  searchError.value = ''
  searchHasRun.value = false
  searchResults.value = []
}

function closeFolderSearch() {
  searchOpen.value = false
}

async function searchFolder() {
  const query = searchQuery.value.trim()
  if (!selectedFolderId.value || !query) return

  searching.value = true
  searchError.value = ''
  try {
    const result = await knowledgeApi.search({
      query,
      folder_id: selectedFolderId.value,
      top_k: RETRIEVAL_TOP_K,
      similarity_threshold: 0,
    })
    searchResults.value = result.chunks
    searchEmbeddingModel.value = result.embedding_model || 'text-embedding-v4'
    searchHasRun.value = true
  } catch (err: any) {
    searchError.value = err.message || String(err)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

function formatScore(score: number) {
  return Number.isFinite(score) ? score.toFixed(3) : '-'
}

function scoreTone(score: number) {
  if (score >= 0.8) return 'score-high'
  if (score >= 0.5) return 'score-medium'
  return 'score-low'
}

async function copyText(content: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(content)
      return
    } catch {
      // Public HTTP pages can deny the Clipboard API; use the DOM fallback below.
    }
  }

  const textArea = document.createElement('textarea')
  textArea.value = content
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()
  if (!copied) throw new Error('Clipboard copy failed')
}

function clearFolderIdCopyStatus() {
  folderIdCopyStatus.value = 'idle'
  if (folderIdCopyTimer) {
    clearTimeout(folderIdCopyTimer)
    folderIdCopyTimer = null
  }
}

async function copyFolderId() {
  if (!selectedFolderId.value) return
  clearFolderIdCopyStatus()
  try {
    await copyText(selectedFolderId.value)
    folderIdCopyStatus.value = 'success'
  } catch {
    folderIdCopyStatus.value = 'error'
  }
  folderIdCopyTimer = setTimeout(() => {
    folderIdCopyStatus.value = 'idle'
    folderIdCopyTimer = null
  }, 2400)
}

async function copyChunk(content: string) {
  await copyText(content)
}

const statusLabel: Record<string, string> = {
  uploaded: '排队中', processing: '处理中', done: '已入库', failed: '失败',
}

onMounted(async () => {
  await refreshAll()
  pollTimer = setInterval(() => {
    if (files.value.some(item => item.status === 'uploaded' || item.status === 'processing')) {
      refreshFiles()
    }
  }, 2500)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (folderIdCopyTimer) clearTimeout(folderIdCopyTimer)
})
</script>

<template>
  <div class="knowledge-page">
    <header class="page-header">
      <div>
        <h2>知识库</h2>
        <p>按目录组织上传文件，内容将进入现有 AI 检索与关系图谱。</p>
      </div>
      <button class="btn btn-secondary btn-sm" :disabled="loading" @click="refreshAll" title="刷新知识库">
        刷新
      </button>
    </header>

    <div v-if="error" class="error-bar">{{ error }}</div>

    <div class="library-layout" :class="{ 'search-mode': searchOpen }">
      <aside class="folder-pane">
        <div class="pane-header">
          <span>目录</span>
          <button class="icon-btn" @click="beginCreate(null)" title="新建根目录">＋</button>
        </div>

        <form v-if="createParent !== undefined" class="create-row" @submit.prevent="createFolder">
          <input v-model="newFolderName" type="text" maxlength="100" autofocus placeholder="目录名称" />
          <button class="icon-btn confirm" type="submit" title="确认创建">✓</button>
          <button class="icon-btn" type="button" title="取消" @click="createParent = undefined">×</button>
        </form>

        <div class="folder-tree">
          <button
            v-for="folder in flatFolders"
            :key="folder.id"
            class="folder-row"
            :class="{ active: selectedFolderId === folder.id }"
            :style="{ paddingLeft: `${10 + folder.depth * 18}px` }"
            @click="selectFolder(folder.id)"
          >
            <span
              class="expander"
              :class="{ invisible: !folder.children?.length }"
              @click.stop="toggleFolder(folder.id)"
            >{{ expanded.has(folder.id) ? '⌄' : '›' }}</span>
            <SvgIcon name="folder" :size="15" />
            <span class="folder-name" data-no-ui-translate>{{ folder.name }}</span>
            <span class="folder-count">{{ folder.file_count }}</span>
          </button>
        </div>

        <div v-if="!tree.length && !loading" class="folder-empty">
          <button class="btn btn-primary btn-sm" @click="beginCreate(null)">创建第一个目录</button>
        </div>
      </aside>

      <section class="file-pane">
        <div class="file-toolbar">
          <div class="path-block">
            <span class="path-label">当前位置</span>
            <strong>{{ selectedFolder?.path || '尚未选择目录' }}</strong>
          </div>
          <div class="toolbar-actions" v-if="selectedFolder">
            <button
              class="btn btn-secondary btn-sm"
              type="button"
              :class="{ 'copy-error': folderIdCopyStatus === 'error' }"
              :title="`${t('当前目录 ID')}：${selectedFolderId}`"
              @click="copyFolderId"
            >
              {{ folderIdCopyStatus === 'success'
                ? t('目录 ID 已复制')
                : folderIdCopyStatus === 'error'
                  ? t('复制失败，请重试')
                  : t('复制目录 ID') }}
            </button>
            <button class="btn btn-secondary btn-sm" @click="openFolderSearch">
              <SvgIcon name="search" :size="15" />
              检索实验室
            </button>
            <button class="btn btn-secondary btn-sm graph-action" @click="openFolderGraph">
              <SvgIcon name="graph" :size="15" />
              生成目录图谱
            </button>
            <button class="btn btn-secondary btn-sm" @click="beginCreate(selectedFolder.id)">新建子目录</button>
            <button class="btn btn-secondary btn-sm" @click="renameFolder">重命名</button>
            <button class="btn btn-secondary btn-sm" @click="openFolderMove">移动当前目录</button>
            <button class="btn btn-secondary btn-sm danger" @click="deleteFolder" title="仅可删除空目录">删除目录</button>
            <button class="btn btn-primary btn-sm" :disabled="uploading" @click="chooseFiles">
              <SvgIcon name="upload" :size="15" />
              {{ uploading ? '上传中' : '上传文件' }}
            </button>
          </div>
        </div>

        <input ref="fileInput" class="hidden-input" type="file" multiple
               accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.html,.htm,.json,.log,.png,.jpg,.jpeg"
               @change="onFileChange" />

        <section v-if="searchOpen && selectedFolder" class="retrieval-lab">
          <header class="retrieval-header">
            <div>
              <h3>{{ t('检索实验室') }}</h3>
              <p>{{ t('对当前目录及全部子目录的已入库文件进行向量检索') }}</p>
            </div>
            <button class="icon-btn" type="button" title="关闭" @click="closeFolderSearch">×</button>
          </header>
          <div class="retrieval-body">
            <div class="retrieval-query-panel">
              <div class="retrieval-context">
                <div class="dataset-block">
                  <span class="dataset-icon"><SvgIcon name="folder" :size="17" /></span>
                  <div>
                    <small>{{ t('当前知识库目录') }}</small>
                    <strong data-no-ui-translate>{{ selectedFolder.name }}</strong>
                    <span data-no-ui-translate>{{ selectedFolder.path }}</span>
                  </div>
                </div>
                <dl class="retrieval-meta">
                  <div><dt>{{ t('文件数') }}</dt><dd>{{ selectedFolder.file_count }}</dd></div>
                  <div><dt>{{ t('嵌入模型') }}</dt><dd data-no-ui-translate>{{ searchEmbeddingModel }}</dd></div>
                  <div><dt>Top-K</dt><dd>{{ RETRIEVAL_TOP_K }}</dd></div>
                </dl>
              </div>
              <form class="retrieval-form" @submit.prevent="searchFolder">
                <label for="retrieval-query">{{ t('检索问题') }}</label>
                <textarea
                  id="retrieval-query"
                  v-model="searchQuery"
                  rows="7"
                  maxlength="8000"
                  :placeholder="t('输入要检索的问题或关键词')"
                  @keydown.meta.enter.prevent="searchFolder"
                  @keydown.ctrl.enter.prevent="searchFolder"
                />
                <button class="btn btn-primary" type="submit" :disabled="searching || !searchQuery.trim()">
                  <SvgIcon name="search" :size="15" />
                  {{ searching ? t('检索中') : t('检索') }}
                </button>
              </form>
            </div>

            <div class="retrieval-results-pane">
              <div class="retrieval-summary">
                <div><span>{{ t('命中数') }}</span><strong>{{ searchHasRun ? searchResults.length : '-' }}</strong></div>
                <div><span>{{ t('最佳相似度') }}</span><strong>{{ searchHasRun && bestSimilarity !== null ? formatScore(bestSimilarity) : '-' }}</strong></div>
              </div>
              <div class="retrieval-results-scroll">
                <div v-if="searchError" class="search-error">{{ searchError }}</div>
                <div v-else-if="searching" class="search-message">{{ t('正在使用 text-embedding-v4 检索目录文件…') }}</div>
                <div v-else-if="searchResults.length" class="search-results">
                  <article v-for="(result, index) in searchResults" :key="result.id || `${result.source_name}-${index}`" class="search-result">
                    <div class="search-result-meta">
                      <span class="result-rank">{{ index + 1 }}</span>
                      <strong data-no-ui-translate>{{ result.document_keyword || result.source_name }}</strong>
                      <span class="score" :class="scoreTone(result.similarity)">{{ t('向量相似度') }} {{ formatScore(result.similarity) }}</span>
                    </div>
                    <p class="result-path" data-no-ui-translate>{{ result.folder_path }}</p>
                    <p class="result-content">{{ result.content }}</p>
                    <div class="result-actions">
                      <button type="button" class="text-action" @click="copyChunk(result.content)">{{ t('复制片段') }}</button>
                      <details>
                        <summary>{{ t('详情') }}</summary>
                        <span>Chunk ID: <code>{{ result.id }}</code></span>
                        <span>Document ID: <code>{{ result.document_id }}</code></span>
                      </details>
                    </div>
                  </article>
                </div>
                <div v-else-if="searchHasRun" class="search-message">{{ t('没有找到匹配的已入库内容') }}</div>
                <div v-else class="retrieval-empty">
                  <SvgIcon name="search" :size="24" />
                  <span>{{ t('输入问题后开始检索当前目录') }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <template v-else>
        <div
          v-if="hasSelectedFolder"
          class="drop-zone"
          :class="{ dragging }"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
          @click="chooseFiles"
        >
          <SvgIcon name="upload" :size="20" />
          <span>拖放文件到此目录，或点击选择</span>
          <small>{{ t('PDF、Office、文本、HTML、JSON、图片，单文件不超过 500MB') }}</small>
        </div>

        <div v-if="!hasSelectedFolder" class="empty-state">请先创建或选择一个目录</div>

        <div v-else :key="selectedFolderId" class="file-table-wrap" :data-folder-id="selectedFolderId">
          <div class="file-list-actions">
            <span>
              共 {{ totalFiles }} 个文件
              <template v-if="fileKeyword.trim()"> · 文件名包含“<span data-no-ui-translate>{{ fileKeyword.trim() }}</span>”</template>
            </span>
            <form class="file-search" role="search" @submit.prevent="searchFilesByName">
              <SvgIcon name="search" :size="15" />
              <input
                v-model="fileKeyword"
                type="search"
                maxlength="200"
                placeholder="按文件名搜索"
                :disabled="loading"
                @search="searchFilesByName"
              />
              <button v-if="fileKeyword" class="icon-btn clear-file-search" type="button" title="清空搜索" @click="clearFileSearch">×</button>
            </form>
            <button class="btn btn-secondary btn-sm" :disabled="!selectedCount" @click="openFileMove">
              移动所选<span v-if="selectedCount"> ({{ selectedCount }})</span>
            </button>
          </div>
          <div class="file-table-scroll">
            <div v-if="!totalFiles && !loading" class="empty-state">
              {{ fileKeyword.trim() ? '没有找到匹配的文件' : '该目录还没有文件' }}
            </div>
            <table v-else class="file-table">
              <thead>
                <tr>
                  <th class="select-cell">
                    <input
                      type="checkbox"
                      :checked="allPageSelected"
                      title="选择当前页全部文件"
                      @change="toggleCurrentPage(($event.target as HTMLInputElement).checked)"
                    />
                  </th>
                  <th>文件名</th><th>大小</th><th>状态</th><th>上传时间</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in files" :key="item.id">
                  <td class="select-cell">
                    <input
                      type="checkbox"
                      :checked="selectedFileIds.has(item.id)"
                      :title="`选择 ${item.name}`"
                      @change="toggleFile(item.id, ($event.target as HTMLInputElement).checked)"
                    />
                  </td>
                  <td>
                    <div class="file-name" data-no-ui-translate><SvgIcon name="file" :size="16" /><span>{{ item.name }}</span></div>
                    <div v-if="item.error" class="file-error" :title="item.error">{{ item.error }}</div>
                  </td>
                  <td class="muted">{{ formatSize(item.size) }}</td>
                  <td><span class="status" :class="`status-${item.status}`">{{ statusLabel[item.status] || item.status }}</span></td>
                  <td class="muted">{{ formatDate(item.created_at) }}</td>
                  <td><button class="icon-btn" title="删除文件" :disabled="item.status === 'processing'" @click="removeFile(item)">×</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="file-pagination">
            <span>第 {{ page }} / {{ totalPages }} 页</span>
            <label>
              每页
              <select v-model.number="pageSize" @change="changePageSize">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
            <button class="icon-btn page-button" title="上一页" :disabled="page <= 1" @click="goToPage(page - 1)">‹</button>
            <button class="icon-btn page-button" title="下一页" :disabled="page >= totalPages" @click="goToPage(page + 1)">›</button>
          </div>
        </div>
        </template>
      </section>
    </div>

    <div v-if="moveMode" class="move-overlay" @click.self="closeMove">
      <section class="move-dialog" role="dialog" aria-modal="true" :aria-label="moveMode === 'files' ? '移动所选文件' : '移动当前目录'">
        <header>
          <div>
            <h3>{{ moveMode === 'files' ? '移动所选文件' : '移动当前目录' }}</h3>
            <p v-if="moveMode === 'files'">将 {{ selectedCount }} 个文件迁移到指定目录，不会重新解析文件。</p>
            <p v-else>当前目录及全部子目录、文件会一起移动。</p>
          </div>
          <button class="icon-btn" type="button" title="关闭" :disabled="moving" @click="closeMove">×</button>
        </header>
        <label class="move-target">
          <span>目标目录</span>
          <select v-model="targetFolderId">
            <option v-if="moveMode === 'folder'" value="">根目录</option>
            <option v-for="folder in moveTargetFolders" :key="folder.id" :value="folder.id">
              {{ '　'.repeat(folder.depth) }}{{ folder.path }}
            </option>
          </select>
        </label>
        <footer>
          <button class="btn btn-secondary" type="button" :disabled="moving" @click="closeMove">取消</button>
          <button
            class="btn btn-primary"
            type="button"
            :disabled="moving || (moveMode === 'files' && !targetFolderId)"
            @click="confirmMove"
          >{{ moving ? '迁移中' : '确认迁移' }}</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page { height: calc(100vh - var(--header-h) - 50px); display: flex; flex-direction: column; min-height: 560px; }
.page-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; }
.page-header p { margin-top: 3px; font-size: 0.82rem; color: var(--t3); }
.error-bar { margin-bottom: 0.7rem; border: 1px solid #E8C7C0; background: var(--red-bg); color: var(--red-t); padding: 0.5rem 0.7rem; border-radius: var(--r-sm); font-size: 0.78rem; }
.library-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); border: 1px solid var(--border); background: var(--surface); border-radius: var(--r); overflow: hidden; }
.folder-pane { min-width: 0; min-height: 0; overflow: hidden; border-right: 1px solid var(--border); display: flex; flex-direction: column; background: var(--surface-2); }
.pane-header { min-height: 45px; padding: 0 10px 0 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); color: var(--t3); font-size: 0.76rem; font-weight: 650; }
.icon-btn { width: 28px; height: 28px; border: 0; border-radius: 5px; background: transparent; color: var(--t3); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; }
.icon-btn:hover:not(:disabled) { background: var(--surface-2); color: var(--t1); }
.icon-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.icon-btn.confirm { color: var(--p); font-weight: 700; }
.create-row { display: grid; grid-template-columns: minmax(0, 1fr) 28px 28px; gap: 2px; padding: 7px; border-bottom: 1px solid var(--border); }
.create-row input { padding: 0.35rem 0.5rem; font-size: 0.78rem; }
.folder-tree { overflow: auto; padding: 6px 0; }
.folder-row { width: 100%; min-height: 34px; padding-right: 10px; border: 0; background: transparent; display: flex; align-items: center; gap: 6px; text-align: left; color: var(--t3); font: inherit; font-size: 0.79rem; cursor: pointer; }
.folder-row:hover { background: var(--surface-2); }
.folder-row.active { background: var(--p-light); color: var(--p); font-weight: 600; }
.expander { width: 13px; flex: 0 0 13px; text-align: center; color: var(--t4); font-size: 0.95rem; }
.expander.invisible { visibility: hidden; }
.folder-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.folder-count { margin-left: auto; color: var(--t4); font-size: 0.68rem; }
.folder-empty { padding: 2rem 1rem; text-align: center; }
.file-pane { min-width: 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
.file-toolbar { min-height: 58px; padding: 8px 12px; display: flex; gap: 12px; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
.path-block { min-width: 0; display: flex; flex-direction: column; }
.path-block strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.83rem; color: var(--t1); }
.path-label { color: var(--t4); font-size: 0.65rem; }
.toolbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.graph-action { color: var(--p); }
.copy-error { color: var(--red-t); border-color: var(--red-t); }
.danger { color: var(--red-t); }
.hidden-input { display: none; }
.retrieval-lab { flex: 1; min-height: 0; margin: 12px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--surface); display: flex; flex-direction: column; overflow: hidden; }
.retrieval-header { min-height: 54px; padding: 9px 10px 9px 14px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); background: var(--surface-2); }
.retrieval-header h3 { margin: 0; font-size: 0.88rem; color: var(--t1); }
.retrieval-header p { margin: 3px 0 0; color: var(--t4); font-size: 0.7rem; }
.retrieval-body { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.retrieval-query-panel { flex: 0 0 auto; display: grid; grid-template-columns: minmax(330px, 0.9fr) minmax(360px, 1.1fr); border-bottom: 1px solid var(--border); background: var(--surface-2); }
.retrieval-context { min-width: 0; display: grid; grid-template-columns: minmax(180px, 1fr) minmax(130px, 160px); border-right: 1px solid var(--border); }
.dataset-block { min-width: 0; padding: 14px; display: flex; align-items: center; gap: 9px; }
.dataset-icon { width: 30px; height: 30px; flex: 0 0 30px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; background: var(--p-light); color: var(--p); }
.dataset-block div { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dataset-block small { color: var(--t4); font-size: 0.66rem; }
.dataset-block strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t1); font-size: 0.82rem; }
.dataset-block div > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t4); font-size: 0.66rem; }
.retrieval-meta { margin: 0; padding: 9px 12px; border-left: 1px solid var(--border); }
.retrieval-meta div { min-height: 25px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.retrieval-meta dt { color: var(--t4); font-size: 0.7rem; }
.retrieval-meta dd { margin: 0; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t2); font-size: 0.72rem; font-weight: 600; }
.retrieval-form { min-width: 0; padding: 12px 14px; display: grid; grid-template-columns: minmax(0, 1fr) 112px; gap: 8px 10px; align-items: end; }
.retrieval-form label { grid-column: 1 / -1; color: var(--t2); font-size: 0.73rem; font-weight: 600; }
.retrieval-form textarea { width: 100%; min-height: 82px; max-height: 150px; resize: vertical; padding: 9px 10px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--t1); font: inherit; font-size: 0.76rem; line-height: 1.55; }
.retrieval-form textarea:focus { outline: 2px solid color-mix(in srgb, var(--p) 18%, transparent); border-color: var(--p); }
.retrieval-form .btn { width: 100%; min-height: 38px; justify-content: center; }
.retrieval-results-pane { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
.retrieval-summary { flex: 0 0 auto; padding: 10px 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; border-bottom: 1px solid var(--border); background: var(--surface-2); }
.retrieval-summary div { min-height: 44px; padding: 7px 10px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); display: flex; flex-direction: column; justify-content: center; }
.retrieval-summary span { color: var(--t4); font-size: 0.66rem; }
.retrieval-summary strong { color: var(--t1); font-size: 0.9rem; font-variant-numeric: tabular-nums; }
.retrieval-results-scroll { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; scrollbar-width: thin; scrollbar-color: var(--border-strong) var(--surface-2); background: var(--surface); }
.retrieval-results-scroll::-webkit-scrollbar { width: 9px; }
.retrieval-results-scroll::-webkit-scrollbar-track { background: var(--surface-2); border-left: 1px solid var(--border-light); }
.retrieval-results-scroll::-webkit-scrollbar-thumb { border: 2px solid var(--surface-2); border-radius: 5px; background: var(--border-strong); }
.retrieval-results-scroll::-webkit-scrollbar-thumb:hover { background: var(--t4); }
.search-error, .search-message { margin: 12px; padding: 9px 10px; color: var(--t3); font-size: 0.76rem; }
.search-error { border: 1px solid #E8C7C0; background: var(--red-bg); color: var(--red-t); }
.retrieval-empty { min-height: 220px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: var(--t4); font-size: 0.76rem; }
.search-results { padding: 12px 14px 18px; }
.search-result { padding: 10px 12px; border-bottom: 1px solid var(--border-light); }
.search-result { margin-bottom: 8px; border: 1px solid var(--border); border-radius: 5px; background: var(--surface); }
.search-result:last-child { margin-bottom: 0; }
.search-result-meta { display: flex; align-items: center; gap: 7px; min-width: 0; font-size: 0.76rem; }
.search-result-meta strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--t1); }
.result-rank { width: 21px; height: 21px; flex: 0 0 21px; border-radius: 4px; background: var(--p-light); color: var(--p); display: inline-flex; align-items: center; justify-content: center; font-size: 0.66rem; font-weight: 650; }
.score { margin-left: auto; padding: 2px 6px; border: 1px solid var(--border); border-radius: 4px; color: var(--t3); font-size: 0.68rem; font-variant-numeric: tabular-nums; white-space: nowrap; }
.score-high { color: var(--green-t); background: var(--green-bg); }.score-medium { color: var(--blue-t); background: var(--blue-bg); }.score-low { color: var(--t4); background: var(--surface-2); }
.result-path { margin: 4px 0 0 26px; color: var(--t4); font-size: 0.68rem; }
.result-content { margin: 8px 0 0 26px; color: var(--t2); font-size: 0.75rem; line-height: 1.6; white-space: pre-wrap; }
.result-actions { margin: 9px 0 0 26px; display: flex; align-items: flex-start; gap: 12px; color: var(--t4); font-size: 0.68rem; }
.text-action { padding: 0; border: 0; background: transparent; color: var(--p); cursor: pointer; font: inherit; }
.result-actions details summary { color: var(--p); cursor: pointer; }
.result-actions details span { margin-top: 5px; display: block; overflow-wrap: anywhere; }
.result-actions code { color: var(--t3); }
.drop-zone { margin: 12px; min-height: 82px; border: 1px dashed var(--border-strong); border-radius: var(--r-sm); background: var(--surface-2); color: var(--t3); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; font-size: 0.78rem; transition: 0.15s; }
.drop-zone small { color: var(--t4); font-size: 0.66rem; }
.drop-zone:hover, .drop-zone.dragging { border-color: var(--p); background: var(--p-light); color: var(--p); }
.empty-state { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--t4); font-size: 0.82rem; }
.file-table-wrap { flex: 1; min-height: 0; overflow: hidden; padding: 0 12px 12px; display: flex; flex-direction: column; }
.file-list-actions { flex: 0 0 auto; z-index: 3; min-height: 44px; padding: 7px 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-bottom: 1px solid var(--border); background: var(--surface); }
.file-list-actions > span { min-width: 0; flex: 1 1 auto; color: var(--t4); font-size: 0.72rem; }
.file-search { flex: 0 1 320px; min-width: 220px; min-height: 32px; display: flex; align-items: center; gap: 7px; padding: 0 8px; border: 1px solid var(--border-strong); border-radius: 6px; background: var(--surface-2); color: var(--t4); }
.file-search input { min-width: 0; flex: 1; height: 30px; border: 0; outline: 0; background: transparent; color: var(--t1); font-size: 0.78rem; }
.file-search input::placeholder { color: var(--t4); }
.clear-file-search { width: 22px; height: 22px; color: var(--t4); }
.file-table-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.file-table-scroll > .empty-state { min-height: 100%; }
.file-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.file-table th { position: sticky; top: 0; z-index: 2; background: var(--surface); padding: 8px; border-bottom: 1px solid var(--border); text-align: left; color: var(--t4); font-size: 0.68rem; font-weight: 600; }
.file-table th:nth-child(1) { width: 36px; }.file-table th:nth-child(2) { width: 42%; }.file-table th:nth-child(3) { width: 12%; }.file-table th:nth-child(4) { width: 13%; }.file-table th:nth-child(5) { width: 23%; }.file-table th:nth-child(6) { width: 40px; }
.file-table td { padding: 10px 8px; border-bottom: 1px solid var(--border-light); font-size: 0.77rem; vertical-align: middle; }
.select-cell { padding-right: 0 !important; text-align: center !important; }
.select-cell input { width: 15px; height: 15px; margin: 0; accent-color: var(--p); cursor: pointer; }
.file-name { display: flex; align-items: center; gap: 7px; min-width: 0; color: var(--t1); font-weight: 500; }
.file-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-error { margin: 3px 0 0 23px; color: var(--red-t); font-size: 0.66rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.muted { color: var(--t4); }
.status { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 5px; font-size: 0.68rem; white-space: nowrap; }
.status-uploaded { background: var(--blue-bg); color: var(--blue-t); }.status-processing { background: var(--amber-bg); color: var(--amber-t); }.status-done { background: var(--green-bg); color: var(--green-t); }.status-failed { background: var(--red-bg); color: var(--red-t); }
.file-pagination { flex: 0 0 auto; z-index: 3; min-height: 48px; padding: 8px 0; display: flex; align-items: center; justify-content: flex-end; gap: 9px; border-top: 1px solid var(--border); background: var(--surface); color: var(--t4); font-size: 0.72rem; }
.file-pagination label { display: inline-flex; align-items: center; gap: 5px; }
.file-pagination select { min-height: 30px; padding: 0 24px 0 8px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--t2); }
.page-button { border: 1px solid var(--border-strong); color: var(--t2); font-size: 1.1rem; }
.move-overlay { position: fixed; inset: 0; z-index: 100; padding: 20px; display: flex; align-items: center; justify-content: center; background: rgb(15 23 42 / 42%); }
.move-dialog { width: min(480px, 100%); border: 1px solid var(--border); border-radius: var(--r); background: var(--surface); box-shadow: 0 20px 60px rgb(15 23 42 / 18%); overflow: hidden; }
.move-dialog header { padding: 16px 18px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border); }
.move-dialog h3 { margin: 0; color: var(--t1); font-size: 1rem; }
.move-dialog p { margin: 5px 0 0; color: var(--t4); font-size: 0.74rem; line-height: 1.55; }
.move-target { padding: 18px; display: grid; gap: 7px; color: var(--t2); font-size: 0.76rem; font-weight: 600; }
.move-target select { width: 100%; min-height: 40px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: 5px; background: var(--surface); color: var(--t1); }
.move-dialog footer { padding: 12px 18px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border); background: var(--surface-2); }
@media (max-width: 1100px) {
  .retrieval-query-panel { grid-template-columns: 1fr; }
  .retrieval-context { border-right: 0; border-bottom: 1px solid var(--border); }
}
@media (max-width: 900px) {
  .knowledge-page { height: auto; min-height: calc(100vh - 3rem); }
  .library-layout { grid-template-columns: 1fr; overflow: visible; }
  .folder-pane { border-right: 0; border-bottom: 1px solid var(--border); max-height: 280px; }
  .library-layout.search-mode .folder-pane,
  .library-layout.search-mode .file-toolbar { display: none; }
  .file-toolbar { align-items: flex-start; flex-direction: column; }
  .toolbar-actions { justify-content: flex-start; }
  .retrieval-lab { min-height: 780px; overflow: visible; }
  .retrieval-body { overflow: visible; }
  .retrieval-results-pane { min-height: 420px; }
  .file-table th:nth-child(3), .file-table td:nth-child(3), .file-table th:nth-child(5), .file-table td:nth-child(5) { display: none; }
}
@media (max-width: 620px) {
  .retrieval-context { grid-template-columns: 1fr; }
  .retrieval-meta { border-top: 1px solid var(--border); border-left: 0; }
  .retrieval-form { grid-template-columns: 1fr; }
  .retrieval-form label { grid-column: auto; }
  .file-list-actions { align-items: flex-start; flex-wrap: wrap; }
  .file-list-actions > span, .file-search { flex-basis: 100%; }
  .file-pagination { flex-wrap: wrap; justify-content: flex-start; }
  .move-overlay { padding: 12px; align-items: flex-end; }
  .move-dialog { width: 100%; }
}
</style>
