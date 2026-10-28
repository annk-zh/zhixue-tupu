const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function isValidExamDate(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function validateExamFields(payload) {
  const { name, examDate, note } = payload || {}

  if (name !== undefined) {
    if (typeof name !== 'string') {
      return { valid: false, message: '考试名称必须为字符串' }
    }
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      return { valid: false, message: '考试名称不能为空' }
    }
    if (trimmed.length > 50) {
      return { valid: false, message: '考试名称不能超过 50 个字符' }
    }
  }

  if (examDate !== undefined && !isValidExamDate(examDate)) {
    return { valid: false, message: '考试日期格式不合法' }
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== 'string') {
      return { valid: false, message: '备注必须为字符串' }
    }
    if (note.length > 200) {
      return { valid: false, message: '备注不能超过 200 个字符' }
    }
  }

  return { valid: true, message: '' }
}

export function validateTaskFields(payload) {
  const { content, done, examId } = payload || {}

  if (content !== undefined) {
    if (typeof content !== 'string') {
      return { valid: false, message: '任务内容必须为字符串' }
    }
    const trimmed = content.trim()
    if (trimmed.length === 0) {
      return { valid: false, message: '任务内容不能为空' }
    }
    if (trimmed.length > 100) {
      return { valid: false, message: '任务内容不能超过 100 个字符' }
    }
  }

  if (done !== undefined && typeof done !== 'boolean') {
    return { valid: false, message: '完成状态必须为布尔值' }
  }

  if (examId !== undefined) {
    const num = Number(examId)
    if (!Number.isInteger(num) || num <= 0) {
      return { valid: false, message: '考试 ID 不合法' }
    }
  }

  return { valid: true, message: '' }
}

export function parsePositiveInt(value) {
  const num = Number(value)
  if (!Number.isInteger(num) || num <= 0) return null
  return num
}