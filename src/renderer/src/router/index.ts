import { createRouter, createWebHashHistory } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'

// hash 模式：打包成桌面应用后无需服务器也能正常跳转
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      redirect: '/add',
      children: [
        {
          path: '/add',
          name: 'add',
          component: () => import('../views/AddRecordView.vue'),
          meta: { title: '记一笔' }
        },
        {
          path: '/records',
          name: 'records',
          component: () => import('../views/RecordsView.vue'),
          meta: { title: '账单' }
        },
        {
          path: '/stats',
          name: 'stats',
          component: () => import('../views/StatsView.vue'),
          meta: { title: '统计' }
        },
        {
          path: '/categories',
          name: 'categories',
          component: () => import('../views/CategoriesView.vue'),
          meta: { title: '分类管理' }
        }
      ]
    }
  ]
})

export default router
