<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useExamsStore } from '@/store/modules/exams'
import { useTasksStore } from '@/store/modules/tasks'
import { useChart } from '@/utils/echarts'
import { buildBarOption } from '@/utils/chartOption'
import { calcPercentage } from '@/utils/progress'
import { debounce } from '@/utils/debounce'

const examsStore = useExamsStore()
const tasksStore = useTasksStore()

const recentExams = computed(() => {
  const list = examsStore.exams
  if (!Array.isArray(list)) return []
  return list
    .map((exam, originalIndex) => ({ exam, originalIndex }))
    .sort((a, b) => {
      if (a.exam.examDate !== b.exam.examDate) {
        return a.exam.examDate > b.exam.examDate ? -1 : 1
      }
      return b.originalIndex - a.originalIndex
    })
    .slice(0, 5)
    .map((item) => item.exam)
})

const chartData = computed(() => {
  const names = []
  const pcts = []
  for (const exam of recentExams.value) {
    const p = tasksStore.getTaskProgress(exam.id)
    names.push(exam.name)
    pcts.push(calcPercentage(p.done, p.total))
  }
  return { names, pcts }
})

const chartRef = ref(null)
let chart = null
let resizeObserver = null
const debouncedResize = debounce(() => chart?.resize(), 200)

function initChart(retries = 0) {
  if (!chartRef.value) return
  if (chartRef.value.offsetWidth === 0 || chartRef.value.offsetHeight === 0) {
    if (retries < 3) requestAnimationFrame(() => initChart(retries + 1))
    return
  }
  chart = useChart(chartRef.value)
  chart.setOption(buildBarOption(chartData.value.names, chartData.value.pcts))
  resizeObserver = new ResizeObserver(debouncedResize)
  resizeObserver.observe(chartRef.value)
}

function destroyChart() {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
}

onMounted(() => {
  if (recentExams.value.length > 0) initChart()
})

watch(
  chartData,
  (val) => {
    if (val.names.length === 0) { destroyChart(); return }
    if (!chart) { initChart(); return }
    chart.setOption(buildBarOption(val.names, val.pcts))
  },
  { flush: 'post' }
)

onUnmounted(() => destroyChart())
</script>

<template>
  <section class="recent-bar-section">
    <h2 class="recent-bar-section__title">最近考试完成率</h2>
    <el-empty v-if="recentExams.length === 0" description="暂无数据" />
    <div v-else ref="chartRef" class="recent-bar-chart"></div>
  </section>
</template>

<style scoped>
.recent-bar-section { margin-bottom: 28px; }
.recent-bar-section__title { margin: 0 0 16px; font-size: 18px; font-weight: 700; color: #303133; }
.recent-bar-chart { width: 100%; height: 280px; }
</style>