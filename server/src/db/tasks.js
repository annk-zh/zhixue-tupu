function mapTask(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    examId: row.exam_id,
    content: row.content,
    done: row.done === 1,
    createdAt: row.created_at
  }
}

export function createTask(db, { userId, examId, content, done, createdAt }) {
  const result = db.prepare(
    'INSERT INTO tasks (user_id, exam_id, content, done, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, examId, content, done === true ? 1 : 0, createdAt)
  return {
    id: result.lastInsertRowid,
    userId,
    examId,
    content,
    done: done === true,
    createdAt
  }
}

export function listTasksByUserAndExam(db, userId, examId) {
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND exam_id = ? ORDER BY created_at ASC').all(userId, examId)
  return rows.map(mapTask)
}

export function getTaskByIdAndUser(db, id, userId) {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(id, userId)
  return mapTask(row)
}

export function updateTask(db, id, userId, patch) {
  const sets = []
  const params = []
  if (patch.content !== undefined) {
    sets.push('content = ?')
    params.push(patch.content)
  }
  if (patch.done !== undefined) {
    sets.push('done = ?')
    params.push(patch.done ? 1 : 0)
  }
  if (sets.length === 0) return 0
  params.push(id, userId)
  const sql = `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
  const result = db.prepare(sql).run(...params)
  return result.changes
}

export function deleteTask(db, id, userId) {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(id, userId)
  return result.changes
}