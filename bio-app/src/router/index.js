import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../components/dashboard.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../components/search.vue'),
  },
  {
    path: '/signin',
    name: 'signin',
    meta: { public: true },
    component: () => import('../components/signin.vue'),
  },
  {
    path: '/signup',
    name: 'signup',
    meta: { public: true },
    component: () => import('../components/signup.vue'),
  },
  {
    path: '/apps',
    name: 'apps',
    component: () => import('../components/apps.vue'),
  },
  {
    path: '/t-pro',
    name: 't-pro',
    component: () => import('../components/t-pro.vue'),
  },
  {
    path: '/tplot',
    name: 'tplot',
    component: () => import('../components/tplot.vue'),
  },
  {
    path: '/assembly-tool',
    name: 'assembly-tool',
    component: () => import('../components/assembly-tool.vue'),
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: () => import('../components/tasks.vue'),
  },
  {
    path: '/tasks/:id',
    name: 'task-detail',
    component: () => import('../components/task-detail.vue'),
  },
  {
    path: '/sharing',
    name: 'sharing',
    component: () => import('../components/sharing.vue'),
  },
  {
    path: '/files',
    name: 'files',
    component: () => import('../components/files.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    meta: { requiresAdmin: true },
    component: () => import('../components/admin.vue'),
  },
  {
    path: '/document',
    name: 'document',
    component: () => import('../components/document.vue'),
  },
  {
    path: '/datasets',
    name: 'datasets',
    component: () => import('../components/datasets.vue'),
  },
  {
    path: '/datasets-categories',
    name: 'datasets-categories',
    component: () => import('../components/datasets-categories.vue'),
  },
  {
    path: '/datasets/:id/browse',
    name: 'dataset-browse',
    component: () => import('../components/dataset-browse.vue'),
  },
  {
    path: '/datasets/:datasetType/:id/detail',
    name: 'dataset-item-detail',
    component: () => import('../components/dataset-item-detail.vue'),
  },
  {
    path: '/datasets/:datasetType/:id/edit',
    name: 'dataset-item-edit',
    component: () => import('../components/dataset-item-edit.vue'),
  },
  {
    path: '/datasets/:id/config',
    name: 'datatable-config',
    component: () => import('../components/datatable-config.vue'),
  },
  {
    path: '/item-detail/:id',
    name: 'item-detail',
    component: () => import('../components/item-detail.vue'),
  },
  {
    path: '/datasets-legacy',
    name: 'datasets-legacy',
    component: () => import('../components/datasets-legacy.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../components/settings.vue'),
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../components/notifications.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
