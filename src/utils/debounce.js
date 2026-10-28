/**
 * 防抖工具函数
 * @param {Function} fn 目标函数
 * @param {number} delay 延迟毫秒
 * @returns {Function} 防抖后的函数
 */
export function debounce(fn, delay = 200) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

export default debounce