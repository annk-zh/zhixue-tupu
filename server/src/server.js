import 'dotenv/config'
import app from './app.js'
import { PORT } from './config.js'
import { initDatabase } from './db/index.js'

try {
  const { ready } = initDatabase()
  if (ready) {
    console.log('数据库就绪')
  }

  const server = app.listen(PORT, () => {
    console.log(`服务器已启动，监听 ${PORT} 端口`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`端口 ${PORT} 已被占用，请释放后重试`)
    } else {
      console.error(`服务器错误: ${err.message}`)
    }
    process.exit(1)
  })
} catch (err) {
  console.error(`启动失败: ${err.message}`)
  process.exit(1)
}