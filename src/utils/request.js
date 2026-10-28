import axios from 'axios'
import router from '@/router'
import { getToken, clearToken } from '@/utils/auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      if (router.currentRoute.value.path !== '/login') {
        router.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default request