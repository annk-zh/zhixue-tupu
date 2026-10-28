import request from '@/utils/request'

function validateId(id) {
  const num = Number(id)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('invalid id')
  }
  return encodeURIComponent(String(id))
}

export async function listTasks(examId) {
  const { data } = await request.get('/tasks', { params: { examId } })
  return data
}

export async function createTask(payload) {
  const { data } = await request.post('/tasks', payload)
  return data
}

export async function updateTask(id, patch) {
  const safeId = validateId(id)
  const { data } = await request.put(`/tasks/${safeId}`, patch)
  return data
}

export async function deleteTask(id) {
  const safeId = validateId(id)
  const { data } = await request.delete(`/tasks/${safeId}`)
  return data
}