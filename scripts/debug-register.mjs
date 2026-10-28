import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, unlinkSync } from 'node:fs'

const SERVER_DIR = 'C:\\Users\\zh\\智学图谱\\server'
const dbPath = 'C:\\Users\\zh\\智学图谱\\server\\data\\app.db'
if (existsSync(dbPath)) unlinkSync(dbPath)

let backend
console.log('=== 步骤1: 测试后端注册接口 ===')

backend = spawn('node', ['src/server.js'], { cwd: SERVER_DIR, stdio: 'pipe', env: { ...process.env, PORT: '3000' } })
backend.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
backend.stderr.on('data', (d) => process.stderr.write(`[backend-err] ${d}`))

await sleep(2000)

try {
  const res = await fetch('http://localhost:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test123', password: '123456' })
  })
  const body = await res.json()
  console.log(`\n  HTTP 状态码: ${res.status}`)
  console.log(`  响应体: ${JSON.stringify(body)}`)
  if (res.status === 201 && body.code === 0) {
    console.log('  结论: 后端注册接口正常 ✓')
  } else {
    console.log('  结论: 后端注册接口异常 ✗')
  }
} catch (err) {
  console.log(`\n  请求失败: ${err.message}`)
  console.log('  结论: 后端注册接口不可达 ✗')
}

backend.kill()
process.exit(0)