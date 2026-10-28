/**
 * ECharts 按需引入
 * - 按需注册 ECharts 核心模块
 * - 使用方式：import { useChart } from '@/utils/echarts'
 *   const chart = useChart(domEl); chart.setOption({...})
 */
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  BarChart,
  LineChart,
  PieChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

/**
 * 在指定 DOM 上初始化一个 ECharts 实例
 * @param {HTMLElement} el 容器节点
 * @returns {import('echarts/core').EChartsType}
 */
export function useChart(el) {
  if (!el || el.nodeType !== 1) {
    return null
  }
  return echarts.init(el)
}

export default echarts