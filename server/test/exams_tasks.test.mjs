import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const BASE = 'http://localhost:3000/api'

let serverProcess
let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  OK ${message}`)
  } else {
    failed++
    console.error(`  FAIL ${message}`)
  }
}

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const init = { method, headers }
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    init.body = JSON.stringify(body)
  }
  const res = await fetch(`${BASE}${path}`, init)
  const data = await res.json().catch(() => null)
  return { status: res.status, data }
}

async function run() {
  serverProcess = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    env: { ...process.env, PORT: '3000' }
  })

  await sleep(2000)

  try {
    console.log('--- 注册与登录 ---')
    let res = await request('POST', '/register', { username: 'userA', password: '123456' })
    assert(res.status === 201, '注册用户 A 返回 201')

    res = await request('POST', '/login', { username: 'userA', password: '123456' })
    assert(res.status === 200, '登录用户 A 返回 200')
    const tokenA = res.data.data.token

    res = await request('POST', '/register', { username: 'userB', password: '123456' })
    assert(res.status === 201, '注册用户 B 返回 201')
    res = await request('POST', '/login', { username: 'userB', password: '123456' })
    const tokenB = res.data.data.token

    console.log('--- 认证守卫 ---')
    res = await request('GET', '/exams')
    assert(res.status === 401, '未带 token 访问 /api/exams 返回 401')
    res = await request('GET', '/tasks?examId=1')
    assert(res.status === 401, '未带 token 访问 /api/tasks 返回 401')

    console.log('--- 考试 CRUD ---')
    res = await request('POST', '/exams', { name: '数学期末', examDate: '2026-12-30', note: '重点复习' }, tokenA)
    assert(res.status === 201, '创建考试返回 201')
    assert(res.data.data.name === '数学期末', '返回考试名称正确')
    assert(typeof res.data.data.id === 'number', '返回 id 为 number')
    assert(res.data.data.userId === res.data.data.userId, '返回 userId 字段')
    const examIdA = res.data.data.id

    res = await request('POST', '/exams', { examDate: '2026-12-30' }, tokenA)
    assert(res.status === 400, '缺 name 返回 400')

    res = await request('POST', '/exams', { name: '测试', examDate: '2026-02-30' }, tokenA)
    assert(res.status === 400, '非法日期 2026-02-30 返回 400')

    res = await request('POST', '/exams', { name: 'x'.repeat(51), examDate: '2026-12-30' }, tokenA)
    assert(res.status === 400, '超长 name 返回 400')

    res = await request('GET', '/exams', null, tokenA)
    assert(res.status === 200, '列出考试返回 200')
    assert(Array.isArray(res.data.data), '返回数组')
    assert(res.data.data.length === 1, '用户 A 只有 1 条考试')

    res = await request('PUT', `/exams/${examIdA}`, { note: '更新备注' }, tokenA)
    assert(res.status === 200, '更新考试返回 200')
    assert(res.data.data.note === '更新备注', '备注已更新')

    res = await request('PUT', `/exams/${examIdA}`, { note: 'hack' }, tokenB)
    assert(res.status === 404, '越权更新返回 404')

    res = await request('GET', '/exams', null, tokenB)
    assert(res.data.data.length === 0, '用户 B 考试列表为空')

    console.log('--- 任务 CRUD ---')
    res = await request('POST', '/tasks', { examId: examIdA, content: '复习第一章' }, tokenA)
    assert(res.status === 201, '创建任务返回 201')
    assert(typeof res.data.data.done === 'boolean', 'done 为 boolean')
    assert(res.data.data.done === false, '新建 done 为 false')
    const taskIdA = res.data.data.id

    res = await request('POST', '/tasks', { examId: examIdA, content: '复习第二章' }, tokenA)
    assert(res.status === 201, '创建第二个任务返回 201')

    res = await request('GET', `/tasks?examId=${examIdA}`, null, tokenA)
    assert(res.status === 200, '列出任务返回 200')
    assert(res.data.data.length === 2, '有 2 条任务')

    res = await request('POST', '/tasks', { examId: examIdA, content: 'hack' }, tokenB)
    assert(res.status === 404, '越权创建任务（引用他人 examId）返回 404')

    res = await request('POST', '/tasks', { examId: examIdA, content: '' }, tokenA)
    assert(res.status === 400, '空 content 返回 400')

    res = await request('PUT', `/tasks/${taskIdA}`, { done: true }, tokenA)
    assert(res.status === 200, '更新任务返回 200')
    assert(res.data.data.done === true, 'done 已切换为 true')

    res = await request('PUT', `/tasks/${taskIdA}`, { done: false }, tokenB)
    assert(res.status === 404, '越权更新任务返回 404')

    res = await request('DELETE', `/tasks/${taskIdA}`, null, tokenA)
    assert(res.status === 200, '删除任务返回 200')

    res = await request('GET', `/tasks?examId=${examIdA}`, null, tokenA)
    assert(res.data.data.length === 1, '删除后剩 1 条任务')

    console.log('--- 级联删除 ---')
    res = await request('DELETE', `/exams/${examIdA}`, null, tokenA)
    assert(res.status === 200, '删除考试返回 200')

    res = await request('GET', `/tasks?examId=${examIdA}`, null, tokenA)
    assert(res.data.data.length === 0, '任务已级联删除')

    res = await request('GET', '/exams', null, tokenA)
    assert(res.data.data.length === 0, '考试已删除')

    res = await request('DELETE', '/exams/99999', null, tokenA)
    assert(res.status === 404, '删除不存在考试返回 404')

    console.log('--- 迁移场景：带 done 创建 ---')
    res = await request('POST', '/exams', { name: '迁移测试', examDate: '2026-11-01' }, tokenA)
    const examIdM = res.data.data.id
    res = await request('POST', '/tasks', { examId: examIdM, content: '已完成的任务', done: true }, tokenA)
    assert(res.status === 201, '带 done=true 创建任务返回 201')
    assert(res.data.data.done === true, 'done 保持 true')

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