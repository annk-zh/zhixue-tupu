export function initUsers(db) {
  const table = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
  ).get()

  if (!table) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `)
  } else {
    const columns = db.prepare('PRAGMA table_info(users)').all()
    const expected = ['id', 'username', 'password_hash', 'created_at']
    const actual = columns.map((c) => c.name)
    const missing = expected.filter((name) => !actual.includes(name))
    if (missing.length > 0) {
      console.warn(`[initUsers] users 表缺少字段: ${missing.join(', ')}`)
    }

    const indexes = db.prepare('PRAGMA index_list(users)').all()
    const hasUnique = indexes.some(
      (idx) => idx.origin === 'u' || idx.unique === 1
    )
    if (!hasUnique) {
      const duplicates = db.prepare(
        'SELECT username, COUNT(*) as c FROM users GROUP BY username HAVING c > 1'
      ).all()
      if (duplicates.length > 0) {
        throw new Error(
          `users 表存在重复 username，无法创建唯一索引: ${duplicates.map((d) => d.username).join(', ')}`
        )
      }
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    }
  }
}