import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config.js'
import { sendError } from '../utils/response.js'

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return sendError(res, 401, '未提供认证令牌')
  }

  if (!authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, '认证令牌格式错误')
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = { id: payload.id, username: payload.username }
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return sendError(res, 401, '认证令牌无效或已过期')
    }
    return sendError(res, 500, '服务配置异常')
  }
}