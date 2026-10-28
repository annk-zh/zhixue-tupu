function mapExam(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    examDate: row.exam_date,
    note: row.note,
    createdAt: row.created_at
  }
}

export function createExam(db, { userId, name, examDate, note, createdAt }) {
  const result = db.prepare(
    'INSERT INTO exams (user_id, name, exam_date, note, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, name, examDate, note, createdAt)
  return {
    id: result.lastInsertRowid,
    userId,
    name,
    examDate,
    note,
    createdAt
  }
}

export function listExamsByUser(db, userId) {
  const rows = db.prepare('SELECT * FROM exams WHERE user_id = ? ORDER BY created_at ASC').all(userId)
  return rows.map(mapExam)
}

export function getExamByIdAndUser(db, id, userId) {
  const row = db.prepare('SELECT * FROM exams WHERE id = ? AND user_id = ?').get(id, userId)
  return mapExam(row)
}

export function updateExam(db, id, userId, patch) {
  const sets = []
  const params = []
  if (patch.name !== undefined) {
    sets.push('name = ?')
    params.push(patch.name)
  }
  if (patch.examDate !== undefined) {
    sets.push('exam_date = ?')
    params.push(patch.examDate)
  }
  if (patch.note !== undefined) {
    sets.push('note = ?')
    params.push(patch.note)
  }
  if (sets.length === 0) return 0
  params.push(id, userId)
  const sql = `UPDATE exams SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`
  const result = db.prepare(sql).run(...params)
  return result.changes
}

export function deleteExamCascade(db, id, userId) {
  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM tasks WHERE exam_id = ? AND user_id = ?').run(id, userId)
    const result = db.prepare('DELETE FROM exams WHERE id = ? AND user_id = ?').run(id, userId)
    if (result.changes === 1) {
      db.exec('COMMIT')
      return { success: true, changes: 1 }
    }
    db.exec('ROLLBACK')
    return { success: false, changes: 0 }
  } catch (err) {
    db.exec('ROLLBACK')
    return { success: false, changes: 0 }
  }
}