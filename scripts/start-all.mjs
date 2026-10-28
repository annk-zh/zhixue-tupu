import { spawn } from 'node:child_process'
import { writeFileSync, existsSync, unlinkSync } from 'node:fs'

const SERVER_DIR = 'C:\\Users\\zh\\智学图谱\\server'
const FRONT_DIR = 'C:\\Users\\zh\\智学图谱'
const PID_FILE = 'C:\\Users\\zh\\智学图谱\\.run-pids.json'

if (existsSync(PID_FILE)) {
  try {
    const old = JSON.parse(new TextDecoder().decode(require('node:fs').readFileSync(PID_FILE)))
    console.log('发现已有运行实例，先清理...')
    for (const pid of old) {
      try { process.kill(pid) } catch {}
    }
    unlinkSync(PID_FILE)
  } catch {}
}

if (existsSync('C:\\Users\\zh\\智学图谱\\server\\data\\app.db')) {
  unlinkSync('C:\\Users\\zh\\智学图谱\\server\\data\\app.db')
}

const pids = []

const backend = spawn('node', ['src/server.js'], {
  cwd: SERVER_DIR,
  stdio: 'ignore',
  detached: true,
  env: { ...process.env, PORT: '3000' }
})
backend.unref()
pids.push(backend.pid)

const frontend = spawn('node', ['node_modules/vite/bin/vite.js'], {
  cwd: FRONT_DIR,
  stdio: 'ignore',
  detached: true,
  env: { ...process.env }
})
frontend.unref()
pids.push(frontend.pid)

writeFileSync(PID_FILE, JSON.stringify(pids))

console.log('服务已启动（后台运行）:')
console.log(`  后端 PID: ${backend.pid} -> http://localhost:3000`)
console.log(`  前端 PID: ${frontend.pid} -> http://localhost:5173`)
console.log(`  PID 文件: ${PID_FILE}`)
console.log('浏览器打开 http://localhost:5173 即可使用')