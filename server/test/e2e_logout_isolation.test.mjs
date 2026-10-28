import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:3000/api'
let serverProcess
let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) { passed++; console.log(`  OK ${message}`) }
  else { failed++; console.error(`  FAIL ${message}`) }
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const init = { method, headers }
  if (body !== undefined && body !== null && method !== 'GET') init.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, init)
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

async function run() {
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: process.cwd(), stdio: 'pipe', env: { ...process.env, PORT: '3000' }
  })
  await sleep(2000)

  try {
    console.log('=== 场景1: 注册→登录→加考试加任务→退出→重新登录→数据还在 ===')

    // 注册
    let res = await req('POST', '/register', { username: 'testuser1', password: '123456' })
    assert(res.status === 201, '注册 testuser1 成功')

    // 登录
    res = await req('POST', '/login', { username: 'testuser1', password: '123456' })
    assert(res.status === 200, '登录成功')
    let token = res.data.data.token
    let username = res.data.data.user.username
    assert(username === 'testuser1', '返回用户名正确')

    // 获取用户信息（模拟前端 /api/me）
    res = await req('GET', '/me', null, token)
    assert(res.status === 200, 'GET /api/me 成功')
    assert(res.data.data.username === 'testuser1', '/api/me 返回用户名正确')

    // 加考试
    res = await req('POST', '/exams', { name: '数学期末', examDate: '2026-12-30', note: '重点复习' }, token)
    assert(res.status === 201, '创建考试成功')
    const examId = res.data.data.id

    // 加任务
    res = await req('POST', '/tasks', { examId, content: '复习第一章' }, token)
    assert(res.status === 201, '创建任务成功')
    res = await req('POST', '/tasks', { examId, content: '复习第二章' }, token)
    assert(res.status === 201, '创建第二个任务成功')

    // 模拟退出登录：前端清 token，后端无操作
    console.log('  -- 模拟退出登录（前端清 token）--')
    token = null

    // 重新登录（用相同账号）
    res = await req('POST', '/login', { username: 'testuser1', password: '123456' })
    assert(res.status === 200, '重新登录成功')
    token = res.data.data.token

    // 验证数据还在
    res = await req('GET', '/exams', null, token)
    assert(res.data.data.length === 1, '考试数据还在（1条）')
    assert(res.data.data[0].name === '数学期末', '考试名称正确')

    res = await req('GET', `/tasks?examId=${examId}`, null, token)
    assert(res.data.data.length === 2, '任务数据还在（2条）')
    assert(res.data.data[0].content === '复习第一章', '任务内容正确')

    console.log('\n=== 场景2: 第二个账号看不到第一个账号的数据 ===')

    // 注册第二个账号
    res = await req('POST', '/register', { username: 'testuser2', password: '123456' })
    assert(res.status === 201, '注册 testuser2 成功')

    res = await req('POST', '/login', { username: 'testuser2', password: '123456' })
    assert(res.status === 200, 'testuser2 登录成功')
    const token2 = res.data.data.token

    // testuser2 看考试列表
    res = await req('GET', '/exams', null, token2)
    assert(res.data.data.length === 0, 'testuser2 考试列表为空（数据隔离）')

    // testuser2 尝试访问 testuser1 的考试
    res = await req('PUT', `/exams/${examId}`, { note: 'hack' }, token2)
    assert(res.status === 404, 'testuser2 越权更新考试返回 404')

    // testuser2 尝试在 testuser1 的考试下加任务
    res = await req('POST', '/tasks', { examId, content: 'hack' }, token2)
    assert(res.status === 404, 'testuser2 越权创建任务返回 404')

    // testuser2 尝试查看 testuser1 的任务
    res = await req('GET', `/tasks?examId=${examId}`, null, token2)
    assert(res.data.data.length === 0, 'testuser2 查看任务返回空数组（数据隔离）')

    // testuser2 创建自己的考试
    res = await req('POST', '/exams', { name: '英语四级', examDate: '2026-06-15' }, token2)
    assert(res.status === 201, 'testuser2 创建自己的考试成功')
    const examId2 = res.data.data.id

    // testuser1 看不到 testuser2 的考试
    res = await req('GET', '/exams', null, token)
    assert(res.data.data.length === 1, 'testuser1 仍只有1条考试（互不影响）')
    assert(res.data.data[0].name === '数学期末', 'testuser1 的考试名称不变')

    console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`)
  } catch (err) {
    console.error('测试异常:', err.message, err.stack)
    failed++
  } finally {
    serverProcess.kill()
    process.exit(failed > 0 ? 1 : 0)
  }
}

run()