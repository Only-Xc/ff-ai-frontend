<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { graphApi, type GraphFilter, type GraphSources } from '@/api'
import GraphView from '@/components/graph/GraphView.vue'
import { NODE_COLORS, LABEL_NAMES, LABEL_ICONS, colorOf } from '@/components/graph/graphTheme'
import KnowledgeSourceTreeSelect from '@/components/knowledge/KnowledgeSourceTreeSelect.vue'
import SvgIcon from '@/components/SvgIcon.vue'

type GraphMode = 'files' | 'mails'
const NODE_LIMIT_OPTIONS = [50, 100, 200, 500] as const

const route = useRoute()
const router = useRouter()

const entities = ref<any[]>([])
const relationships = ref<any[]>([])
const entityTypes = ref<string[]>([])
const selectedTypes = ref<string[]>([])
const typeCounts = ref<Record<string, number>>({})
const refreshing = ref(false)
const sources = ref<GraphSources>({ folders: [], files: [], mails: [] })
const graphMode = ref<GraphMode>(route.query.scope === 'mails' ? 'mails' : 'files')
const sourceSelection = ref(typeof route.query.source === 'string' ? route.query.source : '')
const sourceError = ref('')
const nodeLimit = ref<number>(50)
const totalEntities = ref(0)

function activeFilter(): GraphFilter | undefined {
  const splitAt = sourceSelection.value.indexOf(':')
  const kind = sourceSelection.value.slice(0, splitAt)
  const id = sourceSelection.value.slice(splitAt + 1)
  if (kind === 'folder') return { folder_id: id }
  if (kind === 'file') return { file_id: id }
  if (kind === 'mail') return { mail_id: id }
  return undefined
}

async function loadSources() {
  try { sources.value = await graphApi.sources() }
  catch (e: any) { sourceError.value = e.message || String(e) }
}

function firstSelection(mode: GraphMode): string {
  if (mode === 'mails') {
    const firstMail = sources.value.mails[0]
    return firstMail ? `mail:${firstMail.id}` : ''
  }
  const firstFolder = sources.value.folders[0]
  if (firstFolder) return `folder:${firstFolder.id}`
  const firstFile = sources.value.files[0]
  return firstFile ? `file:${firstFile.id}` : ''
}

function selectionMatchesMode(value: string, mode: GraphMode): boolean {
  return mode === 'mails'
    ? value.startsWith('mail:')
    : value.startsWith('folder:') || value.startsWith('file:')
}

async function syncRouteQuery() {
  await router.replace({
    query: {
      ...route.query,
      embedded: undefined,
      scope: graphMode.value,
      source: sourceSelection.value || undefined,
    },
  })
}

async function loadGraph() {
  const filter = activeFilter()
  if (!filter) {
    entities.value = []
    relationships.value = []
    entityTypes.value = []
    selectedTypes.value = []
    typeCounts.value = {}
    totalEntities.value = 0
    return
  }
  refreshing.value = true
  sourceError.value = ''
  try {
    const [entRes, relRes] = await Promise.all([
      graphApi.entities(1, nodeLimit.value, filter),
      graphApi.relationships(1, 1000, filter),
    ])
    entities.value = entRes.entities || []
    totalEntities.value = Number.isFinite(entRes.total) ? entRes.total : entities.value.length
    relationships.value = relRes.relationships || []

    const counts: Record<string, number> = {}
    for (const e of entities.value) {
      const t = e.type || 'Entity'
      counts[t] = (counts[t] || 0) + 1
    }
    typeCounts.value = counts
    entityTypes.value = Object.keys(counts).sort()
    selectedTypes.value = [...entityTypes.value]
  } catch (e: any) { sourceError.value = e.message || String(e) }
  finally { refreshing.value = false }
}

async function changeNodeLimit() {
  await loadGraph()
}

async function changeMode(mode: GraphMode) {
  if (graphMode.value === mode) return
  graphMode.value = mode
  sourceSelection.value = firstSelection(mode)
  await syncRouteQuery()
  await loadGraph()
}

async function changeSource() {
  await syncRouteQuery()
  await loadGraph()
}

// Client-side filtering — no server round-trip, instant + smooth
const shownEntities = computed(() => {
  if (selectedTypes.value.length >= entityTypes.value.length) return entities.value
  const set = new Set(selectedTypes.value)
  return entities.value.filter((e) => set.has(e.type || 'Entity'))
})

const shownRelationships = computed(() => {
  const ids = new Set(shownEntities.value.map((e) => e.id))
  return relationships.value.filter((r) => ids.has(r.source_id) && ids.has(r.target_id))
})

function toggleType(t: string) {
  const idx = selectedTypes.value.indexOf(t)
  if (idx >= 0) selectedTypes.value.splice(idx, 1)
  else selectedTypes.value.push(t)
}

onMounted(async () => {
  await loadSources()
  if (!selectionMatchesMode(sourceSelection.value, graphMode.value)) {
    sourceSelection.value = firstSelection(graphMode.value)
    await syncRouteQuery()
  }
  await loadGraph()
})
</script>

<template>
  <div class="graph-dashboard">
    <!-- Top toolbar -->
    <div class="graph-toolbar">
      <div class="toolbar-main">
        <div class="toolbar-left">
          <div class="toolbar-heading">
            <h2 class="toolbar-title">关系图谱</h2>
            <span class="toolbar-sub">按目录、文件或邮件查看关系来源</span>
          </div>
          <div class="graph-mode" role="tablist" aria-label="图谱来源类型">
            <button
              type="button"
              role="tab"
              :aria-selected="graphMode === 'files'"
              :class="{ active: graphMode === 'files' }"
              @click="changeMode('files')"
            >
              <SvgIcon name="folder" :size="14" />
              <span>文件知识图谱</span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="graphMode === 'mails'"
              :class="{ active: graphMode === 'mails' }"
              @click="changeMode('mails')"
            >
              <SvgIcon name="mail" :size="14" />
              <span>邮件知识图谱</span>
            </button>
          </div>
          <KnowledgeSourceTreeSelect
            v-model="sourceSelection"
            class="graph-source-tree"
            :folders="sources.folders"
            :files="sources.files"
            :mails="sources.mails"
            :mode="graphMode"
            title="选择图谱数据范围"
            @change="changeSource"
          />
        </div>
        <div class="toolbar-summary" role="group" aria-label="图谱数据概览">
          <label class="node-limit-control">
            <span>节点</span>
            <select v-model.number="nodeLimit" :disabled="refreshing" aria-label="节点展示数量" @change="changeNodeLimit">
              <option v-for="option in NODE_LIMIT_OPTIONS" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <div class="toolbar-metric">
            <span>当前</span>
            <b>{{ shownEntities.length }}</b>
            <span class="metric-detail">/ 总计 {{ totalEntities }}</span>
          </div>
          <div class="toolbar-metric">
            <span>关系</span>
            <b>{{ shownRelationships.length }}</b>
          </div>
          <button class="refresh-btn" type="button" :disabled="refreshing || !sourceSelection" @click="loadGraph">
            {{ refreshing ? '刷新中…' : '界面刷新' }}
          </button>
        </div>
      </div>
      <div class="filter-row" v-if="entityTypes.length">
        <label
          v-for="t in entityTypes" :key="t"
          class="filter-chip" :class="{ active: selectedTypes.includes(t) }"
          :style="{ '--chip': colorOf(t) }"
        >
          <input type="checkbox" :checked="selectedTypes.includes(t)" @change="toggleType(t)" hidden />
          <span class="chip-dot"></span>
          {{ LABEL_ICONS[t] || '' }} {{ LABEL_NAMES[t] || t }}
          <span class="chip-count">{{ typeCounts[t] }}</span>
        </label>
      </div>
    </div>

    <div v-if="sourceError" class="source-error">{{ sourceError }}</div>

    <!-- Graph (fills remaining space) -->
    <div class="graph-container">
      <GraphView :entities="shownEntities" :relationships="shownRelationships" />
    </div>
  </div>
</template>

<style scoped>
.graph-dashboard {
  display: flex; flex-direction: column;
  height: calc(100vh - var(--header-h));
  overflow: hidden;
}

.graph-toolbar {
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.toolbar-main { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.toolbar-left { min-width: 0; display: flex; align-items: center; gap: 0.75rem; }
.toolbar-heading { flex-shrink: 0; }
.toolbar-title { font-size: 0.95rem; font-weight: 700; color: var(--t1); }
.toolbar-sub { font-size: 0.7rem; color: var(--t4); }
.graph-source-tree { width: min(320px, 34vw); min-width: 190px; }
.graph-mode {
  display: inline-grid;
  grid-template-columns: 1fr 1fr;
  min-width: 310px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface-2);
}
.graph-mode button {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 9px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--t3);
  font: inherit;
  font-size: 0.72rem;
  cursor: pointer;
}
.graph-mode button.active {
  background: var(--surface);
  color: var(--p);
  box-shadow: var(--sh-xs);
}
.source-error { flex-shrink: 0; padding: 4px 12px; color: var(--red-t); background: var(--red-bg); font-size: 0.7rem; }
.toolbar-summary {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: auto auto auto auto;
  min-height: 34px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
}
.node-limit-control {
  display: inline-flex; align-items: center; gap: 6px;
  min-width: 112px; padding: 4px 8px 4px 10px;
  font-size: 0.72rem; color: var(--t3);
  background: var(--surface-2);
}
.node-limit-control select {
  min-width: 58px; height: 24px; padding: 0 22px 0 8px;
  border: 1px solid var(--border); border-radius: 5px;
  background: var(--surface); color: var(--t1); font: inherit; cursor: pointer;
}
.node-limit-control select:disabled { cursor: wait; opacity: 0.65; }
.toolbar-metric {
  display: inline-flex; align-items: baseline; justify-content: center; gap: 4px;
  min-width: 96px; padding: 6px 10px;
  border-inline-start: 1px solid var(--border);
  font-size: 0.72rem; color: var(--t3); white-space: nowrap;
}
.toolbar-metric b { color: var(--p); font-size: 0.78rem; }
.metric-detail { color: var(--t4); }
.refresh-btn {
  min-width: 78px; padding: 0 12px;
  border: 0; border-inline-start: 1px solid var(--border);
  background: var(--surface-2); color: var(--t2);
  font: inherit; font-size: 0.72rem; font-weight: 600;
  white-space: nowrap; cursor: pointer;
}
.refresh-btn:hover:not(:disabled) { background: var(--p-lt); color: var(--p); }
.refresh-btn:disabled { opacity: 0.55; cursor: wait; }

.graph-container {
  flex: 1; min-height: 0;
  padding: 8px;
  background: var(--graph-bg);
}

.filter-row {
  width: 100%; display: flex; flex-wrap: wrap; gap: 0.4rem;
  padding-top: 0.5rem; border-top: 1px solid var(--border);
}
.filter-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 0.28rem 0.7rem; border-radius: 9999px;
  font-size: 0.73rem; font-weight: 500;
  background: var(--surface-2); border: 1px solid var(--border);
  cursor: pointer; transition: all 0.15s; user-select: none;
  opacity: 0.5;
}
.filter-chip .chip-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--chip); flex-shrink: 0; transition: box-shadow 0.15s;
}
.filter-chip .chip-count {
  font-size: 0.66rem; color: var(--t4); font-weight: 600;
}
.filter-chip.active {
  opacity: 1;
  border-color: color-mix(in srgb, var(--chip) 55%, transparent);
  background: color-mix(in srgb, var(--chip) 12%, var(--surface));
  color: var(--t1);
}
.filter-chip.active .chip-dot { box-shadow: 0 0 8px var(--chip); }

.hint { margin: 0.6rem 0; }

.legend {
  display: flex; flex-wrap: wrap; gap: 1.25rem; padding: 0.5rem 0;
}
.legend-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.78rem; color: var(--t3);
}
.legend-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
}

@media (max-width: 1180px) {
  .toolbar-main { align-items: flex-start; flex-wrap: wrap; }
  .toolbar-summary { margin-inline-start: auto; }
}

@media (max-width: 900px) {
  .toolbar-left { width: 100%; flex-wrap: wrap; }
  .toolbar-heading { width: 100%; }
  .graph-mode { width: 100%; min-width: 0; }
  .graph-source-tree { width: 100%; }
  .toolbar-summary { width: 100%; margin-inline-start: 0; grid-template-columns: auto 1fr auto auto; }
}

@media (max-width: 560px) {
  .graph-toolbar { padding-inline: 0.65rem; }
  .toolbar-summary { grid-template-columns: 1fr 1fr; }
  .toolbar-metric { border-block-start: 1px solid var(--border); }
  .toolbar-metric:nth-child(2) { border-inline-start: 1px solid var(--border); border-block-start: 0; }
  .toolbar-metric:nth-child(3) { border-inline-start: 0; }
  .refresh-btn { min-height: 34px; border-block-start: 1px solid var(--border); }
}
</style>
