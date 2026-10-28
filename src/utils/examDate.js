/**
 * 考试日期工具函数
 * - 纯函数、无副作用、不读写本地存储（spec 4.4.2 / 5.5.6）
 * - 提供日期格式校验与倒计时计算能力，供 store 与视图层复用
 */

/** YYYY-MM-DD 格式正则 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * 校验是否为合法的 YYYY-MM-DD 公历日历日
 * - 先用正则校验格式，再用本地 Date 构造后反查年/月/日与输入一致，
 *   以拒绝 2026-02-30 等进位非法日
 * @param {string} value 待校验值
 * @returns {boolean}
 */
export function isValidExamDate(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/**
 * 计算今天距离考试日期还有多少天（按自然日算，不按时分秒）
 * - 未来为正、今日为 0、已过为负（spec 5.5.1）
 * - 非法日期返回 null，不抛异常（spec 5.5.3）
 * - 取今天与 examDate 的本地自然日午夜，按 86400000ms 用 Math.round 计算日历日差值，
 *   规避夏令时余差
 * @param {string} examDate YYYY-MM-DD
 * @returns {number|null}
 */
export function daysUntil(examDate) {
  if (!isValidExamDate(examDate)) return null
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = examDate.split('-').map(Number)
  const examMidnight = new Date(y, m - 1, d)
  const diffMs = examMidnight.getTime() - todayMidnight.getTime()
  return Math.round(diffMs / 86400000)
}

export default { isValidExamDate, daysUntil }