import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listExams, createExam as apiCreateExam, updateExam as apiUpdateExam, deleteExam as apiDeleteExam } from '@/api/exams'
import { useTasksStore } from '@/store/modules/tasks'

let loaded = false

export const useExamsStore = defineStore('exams', () => {
  const exams = ref([])

  async function addExam(payload) {
    try {
      const res = await apiCreateExam(payload)
      if (res.code === 0) {
        exams.value.push(res.data)
        return { success: true, data: res.data, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  async function updateExam(id, patch) {
    try {
      const res = await apiUpdateExam(id, patch)
      if (res.code === 0) {
        const idx = exams.value.findIndex((e) => String(e.id) === String(id))
        if (idx >= 0) {
          exams.value[idx] = res.data
        }
        return { success: true, data: res.data, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  async function deleteExam(id) {
    try {
      const res = await apiDeleteExam(id)
      if (res.code === 0) {
        exams.value = exams.value.filter((e) => String(e.id) !== String(id))
        const tasksStore = useTasksStore()
        await tasksStore.deleteTasksByExamId(id)
        return { success: true, data: null, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  function getExamById(id) {
    const found = exams.value.find((e) => String(e.id) === String(id))
    return found ? { ...found } : null
  }

  async function reload() {
    try {
      const res = await listExams()
      if (res.code === 0) {
        exams.value = res.data
        loaded = true
      }
    } catch {
      // 保持内存不变
    }
  }

  async function ensureLoaded() {
    if (!loaded) {
      await reload()
    }
  }

  return { exams, addExam, updateExam, deleteExam, getExamById, reload, ensureLoaded }
})

export default useExamsStore