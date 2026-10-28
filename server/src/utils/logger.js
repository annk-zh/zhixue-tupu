function format(level, path, result, extra = {}) {
  const ts = new Date().toISOString()
  const safe = {}
  for (const [k, v] of Object.entries(extra)) {
    if (['password', 'token', 'JWT_SECRET'].includes(k)) {
      safe[k] = v ? `***${String(v).slice(-4)}` : '***'
    } else {
      safe[k] = v
    }
  }
  return JSON.stringify({ ts, level, path, result, ...safe })
}

export const logger = {
  info(path, result, extra) {
    console.log(format('INFO', path, result, extra))
  },
  warn(path, result, extra) {
    console.warn(format('WARN', path, result, extra))
  },
  error(path, result, extra) {
    console.error(format('ERROR', path, result, extra))
  }
}