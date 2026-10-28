/**
 * 完成率计算纯函数
 * - 防御除零与非有限数入参，返回 0–100 整数
 * @param {number} done 已完成数
 * @param {number} total 总数
 * @returns {number} 0–100 整数
 */
export function calcPercentage(done, total) {
  if (!Number.isFinite(done) || !Number.isFinite(total)) return 0
  if (total <= 0) return 0
  const pct = Math.round((done / total) * 100)
  return Math.max(0, Math.min(100, pct))
}

export default calcPercentage