import request from '@/utils/request'

function validateId(id) {
  const num = Number(id)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('invalid id')
  }
  return encodeURIComponent(String(id))
}

export async function listExams() {
  const { data } = await request.get('/exams')
  return data
}

export async function createExam(payload) {
  const { data } = await request.post('/exams', payload)
  return data
}

export async function updateExam(id, patch) {
  const safeId = validateId(id)
  const { data } = await request.put(`/exams/${safeId}`, patch)
  return data
}

export async function deleteExam(id) {
  const safeId = validateId(id)
  const { data } = await request.delete(`/exams/${safeId}`)
  return data
}