<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useStatusStore } from '@/stores/status'
import { onMounted } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

defineProps<{ mobileOpen?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const router = useRouter()
const route = useRoute()
const statusStore = useStatusStore()

onMounted(() => statusStore.refresh())

const navItems = [
  { key: 'chat', icon: 'chat' as const, label: 'AI 对话' },
  { key: 'dashboard', icon: 'dashboard' as const, label: '项目看板' },
  { key: 'knowledge', icon: 'folder' as const, label: '知识库' },
  { key: 'workbench', icon: 'inbox' as const, label: '邮件工作台' },
  { key: 'graph', icon: 'graph' as const, label: '关系图谱' },
]

function navigate(key: string) {
  router.push({ name: key })
  emit('close')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'mobile-open': mobileOpen }">
    <div class="sidebar-heading">
      <span>工作空间</span>
      <button class="mobile-close" type="button" title="关闭导航" aria-label="关闭导航" @click="emit('close')">
        <SvgIcon name="close" :size="18" />
      </button>
    </div>

    <nav aria-label="主导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        :class="['nav-btn', { active: route.name === item.key }]"
        @click="navigate(item.key)"
      >
        <SvgIcon :name="item.icon" :size="17" class="nav-icon" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="service-summary">
        <span class="service-label">服务状态</span>
        <div class="service-dots" aria-label="服务状态">
          <span :class="['service-dot', { ok: statusStore.services.redis }]" title="Redis"></span>
          <span :class="['service-dot', { ok: statusStore.services.neo4j }]" title="Neo4j"></span>
          <span :class="['service-dot', { ok: statusStore.services.milvus }]" title="Milvus"></span>
        </div>
      </div>
      <span class="version">MailGraph v4.0</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  position: fixed; top: var(--header-h); left: 0; bottom: 0; z-index: 80;
  width: var(--sidebar-w); padding: 14px 10px 12px;
  display: flex; flex-direction: column;
  background: var(--side); border-right: 1px solid var(--side-border);
}
.sidebar-heading {
  height: 28px; padding: 0 10px; margin-bottom: 5px;
  display: flex; align-items: center; justify-content: space-between;
  color: var(--t4); font-size: 0.68rem; font-weight: 600;
}
nav { display: flex; flex: 1; flex-direction: column; gap: 3px; }
.nav-btn {
  position: relative; width: 100%; height: 40px; padding: 0 12px;
  display: flex; align-items: center; gap: 10px;
  border: 0; border-radius: 8px; background: transparent;
  color: var(--side-text); font-family: inherit; font-size: 0.82rem; font-weight: 500;
  text-align: left; cursor: pointer; transition: color 120ms ease, background 120ms ease;
}
.nav-btn::before {
  content: ''; position: absolute; left: 0; top: 10px; bottom: 10px;
  width: 2px; border-radius: 2px; background: transparent;
}
.nav-btn:hover { background: var(--side-hover); color: var(--t1); }
.nav-btn.active { background: var(--p-light); color: var(--side-active); font-weight: 600; }
.nav-btn.active::before { background: var(--p); }
.nav-icon { flex: 0 0 auto; color: var(--t4); }
.nav-btn.active .nav-icon { color: var(--p); }
.sidebar-footer { padding: 12px 10px 0; border-top: 1px solid var(--side-border); }
.service-summary { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.service-label, .version { color: var(--t4); font-size: 0.65rem; }
.service-dots { display: flex; align-items: center; gap: 5px; }
.service-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--red); }
.service-dot.ok { background: var(--green); }
.version { display: block; margin-top: 4px; }
.mobile-close { display: none; }

@media (max-width: 768px) {
  .sidebar {
    width: min(82vw, 280px); z-index: 100;
    transform: translateX(-100%); transition: transform 180ms ease;
    box-shadow: 12px 0 30px rgba(17, 24, 39, 0.14);
  }
  .sidebar.mobile-open { transform: translateX(0); }
  .mobile-close {
    width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center;
    border: 0; border-radius: 5px; background: transparent; color: var(--t3); cursor: pointer;
  }
  .mobile-close:hover { background: var(--side-hover); color: var(--p); }
}
</style>
