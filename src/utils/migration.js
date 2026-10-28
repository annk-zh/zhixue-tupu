import storage from '@/utils/storage'
import * as examsApi from '@/api/exams'
import * as tasksApi from '@/api/tasks'
import { isValidExamDate } from '@/utils/examDate'

export async function migrateLocalData() {
  const oldExams = storage.get('exams', [])
  const oldTasks = storage.get('tasks', [])

  if (!Array.isArray(oldExams) || !Array.isArray(oldTasks)) {
    return { success: true, migrated: { exams: 0, tasks: 0 }, skipped: true, message: '本地旧数据异常，已跳过迁移' }
  }

  if (oldExams.length === 0 && oldTasks.length === 0) {
    return { success: true, migrated: { exams: 0, tasks: 0 }, skipped: true }
  }

  const idMap = new Map()

  for (const oldExam of oldExams) {
    if (!oldExam || typeof oldExam.name !== 'string' || typeof oldExam.examDate !== 'string') {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
    if (oldExam.name.trim().length === 0 || oldExam.name.trim().length > 50) {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
    if (!isValidExamDate(oldExam.examDate)) {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
    if (oldExam.note !== undefined && (typeof oldExam.note !== 'string' || oldExam.note.length > 200)) {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
    try {
      const res = await examsApi.createExam({
        name: oldExam.name,
        examDate: oldExam.examDate,
        note: oldExam.note ?? ''
      })
      if (res.code === 0) {
        idMap.set(oldExam.id, res.data.id)
      } else {
        return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
      }
    } catch {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
  }

  let uploadedTasks = 0
  for (const oldTask of oldTasks) {
    if (!oldTask || typeof oldTask.content !== 'string') {
      continue
    }
    if (oldTask.content.trim().length === 0 || oldTask.content.trim().length > 100) {
      continue
    }
    const newExamId = idMap.get(oldTask.examId)
    if (newExamId === undefined) {
      continue
    }
    try {
      const res = await tasksApi.createTask({
        examId: newExamId,
        content: oldTask.content,
        done: oldTask.done === true
      })
      if (res.code === 0) {
        uploadedTasks++
      } else {
        return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
      }
    } catch {
      return { success: false, message: '旧数据迁移失败，将在下次登录后重试' }
    }
  }

  storage.remove('exams')
  storage.remove('tasks')

  return { success: true, migrated: { exams: oldExams.length, tasks: uploadedTasks } }
}

export default migrateLocalData