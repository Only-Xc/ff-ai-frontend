<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { graphApi, type GraphFilter, type GraphSources } from '@/api'
import GraphView from '@/components/graph/GraphView.vue'
import { NODE_COLORS, LABEL_NAMES, LABEL_ICONS, colorOf } from '@/components/graph/graphTheme'
import KnowledgeSourceTreeSelect from '@/components/knowledge/KnowledgeSourceTreeSelect.vue'
import SvgIcon from '@/components/SvgIcon.vue'

type GraphMode = 'files' | 'mails'

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
    return
  }
  refreshing.value = true
  sourceError.value = ''
  try {
    const [entRes, relRes] = await Promise.all([
      graphApi.entities(1, 500, filter),
      graphApi.relationships(1, 1000, filter),
    ])
    entities.value = entRes.entities || []
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
      <div class="toolbar-left">
        <div>
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
      <div class="toolbar-center">
        <div class="stat-pills-inline">
          <span class="stat-pill-mini">节点 <b>{{ shownEntities.length }}</b></span>
          <span class="stat-pill-mini">关系 <b>{{ shownRelationships.length }}</b></span>
        </div>
      </div>
      <div class="toolbar-right">
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
        <button class="btn btn-secondary btn-sm refresh-btn" :disabled="refreshing || !sourceSelection" @click="loadGraph">
          {{ refreshing ? '刷新中…' : '界面刷新' }}
        </button>
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
  display: flex; align-items: center; gap: 1rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0; flex-wrap: wrap;
}
.toolbar-left { display: flex; align-items: center; gap: 0.75rem; min-width: 260px; }
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
.toolbar-center { flex: 1; display: flex; justify-content: center; }
.stat-pills-inline { display: flex; gap: 0.5rem; }
.stat-pill-mini {
  font-size: 0.72rem; color: var(--t3);
  background: var(--surface-2); padding: 3px 10px; border-radius: 20px;
}
.toolbar-right { display: flex; align-items: center; gap: 0.6rem; }
.refresh-btn { flex-shrink: 0; white-space: nowrap; }

.graph-container {
  flex: 1; min-height: 0;
  padding: 8px;
  background: var(--graph-bg);
}

.filter-row { display: flex; gap: 4px; flex-wrap: wrap; }

.stat-row { display: flex; gap: 0.6rem; margin-bottom: 0.85rem; }
.stat-pill {
  font-size: 0.76rem; color: var(--t3);
  background: var(--surface-2); border: 1px solid var(--border);
  padding: 0.28rem 0.7rem; border-radius: 9999px;
}
.stat-pill b { color: var(--p); font-weight: 700; }

.filter-row {
  display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;
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

@media (max-width: 900px) {
  .graph-toolbar { align-items: flex-start; }
  .toolbar-left { width: 100%; flex-wrap: wrap; }
  .graph-mode { width: 100%; min-width: 0; }
  .graph-source-tree { width: 100%; }
  .toolbar-center { justify-content: flex-start; }
  .toolbar-right { width: 100%; flex-wrap: wrap; }
}
</style>
