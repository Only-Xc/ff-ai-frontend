<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { GraphSources, KnowledgeFile, KnowledgeFolder } from '@/api'
import SvgIcon from '@/components/SvgIcon.vue'
import KnowledgeSourceTreeBranch from './KnowledgeSourceTreeBranch.vue'
import { findKnowledgeFolderTrail } from '@/utils/knowledgeSourceOptions'

const props = withDefaults(defineProps<{
  modelValue: string
  folders: KnowledgeFolder[]
  files: KnowledgeFile[]
  mails: GraphSources['mails']
  mode?: 'all' | 'files' | 'mails'
  disabled?: boolean
  title?: string
}>(), {
  disabled: false,
  mode: 'all',
  title: '选择知识来源',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const expanded = ref<Set<string>>(new Set())

const selectedType = computed<'search' | 'folder' | 'file' | 'mail'>(() => {
  if (props.modelValue.startsWith('folder:')) return 'folder'
  if (props.modelValue.startsWith('file:')) return 'file'
  if (props.modelValue.startsWith('mail:')) return 'mail'
  if (props.mode === 'files') return 'folder'
  if (props.mode === 'mails') return 'mail'
  return 'search'
})

const selectedLabel = computed(() => {
  const separator = props.modelValue.indexOf(':')
  const id = separator >= 0 ? props.modelValue.slice(separator + 1) : ''

  if (selectedType.value === 'folder') {
    const trail = findKnowledgeFolderTrail(props.folders, id)
    return trail.length ? `目录 · ${trail.map(folder => folder.name).join(' / ')}` : '知识库目录'
  }
  if (selectedType.value === 'file') {
    const file = props.files.find(item => item.id === id)
    return file ? `文件 · ${file.name}` : '知识库文件'
  }
  if (selectedType.value === 'mail') {
    const mail = props.mails.find(item => item.id === id)
    return mail ? `邮件 · ${mail.name}` : '邮件'
  }
  if (props.mode === 'files') return '选择目录或文件'
  if (props.mode === 'mails') return '选择邮件'
  return '全部知识来源'
})

const orphanFiles = computed(() => {
  const folderIds = new Set<string>()
  const visit = (nodes: KnowledgeFolder[]) => nodes.forEach(folder => {
    folderIds.add(folder.id)
    visit(folder.children || [])
  })
  visit(props.folders)
  return props.files
    .filter(file => !folderIds.has(file.folder_id))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
})

function revealSelection() {
  const next = new Set(expanded.value)
  props.folders.forEach(folder => next.add(folder.id))

  const separator = props.modelValue.indexOf(':')
  const type = separator >= 0 ? props.modelValue.slice(0, separator) : ''
  const id = separator >= 0 ? props.modelValue.slice(separator + 1) : ''
  let folderId = type === 'folder' ? id : ''
  if (type === 'file') folderId = props.files.find(file => file.id === id)?.folder_id || ''
  findKnowledgeFolderTrail(props.folders, folderId).forEach(folder => next.add(folder.id))
  expanded.value = next
}

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) revealSelection()
}

function toggleFolder(id: string) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

function select(value: string) {
  emit('update:modelValue', value)
  open.value = false
  nextTick(() => emit('change', value))
}

function onDocumentPointerDown(event: PointerEvent) {
  if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

watch(() => [props.modelValue, props.folders, props.files] as const, revealSelection, { immediate: true })
watch(() => props.disabled, disabled => {
  if (disabled) open.value = false
})

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onDocumentKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onDocumentKeyDown)
})
</script>

<template>
  <div ref="root" class="knowledge-source-select" :class="{ open, disabled }">
    <button
      class="source-trigger"
      type="button"
      :disabled="disabled"
      :title="selectedLabel"
      aria-haspopup="tree"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <SvgIcon :name="selectedType" :size="14" class="trigger-icon" />
      <span class="trigger-label">{{ selectedLabel }}</span>
      <span class="trigger-chevron" :class="{ expanded: open }" aria-hidden="true"></span>
    </button>

    <div v-if="open" class="source-popover" :aria-label="title">
      <button
        v-if="mode === 'all'"
        class="global-option"
        :class="{ selected: modelValue === 'global' }"
        type="button"
        @click="select('global')"
      >
        <SvgIcon name="search" :size="15" />
        <span>全部知识来源</span>
        <SvgIcon v-if="modelValue === 'global'" name="check" :size="14" class="option-check" />
      </button>

      <section v-if="mode !== 'mails' && (folders.length || files.length)" class="source-section">
        <div class="section-label">知识库目录</div>
        <ul class="source-tree" role="tree" aria-label="知识库目录与文件">
          <KnowledgeSourceTreeBranch
            v-for="folder in folders"
            :key="folder.id"
            :folder="folder"
            :files="files"
            :expanded="expanded"
            :selected-value="modelValue"
            @toggle="toggleFolder"
            @select="select"
          />
          <li v-for="file in orphanFiles" :key="file.id" role="treeitem">
            <button
              class="orphan-file"
              :class="{ selected: modelValue === `file:${file.id}` }"
              type="button"
              @click="select(`file:${file.id}`)"
            >
              <SvgIcon name="file" :size="14" />
              <span>{{ file.name }}</span>
              <SvgIcon v-if="modelValue === `file:${file.id}`" name="check" :size="14" class="option-check" />
            </button>
          </li>
        </ul>
      </section>

      <section v-if="mode !== 'files' && mails.length" class="source-section">
        <div class="section-label">邮件</div>
        <div class="mail-list" role="tree" aria-label="邮件来源">
          <button
            v-for="mail in mails"
            :key="mail.id"
            class="mail-option"
            :class="{ selected: modelValue === `mail:${mail.id}` }"
            type="button"
            role="treeitem"
            @click="select(`mail:${mail.id}`)"
          >
            <SvgIcon name="mail" :size="14" />
            <span>{{ mail.name }}</span>
            <SvgIcon v-if="modelValue === `mail:${mail.id}`" name="check" :size="14" class="option-check" />
          </button>
        </div>
      </section>

      <div
        v-if="(mode === 'files' && !folders.length && !files.length)
          || (mode === 'mails' && !mails.length)
          || (mode === 'all' && !folders.length && !files.length && !mails.length)"
        class="source-empty"
      >暂无知识来源</div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-source-select {
  position: relative;
  min-width: 0;
  font-family: inherit;
}

.source-trigger {
  width: 100%;
  height: 32px;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  color: var(--t2);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.source-trigger:hover:not(:disabled),
.knowledge-source-select.open .source-trigger {
  border-color: var(--p);
}

.source-trigger:focus-visible {
  border-color: var(--p);
  box-shadow: 0 0 0 2px var(--p-ring);
}

.source-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.trigger-icon {
  flex: 0 0 auto;
  color: var(--p);
}

.trigger-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.trigger-chevron {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-right: 1.5px solid var(--t4);
  border-bottom: 1.5px solid var(--t4);
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform 0.15s ease;
}

.trigger-chevron.expanded {
  transform: rotate(225deg) translate(-1px, -1px);
}

.source-popover {
  position: absolute;
  z-index: 120;
  top: calc(100% + 6px);
  right: 0;
  width: max(100%, 350px);
  max-width: min(420px, calc(100vw - 24px));
  max-height: min(440px, calc(100vh - 100px));
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--surface);
  box-shadow: var(--sh-lg);
}

.global-option,
.mail-option,
.orphan-file {
  width: 100%;
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 9px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--t3);
  font: inherit;
  font-size: 0.77rem;
  text-align: left;
  cursor: pointer;
}

.global-option:hover,
.mail-option:hover,
.orphan-file:hover,
.global-option.selected,
.mail-option.selected,
.orphan-file.selected {
  background: var(--surface-2);
}

.global-option.selected,
.mail-option.selected,
.orphan-file.selected {
  color: var(--p);
  font-weight: 600;
}

.global-option span,
.mail-option span,
.orphan-file span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-check {
  flex: 0 0 auto;
}

.source-section {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid var(--border-light);
}

.section-label {
  padding: 5px 9px 4px;
  color: var(--t4);
  font-size: 0.65rem;
  font-weight: 650;
}

.source-tree {
  margin: 0;
  padding: 0;
}

.source-tree > li,
.mail-list {
  list-style: none;
}

.source-empty {
  padding: 24px 12px;
  color: var(--t4);
  font-size: 0.75rem;
  text-align: center;
}

@media (max-width: 640px) {
  .source-popover {
    right: auto;
    left: 0;
    width: 100%;
    max-width: 100%;
    max-height: min(420px, calc(100vh - 150px));
  }
}
</style>
