import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { title: '登录', public: true },
    },
    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '仪表盘' },
        },
        {
          path: 'scheduled-task',
          name: 'scheduled-task',
          component: () => import('@/views/ScheduledTaskView.vue'),
          meta: { title: '定时任务' },
        },
        {
          path: 'sys-config',
          name: 'sys-config',
          component: () => import('@/views/SysConfigView.vue'),
          meta: { title: '配置管理' },
        },
        {
          path: 'llm-config',
          name: 'llm-config',
          component: () => import('@/views/LlmConfigView.vue'),
          meta: { title: 'LLM 配置' },
        },
        {
          path: 'llm-logs',
          name: 'llm-logs',
          component: () => import('@/views/LlmLogsView.vue'),
          meta: { title: 'LLM 调用日志' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  auth.initFromStorage()
  const isPublic = (to.meta?.public as boolean) === true
  if (isPublic) {
    if (auth.isLoggedIn && to.name === 'login') {
      next({ path: '/' })
    } else {
      next()
    }
    return
  }
  if (!auth.isLoggedIn) {
    next({
      name: 'login',
      query: to.path !== '/' ? { from: to.fullPath } : undefined,
    })
  } else {
    next()
  }
})

router.afterEach((to) => {
  const title = (to.meta?.title as string) || '管理后台'
  document.title = title ? `${title} · 管理后台` : '管理后台'
})

export default router
