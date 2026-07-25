<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { postPlatformRoute } from '@/platformContext'
import { useAccountStore } from '@/stores/account'

const accountStore = useAccountStore()
const route = useRoute()
const mobileNavOpen = ref(false)
const immersiveRoutes = new Set(['chat', 'graph'])
const embedded = window.self !== window.top

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false
  if (embedded) postPlatformRoute(route)
})

onMounted(() => {
  accountStore.fetchAccounts()
  if (embedded) postPlatformRoute(route)
})
</script>

<template>
  <AppHeader v-if="!embedded" @open-nav="mobileNavOpen = true" />
  <div v-if="!embedded && mobileNavOpen" class="mobile-nav-overlay" @click="mobileNavOpen = false"></div>
  <AppSidebar v-if="!embedded" :mobile-open="mobileNavOpen" @close="mobileNavOpen = false" />
  <main
    class="main-content"
    :class="{
      'main-content--embedded': embedded,
      'main-content--immersive': immersiveRoutes.has(String(route.name)),
    }"
  >
    <router-view />
  </main>
</template>

<style scoped>
.main-content {
  transition: margin-left 160ms ease;
}

.main-content--immersive { padding: var(--header-h) 0 0; overflow: hidden; }
.main-content--embedded { min-height: 100vh; margin-left: 0; padding-top: 22px; }
.main-content--embedded.main-content--immersive { padding-top: 0; }
.mobile-nav-overlay { display: none; }

@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
  }

  .main-content--immersive { padding: var(--header-h) 0 0; }

  .mobile-nav-overlay {
    position: fixed;
    inset: var(--header-h) 0 0;
    z-index: 90;
    display: block;
    background: rgba(17, 24, 39, 0.36);
  }
}
</style>
