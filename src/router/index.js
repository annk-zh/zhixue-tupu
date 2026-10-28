import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '@/utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/exam/:id',
    name: 'ExamDetail',
    component: () => import('@/views/ExamDetail.vue'),
    meta: { title: '考试详情' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  if (isLoggedIn() && to.path === '/login') {
    return { path: '/' }
  }
  if (!isLoggedIn() && !to.meta.public) {
    return { path: '/login' }
  }
  return true
})

router.afterEach((to) => {
  const base = '智学图谱'
  document.title = to.meta?.title ? `${to.meta.title} - ${base}` : base
})

export default router