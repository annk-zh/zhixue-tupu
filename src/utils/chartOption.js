/**
 * ECharts option 构造纯函数
 * - 与 ECharts 实例解耦，仅返回 option 对象
 * - 配色统一主题蓝紫渐变 #667eea → #764ba2
 */

const PRIMARY_GRADIENT = {
  type: 'linear',
  x: 0, y: 0, x2: 1, y2: 1,
  colorStops: [
    { offset: 0, color: '#667eea' },
    { offset: 1, color: '#764ba2' }
  ]
}

export function buildRingOption(percentage) {
  const pct = Math.max(0, Math.min(100, percentage))
  return {
    title: {
      text: pct + '%',
      left: 'center',
      top: 'center',
      textStyle: { fontSize: 20, fontWeight: 'bold', color: '#303133' }
    },
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['62%', '80%'],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: pct, itemStyle: { color: PRIMARY_GRADIENT } },
          { value: 100 - pct, itemStyle: { color: '#e4e7ed' } }
        ]
      }
    ]
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]))
}

export function buildBarOption(examNames, percentages) {
  const names = Array.isArray(examNames) ? examNames.map((n) => (typeof n === 'string' ? n : '')) : []
  const pcts = Array.isArray(percentages) ? percentages.map((p) => (Number.isFinite(p) ? p : 0)) : []
  const needRotate = names.some((n) => n.length > 4)
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `${escapeHtml(p.name)}: ${p.value}%`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: {
        rotate: needRotate ? 30 : 0,
        formatter: (val) => {
          const s = typeof val === 'string' ? val : ''
          return s.length > 6 ? s.slice(0, 6) + '…' : s
        }
      }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        type: 'bar',
        data: pcts,
        itemStyle: { color: PRIMARY_GRADIENT, borderRadius: [6, 6, 0, 0] }
      }
    ]
  }
}