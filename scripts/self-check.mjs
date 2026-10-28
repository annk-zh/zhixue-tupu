#!/usr/bin/env node

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DEMO_URL = process.env.DEMO_URL
const REPO_URL = process.env.REPO_URL

const results = {
  demoAccessible: false,
  repoCloneable: false,
  docsReadable: false,
  buildReproducible: false,
  runAt: new Date().toISOString()
}

if (DEMO_URL) {
  try {
    const res = await fetch(DEMO_URL)
    results.demoAccessible = res.ok
  } catch {
    results.demoAccessible = false
  }
} else {
  console.warn('未设置 DEMO_URL 环境变量，跳过演示地址检查')
}

if (REPO_URL) {
  try {
    execSync(`git ls-remote ${REPO_URL}`, { stdio: 'pipe' })
    results.repoCloneable = true
  } catch {
    results.repoCloneable = false
  }
} else {
  console.warn('未设置 REPO_URL 环境变量，跳过仓库克隆检查')
}

try {
  const readme = readFileSync(join(process.cwd(), 'README.md'), 'utf-8')
  const contest = readFileSync(join(process.cwd(), 'CONTEST.md'), 'utf-8')
  const readmeSections = ['项目简介', '功能清单', '技术栈', '本地启动', '构建命令', '演示地址']
  const contestSections = ['创新点', '华为云结合点', '演示操作指引', '已知限制']
  results.docsReadable =
    readmeSections.every((s) => readme.includes(s)) &&
    contestSections.every((s) => contest.includes(s))
} catch {
  results.docsReadable = false
}

try {
  execSync('npm run build', { stdio: 'pipe', cwd: process.cwd() })
  results.buildReproducible = existsSync(join(process.cwd(), 'dist', 'index.html'))
} catch {
  results.buildReproducible = false
}

writeFileSync(join(process.cwd(), 'self-check-report.json'), JSON.stringify(results, null, 2))

console.log('\n自检结果：')
console.log(`  演示地址可访问: ${results.demoAccessible ? '通过' : '未通过'}`)
console.log(`  仓库可克隆:     ${results.repoCloneable ? '通过' : '未通过'}`)
console.log(`  文档可阅读:     ${results.docsReadable ? '通过' : '未通过'}`)
console.log(`  构建可复现:     ${results.buildReproducible ? '通过' : '未通过'}`)
console.log(`  报告已写入:     self-check-report.json\n`)

const allPass =
  results.demoAccessible &&
  results.repoCloneable &&
  results.docsReadable &&
  results.buildReproducible

process.exit(allPass ? 0 : 1)