import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask } from '@/api/tasks'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref([])

  async function addTask({ examId, content }) {
    try {
      const res = await apiCreateTask({ examId, content })
      if (res.code === 0) {
        tasks.value.push(res.data)
        return { success: true, data: res.data, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  async function toggleTask(id) {
    const task = tasks.value.find((t) => String(t.id) === String(id))
    if (!task) {
      return { success: false, data: null, message: '任务不存在' }
    }
    try {
      const res = await apiUpdateTask(id, { done: !task.done })
      if (res.code === 0) {
        const idx = tasks.value.findIndex((t) => String(t.id) === String(id))
        if (idx >= 0) {
          tasks.value[idx] = res.data
        }
        return { success: true, data: res.data, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  async function updateTask(id, { content }) {
    try {
      const res = await apiUpdateTask(id, { content })
      if (res.code === 0) {
        const idx = tasks.value.findIndex((t) => String(t.id) === String(id))
        if (idx >= 0) {
          tasks.value[idx] = res.data
        }
        return { success: true, data: res.data, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  async function deleteTask(id) {
    try {
      const res = await apiDeleteTask(id)
      if (res.code === 0) {
        tasks.value = tasks.value.filter((t) => String(t.id) !== String(id))
        return { success: true, data: null, message: '' }
      }
      return { success: false, data: null, message: res.message }
    } catch {
      return { success: false, data: null, message: '网络异常，请稍后重试' }
    }
  }

  function getTasksByExamId(examId) {
    return tasks.value
      .filter((t) => String(t.examId) === String(examId))
      .map((t) => ({ ...t }))
      .sort((a, b) => {
        const ac = a.createdAt ?? ''
        const bc = b.createdAt ?? ''
        if (ac !== bc) return ac < bc ? -1 : 1
        return 0
      })
  }

  function getTaskProgress(examId) {
    const list = tasks.value.filter((t) => String(t.examId) === String(examId))
    return {
      total: list.length,
      done: list.filter((t) => t.done === true).length
    }
  }

  async function deleteTasksByExamId(examId) {
    const count = tasks.value.filter((t) => String(t.examId) === String(examId)).length
    tasks.value = tasks.value.filter((t) => String(t.examId) !== String(examId))
    return { success: true, data: { count }, message: '' }
  }

  async function reloadByExamId(examId) {
    try {
      const res = await listTasks(examId)
      if (res.code === 0) {
        tasks.value = tasks.value.filter((t) => String(t.examId) !== String(examId))
        if (Array.isArray(res.data)) {
          tasks.value.push(...res.data)
        }
      }
    } catch {
      // 保持内存不变
    }
  }

  async function reload() {
    tasks.value = []
  }

  return {
    tasks,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    getTasksByExamId,
    getTaskProgress,
    deleteTasksByExamId,
    reload,
    reloadByExamId
  }
})

export default useTasksStore