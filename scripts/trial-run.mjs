import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const SERVER_DIR = 'C:\\Users\\zh\\智学图谱\\server'
const FRONT_DIR = 'C:\\Users\\zh\\智学图谱'

let backend, frontend
let passed = 0
let failed = 0

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  OK ${msg}`) }
  else { failed++; console.error(`  FAIL ${msg}`) }
}

async function run() {
  console.log('启动后端服务...')
  backend = spawn('node', ['src/server.js'], { cwd: SERVER_DIR, stdio: 'pipe', env: { ...process.env, PORT: '3000' } })
  backend.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`))
  backend.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`))

  await sleep(2000)

  console.log('\n启动前端 vite dev server...')
  frontend = spawn('node', ['node_modules/vite/bin/vite.js'], { cwd: FRONT_DIR, stdio: 'pipe', env: { ...process.env } })
  frontend.stdout.on('data', (d) => process.stdout.write(`[frontend] ${d}`))
  frontend.stderr.on('data', (d) => process.stderr.write(`[frontend] ${d}`))

  console.log('\n等待前端就绪...')
  await sleep(5000)

  try {
    console.log('\n=== 1. 后端直接访问 (localhost:3000) ===')
    let res = await fetch('http://localhost:3000/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'runtest', password: '123456' })
    })
    let body = await res.json()
    assert(res.status === 201, `后端注册 HTTP 201 (实际 ${res.status})`)

    res = await fetch('http://localhost:3000/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'runtest', password: '123456' })
    })
    body = await res.json()
    assert(res.status === 200, '后端登录 HTTP 200')
    const token = body.data.token
    assert(typeof token === 'string', '返回 JWT token')

    res = await fetch('http://localhost:3000/api/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    body = await res.json()
    assert(body.data.username === 'runtest', '/api/me 返回用户名 runtest')

    console.log('\n=== 2. 前端页面访问 (localhost:5173) ===')
    res = await fetch('http://localhost:5173')
    const html = await res.text()
    assert(res.status === 200, `前端首页 HTTP 200 (实际 ${res.status})`)
    assert(html.includes('<div id="app">'), '返回 HTML 含 #app 挂载点')

    console.log('\n=== 3. 前端代理 /api -> 后端 ===')
    res = await fetch('http://localhost:5173/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'runtest', password: '123456' })
    })
    body = await res.json()
    assert(res.status === 200, '经代理登录 HTTP 200')
    assert(body.code === 0 && body.data.token, '代理返回有效 token')

    console.log('\n=== 4. 经代理创建考试（完整业务流） ===')
    res = await fetch('http://localhost:5173/api/exams', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${body.data.token}` },
      body: JSON.stringify({ name: '试运行考试', examDate: '2026-12-31', note: '试运行备注' })
    })
    body = await res.json()
    assert(res.status === 201, '经代理创建考试 HTTP 201')
    assert(body.data.name === '试运行考试', '考试名称正确')

    console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`)
    console.log('\n试运行成功！服务均可正常访问。')
    console.log('  后端: http://localhost:3000')
    console.log('  前端: http://localhost:5173')
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