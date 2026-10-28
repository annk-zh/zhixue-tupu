/**
 * localStorage 封装
 * - 所有 key 统一加 `zhixue_` 前缀，避免与其它应用冲突
 * - 自动 JSON 序列化 / 反序列化
 * - clear() 仅清除本应用前缀的 key，不影响其它存储
 */

const PREFIX = 'zhixue_'

function realKey(key) {
  return `${PREFIX}${key}`
}

export function get(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(realKey(key))
    if (raw === null) return defaultValue
    return JSON.parse(raw)
  } catch (e) {
    console.warn(`[storage] 读取失败: ${key}`, e)
    return defaultValue
  }
}

export function set(key, value) {
  try {
    localStorage.setItem(realKey(key), JSON.stringify(value))
    return true
  } catch (e) {
    console.error(`[storage] 写入失败: ${key}`, e)
    return false
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(realKey(key))
  } catch (e) {
    console.warn(`[storage] 移除失败: ${key}`, e)
  }
}

export function clear() {
  try {
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) keys.push(k)
    }
    keys.forEach((k) => localStorage.removeItem(k))
  } catch (e) {
    console.warn('[storage] 清除失败', e)
  }
}

export function has(key) {
  try {
    return localStorage.getItem(realKey(key)) !== null
  } catch (e) {
    console.warn(`[storage] 查询失败: ${key}`, e)
    return false
  }
}

export function getAll() {
  const result = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(PREFIX)) {
        const businessKey = k.slice(PREFIX.length)
        const raw = localStorage.getItem(k)
        if (raw !== null) {
          try {
            result[businessKey] = JSON.parse(raw)
          } catch {
            result[businessKey] = null
          }
        }
      }
    }
  } catch (e) {
    console.warn('[storage] 批量读取失败', e)
  }
  return result
}

export function replaceAll(snapshot) {
  const backup = getAll()
  clear()
  let allOk = true
  for (const key of Object.keys(snapshot)) {
    if (!set(key, snapshot[key])) {
      allOk = false
      break
    }
  }
  if (allOk) {
    return { success: true, message: '' }
  }
  clear()
  for (const key of Object.keys(backup)) {
    set(key, backup[key])
  }
  return { success: false, message: '写入失败' }
}

export default { get, set, remove, clear, has, getAll, replaceAll }