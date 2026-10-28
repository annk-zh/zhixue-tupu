export function initTasks(db) {
  const table = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
  ).get()

  if (!table) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exam_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (exam_id) REFERENCES exams(id)
      )
    `)
  } else {
    const columns = db.prepare('PRAGMA table_info(tasks)').all()
    const expected = ['id', 'user_id', 'exam_id', 'content', 'done', 'created_at']
    const actual = columns.map((c) => c.name)
    const missing = expected.filter((name) => !actual.includes(name))
    if (missing.length > 0) {
      console.warn(`[initTasks] tasks 表缺少字段: ${missing.join(', ')}`)
    }
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)')
  db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_exam_id ON tasks(exam_id)')
}