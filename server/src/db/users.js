export function createUser(db, { username, passwordHash, createdAt }) {
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
  ).run(username, passwordHash, createdAt)
  return { id: result.lastInsertRowid, username, passwordHash, createdAt }
}

export function getUserByUsername(db, username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null
}

export function getUserById(db, id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null
}