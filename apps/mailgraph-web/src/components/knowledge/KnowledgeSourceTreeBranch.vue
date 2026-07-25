<script setup lang="ts">
import { computed } from 'vue'
import type { KnowledgeFile, KnowledgeFolder } from '@/api'
import SvgIcon from '@/components/SvgIcon.vue'
import { platformLocale, t } from '@/platformContext'

const props = defineProps<{
  folder: KnowledgeFolder
  files: KnowledgeFile[]
  expanded: ReadonlySet<string>
  selectedValue: string
}>()

const emit = defineEmits<{
  toggle: [id: string]
  select: [value: string]
}>()

const childFolders = computed(() =>
  [...(props.folder.children || [])].sort((a, b) => a.name.localeCompare(b.name, platformLocale.value)))

const directFiles = computed(() =>
  props.files
    .filter(file => file.folder_id === props.folder.id)
    .sort((a, b) => a.name.localeCompare(b.name, platformLocale.value)))

const hasChildren = computed(() => childFolders.value.length > 0 || directFiles.value.length > 0)
const isExpanded = computed(() => props.expanded.has(props.folder.id))

function forwardToggle(id: string) {
  emit('toggle', id)
}

function forwardSelect(value: string) {
  emit('select', value)
}
</script>

<template>
  <li
    class="tree-branch"
    role="treeitem"
    :aria-expanded="hasChildren ? isExpanded : undefined"
  >
    <div class="tree-row" :class="{ selected: selectedValue === `folder:${folder.id}` }">
      <button
        v-if="hasChildren"
        class="tree-toggle"
        type="button"
        :title="t(isExpanded ? '收起目录' : '展开目录')"
        :aria-label="`${t(isExpanded ? '收起目录' : '展开目录')} ${folder.name}`"
        @click.stop="emit('toggle', folder.id)"
      >
        <span class="tree-chevron" :class="{ expanded: isExpanded }" aria-hidden="true"></span>
      </button>
      <span v-else class="tree-toggle-spacer" aria-hidden="true"></span>

      <button class="tree-item-button" type="button" @click="emit('select', `folder:${folder.id}`)">
        <SvgIcon name="folder" :size="15" class="folder-icon" />
        <span class="tree-item-name" data-no-ui-translate>{{ folder.name }}</span>
        <span v-if="folder.file_count" class="tree-item-count">{{ folder.file_count }}</span>
        <SvgIcon
          v-if="selectedValue === `folder:${folder.id}`"
          name="check"
          :size="14"
          class="selected-icon"
        />
      </button>
    </div>

    <ul v-if="hasChildren && isExpanded" class="tree-children" role="group">
      <KnowledgeSourceTreeBranch
        v-for="child in childFolders"
        :key="child.id"
        :folder="child"
        :files="files"
        :expanded="expanded"
        :selected-value="selectedValue"
        @toggle="forwardToggle"
        @select="forwardSelect"
      />

      <li
        v-for="file in directFiles"
        :key="file.id"
        class="tree-file"
        role="treeitem"
      >
        <button
          class="tree-item-button file-button"
          :class="{ selected: selectedValue === `file:${file.id}` }"
          type="button"
          @click="emit('select', `file:${file.id}`)"
        >
          <SvgIcon name="file" :size="14" class="file-icon" />
          <span class="tree-item-name" data-no-ui-translate>{{ file.name }}</span>
          <SvgIcon
            v-if="selectedValue === `file:${file.id}`"
            name="check"
            :size="14"
            class="selected-icon"
          />
        </button>
      </li>
    </ul>
  </li>
</template>

<style scoped>
.tree-branch,
.tree-file {
  list-style: none;
}

.tree-row {
  display: flex;
  align-items: center;
  min-width: 0;
  border-radius: 5px;
}

.tree-row:hover,
.tree-row.selected {
  background: var(--surface-2);
}

.tree-row.selected {
  color: var(--p);
}

.tree-toggle,
.tree-toggle-spacer {
  width: 26px;
  height: 32px;
  flex: 0 0 26px;
}

.tree-toggle {
  border: 0;
  background: transparent;
  color: var(--t4);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.tree-toggle:hover {
  color: var(--t1);
  background: var(--border-light);
}

.tree-chevron {
  width: 7px;
  height: 7px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.15s ease;
}

.tree-chevron.expanded {
  transform: rotate(45deg) translate(-1px, -1px);
}

.tree-item-button {
  min-width: 0;
  min-height: 32px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 0 8px 0 1px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.77rem;
  text-align: left;
  cursor: pointer;
}

.tree-item-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-item-count {
  color: var(--t4);
  font-size: 0.65rem;
}

.folder-icon {
  flex: 0 0 auto;
  color: var(--p);
}

.file-icon {
  flex: 0 0 auto;
  color: var(--t4);
}

.selected-icon {
  flex: 0 0 auto;
  color: var(--p);
}

.tree-children {
  margin: 0 0 0 13px;
  padding: 0 0 0 12px;
  border-left: 1px solid var(--border);
}

.file-button {
  width: 100%;
  padding-left: 27px;
  border-radius: 5px;
  color: var(--t3);
}

.file-button:hover,
.file-button.selected {
  background: var(--surface-2);
}

.file-button.selected {
  color: var(--p);
  font-weight: 600;
}
</style>
