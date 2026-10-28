export function sendSuccess(res, data, status = 200, message = 'ok') {
  return res.status(status).json({ code: 0, message, data })
}

export function sendError(res, status, message) {
  return res.status(status).json({ code: status, message })
}