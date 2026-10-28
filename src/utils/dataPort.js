import storage from '@/utils/storage'
import { isValidExamDate } from '@/utils/examDate'
import { useExamsStore } from '@/store/modules/exams'
import { useTasksStore } from '@/store/modules/tasks'
import { migrateLocalData } from '@/utils/migration'

function downloadJson(filename, jsonText) {
  const blob = new Blob([jsonText], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSnapshot() {
  try {
    const examsStore = useExamsStore()
    const tasksStore = useTasksStore()
    const snapshot = {
      exams: [...examsStore.exams],
      tasks: [...tasksStore.tasks]
    }
    const jsonText = JSON.stringify(snapshot, null, 2)
    const now = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const filename = `zhixue-data-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.json`
    downloadJson(filename, jsonText)
    return { success: true, message: '' }
  } catch (e) {
    return { success: false, message: '导出失败，数据异常' }
  }
}

function validateExams(exams) {
  if (!Array.isArray(exams)) {
    return { valid: false, reason: '文件格式不合法：exams 不是数组' }
  }
  const seenIds = new Set()
  for (let i = 0; i < exams.length; i++) {
    const e = exams[i]
    if ((typeof e.id !== 'string' && typeof e.id !== 'number') || e.id === '') return { valid: false, reason: `文件格式不合法：exams[${i}].id 无效` }
    if (seenIds.has(e.id)) return { valid: false, reason: `文件格式不合法：exams[${i}].id 重复` }
    seenIds.add(e.id)
    if (typeof e.name !== 'string' || e.name.trim() === '' || e.name.trim().length > 50) return { valid: false, reason: `文件格式不合法：exams[${i}].name 无效` }
    if (!isValidExamDate(e.examDate)) return { valid: false, reason: `文件格式不合法：exams[${i}].examDate 无效` }
    if (e.note !== undefined && (typeof e.note !== 'string' || e.note.length > 200)) return { valid: false, reason: `文件格式不合法：exams[${i}].note 无效` }
    if (typeof e.createdAt !== 'string' || e.createdAt.length > 30 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(e.createdAt)) return { valid: false, reason: `文件格式不合法：exams[${i}].createdAt 无效` }
  }
  return { valid: true, reason: '' }
}

function validateTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return { valid: false, reason: '文件格式不合法：tasks 不是数组' }
  }
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i]
    if ((typeof t.id !== 'string' && typeof t.id !== 'number') || t.id === '') return { valid: false, reason: `文件格式不合法：tasks[${i}].id 无效` }
    if ((typeof t.examId !== 'string' && typeof t.examId !== 'number') || t.examId === '') return { valid: false, reason: `文件格式不合法：tasks[${i}].examId 无效` }
    if (typeof t.content !== 'string' || t.content.trim() === '' || t.content.trim().length > 100) return { valid: false, reason: `文件格式不合法：tasks[${i}].content 无效` }
    if (typeof t.done !== 'boolean') return { valid: false, reason: `文件格式不合法：tasks[${i}].done 无效` }
    if (typeof t.createdAt !== 'string' || t.createdAt.length > 30 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(t.createdAt)) return { valid: false, reason: `文件格式不合法：tasks[${i}].createdAt 无效` }
  }
  return { valid: true, reason: '' }
}

function validateReferentialIntegrity(exams, tasks) {
  const examIds = new Set(exams.map((e) => e.id))
  for (const t of tasks) {
    if (!examIds.has(t.examId)) {
      return { valid: false, reason: '存在孤儿任务，导入取消' }
    }
  }
  return { valid: true, reason: '' }
}

export function validateSnapshot(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { valid: false, reason: '文件格式不合法' }
  }
  const knownKeys = new Set(['exams', 'tasks'])
  for (const key of Object.keys(raw)) {
    if (!knownKeys.has(key)) {
      return { valid: false, reason: `文件格式不合法：未知字段 ${key}` }
    }
  }
  if (raw.exams !== undefined) {
    const r = validateExams(raw.exams)
    if (!r.valid) return r
  }
  if (raw.tasks !== undefined) {
    const r = validateTasks(raw.tasks)
    if (!r.valid) return r
  }
  if (raw.exams !== undefined && raw.tasks !== undefined) {
    const r = validateReferentialIntegrity(raw.exams, raw.tasks)
    if (!r.valid) return r
  }
  return { valid: true, reason: '' }
}

export async function restoreSnapshot(snapshot) {
  storage.set('exams', snapshot.exams || [])
  storage.set('tasks', snapshot.tasks || [])
  const result = await migrateLocalData()
  if (result.success) {
    const examsStore = useExamsStore()
    const tasksStore = useTasksStore()
    await examsStore.reload()
    await tasksStore.reload()
    return { success: true, message: '' }
  }
  return { success: false, message: result.message || '导入失败' }
}

export default { exportSnapshot, validateSnapshot, restoreSnapshot }