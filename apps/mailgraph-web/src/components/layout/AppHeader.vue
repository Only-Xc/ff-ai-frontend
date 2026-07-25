<script setup lang="ts">
import { computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { useAccountStore } from '@/stores/account'

defineEmits<{ openNav: [] }>()

const accountStore = useAccountStore()
const accountInitial = computed(() => {
  const label = accountStore.active?.label || accountStore.active?.email_user || 'M'
  return label.slice(0, 1).toUpperCase()
})
</script>

<template>
  <header class="app-header">
    <div class="brand">
      <div class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2 2 22h20L12 2Zm0 4.5 6.5 13h-13L12 6.5Z" />
          <path d="m12 10.5-3 6h6l-3-6Z" />
        </svg>
      </div>
      <div class="brand-copy">
        <strong>FF AI Platform</strong>
        <span>MAIL KNOWLEDGE</span>
      </div>
    </div>

    <div class="header-actions">
      <div v-if="accountStore.accounts.length" class="account-switcher">
        <span class="account-avatar">{{ accountInitial }}</span>
        <select v-model="accountStore.activeId" aria-label="当前邮箱账户" title="切换邮箱账户">
          <option v-for="account in accountStore.accounts" :key="account.id" :value="account.id">
            {{ account.label || account.email_user }}
          </option>
        </select>
      </div>
      <div v-else class="account-switcher account-switcher--empty">
        <span class="account-avatar"><SvgIcon name="user" :size="14" /></span>
        <span>未配置账户</span>
      </div>
      <button class="mobile-menu" type="button" title="打开导航" aria-label="打开导航" @click="$emit('openNav')">
        <SvgIcon name="menu" :size="19" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: fixed; inset: 0 0 auto 0; z-index: 110;
  height: var(--header-h); padding: 0 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  background: var(--surface); border-bottom: 1px solid var(--border);
}
.brand { height: 100%; display: flex; align-items: center; gap: 9px; min-width: 0; }
.brand-mark { width: 28px; height: 28px; color: var(--p); flex: 0 0 28px; }
.brand-mark svg { width: 100%; height: 100%; display: block; }
.brand-copy { display: flex; flex-direction: column; min-width: 0; line-height: 1; }
.brand-copy strong { color: var(--t1); font-size: 0.88rem; font-weight: 700; white-space: nowrap; }
.brand-copy span { margin-top: 4px; color: var(--t4); font-size: 0.56rem; font-weight: 600; letter-spacing: 1.2px; white-space: nowrap; }
.header-actions { display: flex; align-items: center; gap: 8px; min-width: 0; }
.account-switcher {
  height: 32px; min-width: 0; max-width: 260px; padding: 0 8px 0 4px;
  display: flex; align-items: center; gap: 7px;
  border: 1px solid var(--border); border-radius: 6px; background: var(--surface);
  color: var(--t3); font-size: 0.75rem;
}
.account-avatar {
  width: 23px; height: 23px; flex: 0 0 23px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--p-light); color: var(--p); font-size: 0.7rem; font-weight: 700;
}
.account-switcher select {
  min-width: 0; width: 180px; height: 28px; padding: 0 18px 0 0;
  border: 0; background: transparent; box-shadow: none;
  color: var(--t2); font-size: 0.75rem; cursor: pointer;
  white-space: nowrap; text-overflow: ellipsis;
}
.account-switcher select:focus { box-shadow: none; }
.account-switcher--empty { padding-right: 10px; }
.mobile-menu {
  display: none; width: 32px; height: 32px; border: 1px solid var(--border);
  border-radius: 6px; background: var(--surface); color: var(--t3); cursor: pointer;
  align-items: center; justify-content: center;
}
.mobile-menu:hover { color: var(--p); border-color: var(--p); background: var(--p-bg); }
@media (max-width: 768px) {
  .app-header { padding: 0 12px; }
  .brand-copy span { display: none; }
  .account-switcher { max-width: 148px; }
  .account-switcher select { width: 105px; }
  .account-switcher--empty { display: none; }
  .mobile-menu { display: inline-flex; order: -1; }
  .header-actions { order: -1; }
  .brand { margin-left: auto; }
}
</style>
