import storage from '@/utils/storage'

const TOKEN_KEY = 'token'

export function getToken() {
  return storage.get(TOKEN_KEY)
}

export function setToken(token) {
  return storage.set(TOKEN_KEY, token)
}

export function clearToken() {
  storage.remove(TOKEN_KEY)
}

export function isLoggedIn() {
  const token = getToken()
  return typeof token === 'string' && token.length > 0
}