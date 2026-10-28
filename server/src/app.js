import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import authRouter from './routes/auth.js'
import examsRouter from './routes/exams.js'
import tasksRouter from './routes/tasks.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', authRouter)
app.use('/api/exams', examsRouter)
app.use('/api/tasks', tasksRouter)

const distPath = join(__dirname, '..', '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(join(distPath, 'index.html'))
    }
    next()
  })
}

export default app