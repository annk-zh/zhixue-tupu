import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMe } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
  const username = ref('')
  const loaded = ref(false)

  async function fetchMe() {
    if (loaded.value) return
    try {
      const res = await getMe()
      if (res.code === 0 && res.data) {
        username.value = res.data.username || ''
        loaded.value = true
      }
    } catch {
      // 401 由拦截器处理
    }
  }

  function clearAuth() {
    username.value = ''
    loaded.value = false
  }

  return { username, loaded, fetchMe, clearAuth }
})

export default useAuthStore