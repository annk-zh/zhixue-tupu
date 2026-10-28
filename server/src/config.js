import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const PORT = process.env.PORT || 3000
export const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
export const dataDir = join(__dirname, '..', 'data')
export const dbPath = join(dataDir, 'app.db')

if (!JWT_SECRET || JWT_SECRET.length === 0) {
  throw new Error('JWT_SECRET 未配置，请在 server/.env 中设置非空密钥')
}