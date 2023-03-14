// Composables
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    props: true
  },
  {
    path: '/create',
    component: () => import('@/views/Create.vue'),
    props: true
  },
  {
    path: '/test',
    component: () => import('@/views/Test.vue'),
    props: true
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
