import { writeFileSync } from 'node:fs'

const results = []

async function test() {
  try {
    const r1 = await fetch('http://localhost:3000/api/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'runcheck', password: '123456' })
    })
    const d1 = await r1.json()
    results.push(`后端注册: ${r1.status} ${d1.message}`)
  } catch (e) {
    results.push(`后端访问失败: ${e.message}`)
  }

  try {
    const r2 = await fetch('http://localhost:5173')
    const html = await r2.text()
    results.push(`前端首页: ${r2.status} 长度${html.length}`)
  } catch (e) {
    results.push(`前端访问失败: ${e.message}`)
  }

  try {
    const r3 = await fetch('http://localhost:5173/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'runcheck', password: '123456' })
    })
    const d3 = await r3.json()
    results.push(`代理登录: ${r3.status} code=${d3.code}`)
  } catch (e) {
    results.push(`代理访问失败: ${e.message}`)
  }

  writeFileSync('C:\\Users\\zh\\智学图谱\\run-check-result.txt', results.join('\n'))
}

test()