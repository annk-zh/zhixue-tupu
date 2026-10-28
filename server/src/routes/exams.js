import { Router } from 'express'
import { getDB } from '../db/index.js'
import { createExam, listExamsByUser, getExamByIdAndUser, updateExam, deleteExamCascade } from '../db/exams.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { logger } from '../utils/logger.js'
import { validateExamFields, parsePositiveInt } from '../utils/validators.js'

const router = Router()

router.use(authMiddleware)

router.get('/', (req, res) => {
  try {
    const db = getDB()
    const list = listExamsByUser(db, req.user.id)
    return sendSuccess(res, list, 200, 'ok')
  } catch (err) {
    logger.error('GET /api/exams', 'fail', { userId: req.user.id, error: err.message })
    return sendError(res, 500, '查询失败，请稍后重试')
  }
})

router.post('/', (req, res) => {
  const { name, examDate, note } = req.body || {}

  if (name === undefined || examDate === undefined) {
    return sendError(res, 400, '考试名称和日期为必填项')
  }

  const validation = validateExamFields(req.body)
  if (!validation.valid) {
    return sendError(res, 400, validation.message)
  }

  try {
    const db = getDB()
    const createdAt = new Date().toISOString()
    const exam = createExam(db, {
      userId: req.user.id,
      name,
      examDate,
      note: note ?? '',
      createdAt
    })
    logger.info('POST /api/exams', 'success', { userId: req.user.id, examId: exam.id })
    return sendSuccess(res, exam, 201, '创建成功')
  } catch (err) {
    logger.error('POST /api/exams', 'fail', { userId: req.user.id, error: err.message })
    return sendError(res, 500, '保存失败，请稍后重试')
  }
})

router.put('/:id', (req, res) => {
  const id = parsePositiveInt(req.params.id)
  if (id === null) {
    return sendError(res, 400, 'ID 不合法')
  }

  const patch = req.body || {}
  if (patch.name === undefined && patch.examDate === undefined && patch.note === undefined) {
    return sendError(res, 400, '没有可更新的字段')
  }

  const validation = validateExamFields(patch)
  if (!validation.valid) {
    return sendError(res, 400, validation.message)
  }

  try {
    const db = getDB()
    const changes = updateExam(db, id, req.user.id, patch)
    if (changes === 0) {
      return sendError(res, 404, '考试不存在')
    }
    const updated = getExamByIdAndUser(db, id, req.user.id)
    return sendSuccess(res, updated, 200, '更新成功')
  } catch (err) {
    logger.error('PUT /api/exams', 'fail', { userId: req.user.id, examId: id, error: err.message })
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
    const result = deleteExamCascade(db, id, req.user.id)
    if (!result.success) {
      return sendError(res, 404, '考试不存在')
    }
    logger.info('DELETE /api/exams', 'success', { userId: req.user.id, examId: id })
    return sendSuccess(res, null, 200, '删除成功')
  } catch (err) {
    logger.error('DELETE /api/exams', 'fail', { userId: req.user.id, examId: id, error: err.message })
    return sendError(res, 500, '删除失败，请稍后重试')
  }
})

export default router