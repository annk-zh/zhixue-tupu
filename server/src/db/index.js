import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { dataDir, dbPath } from '../config.js'
import { initUsers } from './initUsers.js'
import { initExams } from './initExams.js'
import { initTasks } from './initTasks.js'

let dbInstance = null

export function initDatabase() {
  try {
    mkdirSync(dataDir, { recursive: true })
  } catch (err) {
    throw new Error(`数据库目录创建失败: ${err.message}`)
  }

  let db
  try {
    db = new DatabaseSync(dbPath)
  } catch (err) {
    throw new Error(`数据库打开失败: ${err.message}`)
  }

  initUsers(db)
  initExams(db)
  initTasks(db)
  dbInstance = db
  return { db, ready: true }
}

export function getDB() {
  if (!dbInstance) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return dbInstance
}