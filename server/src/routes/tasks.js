import { Router } from 'express'
import { getDB } from '../db/index.js'
import { createTask, listTasksByUserAndExam, getTaskByIdAndUser, updateTask, deleteTask } from '../db/tasks.js'
import { getExamByIdAndUser } from '../db/exams.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { logger } from '../utils/logger.js'
import { validateTaskFields, parsePositiveInt } from '../utils/validators.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req, res) => {
  const examId = parsePositiveInt(req.query.examId)
  if (examId === null) {
    return sendError(res, 400, '考试 ID 不合法')
  }

  try {
    const db = getDB()
    const list = listTasksByUserAndExam(db, req.user.id, examId)
    return sendSuccess(res, list, 200, 'ok')
  } catch (err) {
    logger.error('GET /api/tasks', 'fail', { userId: req.user.id, examId, error: err.message })
    return sendError(res, 500, '查询失败，请稍后重试')
  }
})

router.post('/', (req, res) => {
  const { content, examId: rawExamId, done } = req.body || {}

  if (content === undefined) {
    return sendError(res, 400, '任务内容为必填项')
  }

  const examId = parsePositiveInt(rawExamId)
  if (examId === null) {
    return sendError(res, 400, '考试 ID 不合法')
  }

  const validation = validateTaskFields(req.body)
  if (!validation.valid) {
    return sendError(res, 400, validation.message)
  }

  try {
    const db = getDB()
    const exam = getExamByIdAndUser(db, examId, req.user.id)
    if (!exam) {
      return sendError(res, 404, '考试不存在')
    }
    const createdAt = new Date().toISOString()
    const task = createTask(db, {
      userId: req.user.id,
      examId,
      content,
      done: done === true,
      createdAt
    })
    logger.info('POST /api/tasks', 'success', { userId: req.user.id, taskId: task.id, examId })
    return sendSuccess(res, task, 201, '创建成功')
  } catch (err) {
    logger.error('POST /api/tasks', 'fail', { userId: req.user.id, examId, error: err.message })
    return sendError(res, 500, '保存失败，请稍后重试')
  }
})

router.put('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return sendError(res, 400, 'ID 不合法')
  }

  const patch = req.body || {}
  if (patch.content === undefined && patch.done === undefined) {
    return sendError(res, 400, '没有可更新的字段')
  }

  const validation = validateTaskFields(patch)
  if (!validation.valid) {
    return sendError(res, 400, validation.message)
  }

  try {
    const db = getDB()
    const changes = updateTask(db, id, req.user.id, patch)
    if (changes === 0) {
      return sendError(res, 404, '任务不存在')
    }
    const updated = getTaskByIdAndUser(db, id, req.user.id)
    return sendSuccess(res, updated, 200, '更新成功')
  } catch (err) {
    logger.error('PUT /api/tasks', 'fail', { userId: req.user.id, taskId: id, error: err.message })
    return sendError(res, 500, '更新失败，请稍后重试')
  }
})

router.delete('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return sendError(res, 400, 'ID 不合法')
  }

  try {
    const db = getDB()
    const changes = deleteTask(db, id, req.user.id)
    if (changes === 0) {
      return sendError(res, 404, '任务不存在')
    }
    logger.info('DELETE /api/tasks', 'success', { userId: req.user.id, taskId: id })
    return sendSuccess(res, null, 200, '删除成功')
  } catch (err) {
    logger.error('DELETE /api/tasks', 'fail', { userId: req.user.id, taskId: id, error: err.message })
    return sendError(res, 500, '删除失败，请稍后重试')
  }
})

export default router