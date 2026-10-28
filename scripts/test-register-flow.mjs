import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, unlinkSync } from 'node:fs'

const SERVER_DIR = 'C:\\Users\\zh\\智学图谱\\server'
const FRONT_DIR = 'C:\\Users\\zh\\智学图谱'
const dbPath = `${SERVER_DIR}\\data\\app.db`
if (existsSync(dbPath)) unlinkSync(dbPath)

let backend, frontend
let passed = 0
let failed = 0

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`) }
  else { failed++; console.error(`  ✗ ${msg}`) }
}

async function run() {
  console.log('启动后端...')
  backend = spawn('node', ['src/server.js'], { cwd: SERVER_DIR, stdio: 'pipe', env: { ...process.env, PORT: '3000' } })
  backend.stderr.on('data', (d) => process.stderr.write(`[be-err] ${d}`))
  await sleep(2000)

  console.log('启动前端...')
  frontend = spawn('node', ['node_modules/vite/bin/vite.js'], { cwd: FRONT_DIR, stdio: 'pipe', env: { ...process.env } })
  frontend.stderr.on('data', (d) => process.stderr.write(`[fe-err] ${d}`))
  await sleep(5000)

  try {
    console.log('\n=== 测试1: 正常注册（test123 / 123456）===')
    let res = await fetch('http://localhost:5173/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test123', password: '123456' })
    })
    let body = await res.json()
    assert(res.status === 201, `HTTP 201 (实际 ${res.status})`)
    assert(body.code === 0, `code=0`)
    assert(body.data.user.username === 'test123', '返回用户名 test123')
    console.log(`  响应: ${JSON.stringify(body)}`)

    console.log('\n=== 测试2: 重复注册（应返回 409）===')
    res = await fetch('http://localhost:5173/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test123', password: '123456' })
    })
    body = await res.json()
    assert(res.status === 409, `HTTP 409 (实际 ${res.status})`)
    assert(body.message === '用户名已被占用', `提示"用户名已被占用"`)

    console.log('\n=== 测试3: 中文用户名（应返回 400）===')
    res = await fetch('http://localhost:5173/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '测试用户', password: '123456' })
    })
    body = await res.json()
    assert(res.status === 400, `HTTP 400 (实际 ${res.status})`)
    assert(body.message === '用户名格式不合法', `提示"用户名格式不合法"`)

    console.log('\n=== 测试4: 短密码（应返回 400）===')
    res = await fetch('http://localhost:5173/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'user456', password: '123' })
    })
    body = await res.json()
    assert(res.status === 400, `HTTP 400 (实际 ${res.status})`)
    assert(body.message === '密码长度不能少于 6 位', `提示"密码长度不能少于6位"`)

    console.log('\n=== 测试5: 注册后登录验证 ===')
    res = await fetch('http://localhost:5173/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'test123', password: '123456' })
    })
    body = await res.json()
    assert(res.status === 200, '登录 HTTP 200')
    assert(typeof body.data.token === 'string', '返回 token')

    console.log(`\n========================================`)
    console.log(`  结果: ${passed} 通过, ${failed} 失败`)
    console.log(`  注册功能${failed === 0 ? '完全正常 ✓' : '有问题 ✗'}`)
    console.log(`========================================`)
  } catch (err) {
    console.error('\n测试异常:', err.message)
    failed++
  } finally {
    backend?.kill()
    frontend?.kill()
    process.exit(failed > 0 ? 1 : 0)
  }
}

run()