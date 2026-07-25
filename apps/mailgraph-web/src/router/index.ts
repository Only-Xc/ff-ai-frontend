import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/chat' },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/pages/ChatPage.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/DashboardPage.vue'),
    },
    {
      path: '/workbench',
      name: 'workbench',
      component: () => import('@/pages/WorkbenchPage.vue'),
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('@/pages/KnowledgePage.vue'),
    },
    {
      path: '/graph',
      name: 'graph',
      component: () => import('@/pages/GraphPage.vue'),
    },
  ],
})

export default router
