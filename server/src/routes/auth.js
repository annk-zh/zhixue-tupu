import { Router } from 'express'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDB } from '../db/index.js'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js'
import { createUser, getUserByUsername, getUserById } from '../db/users.js'
import { authMiddleware } from '../middleware/auth.js'
import { sendSuccess, sendError } from '../utils/response.js'
import { logger } from '../utils/logger.js'

const router = Router()

router.post('/register', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return sendError(res, 400, '用户名和密码不能为空')
  }

  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return sendError(res, 400, '用户名格式不合法')
  }

  if (password.length < 6) {
    return sendError(res, 400, '密码长度不能少于 6 位')
  }

  const db = getDB()
  const existing = getUserByUsername(db, username)
  if (existing) {
    return sendError(res, 409, '用户名已被占用')
  }

  try {
    const passwordHash = bcryptjs.hashSync(password, 10)
    const createdAt = new Date().toISOString()
    const user = createUser(db, { username, passwordHash, createdAt })
    logger.info('/api/register', 'success', { username })
    return sendSuccess(res, { user: { id: user.id, username } }, 201, '注册成功')
  } catch (err) {
    logger.error('/api/register', 'fail', { username, error: err.message })
    return sendError(res, 500, '注册失败，请稍后重试')
  }
})

router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return sendError(res, 400, '用户名和密码不能为空')
  }

  const db = getDB()
  const user = getUserByUsername(db, username)

  if (!user || !bcryptjs.compareSync(password, user.password_hash)) {
    logger.warn('/api/login', 'fail', { username })
    return sendError(res, 401, '用户名或密码错误')
  }

  try {
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    logger.info('/api/login', 'success', { username })
    return sendSuccess(res, { token, user: { id: user.id, username: user.username } }, 200, '登录成功')
  } catch (err) {
    logger.error('/api/login', 'fail', { username, error: err.message })
    return sendError(res, 500, '服务配置异常')
  }
})

router.get('/me', authMiddleware, (req, res) => {
  const db = getDB()
  const user = getUserById(db, req.user.id)

  if (!user) {
    return sendError(res, 401, '用户不存在')
  }

  return sendSuccess(res, { id: user.id, username: user.username, created_at: user.created_at })
})

export default router