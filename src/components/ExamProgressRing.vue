<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useChart } from '@/utils/echarts'
import { buildRingOption } from '@/utils/chartOption'
import { debounce } from '@/utils/debounce'

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
    validator: (v) => Number.isInteger(v) && v >= 0 && v <= 100
  }
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
  chart.setOption(buildRingOption(props.percentage))
  resizeObserver = new ResizeObserver(debouncedResize)
  resizeObserver.observe(chartRef.value)
}

onMounted(() => initChart())

watch(
  () => props.percentage,
  (val) => { chart?.setOption(buildRingOption(val)) }
)

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="chartRef" class="exam-progress-ring"></div>
</template>

<style scoped>
.exam-progress-ring { width: 160px; height: 160px; margin: 0 auto 12px; }
</style>