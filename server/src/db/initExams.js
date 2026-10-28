export function initExams(db) {
  const table = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='exams'"
  ).get()

  if (!table) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS exams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        exam_date TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `)
  } else {
    const columns = db.prepare('PRAGMA table_info(exams)').all()
    const expected = ['id', 'user_id', 'name', 'exam_date', 'note', 'created_at']
    const actual = columns.map((c) => c.name)
    const missing = expected.filter((name) => !actual.includes(name))
    if (missing.length > 0) {
      console.warn(`[initExams] exams 表缺少字段: ${missing.join(', ')}`)
    }
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_exams_user_id ON exams(user_id)')
}