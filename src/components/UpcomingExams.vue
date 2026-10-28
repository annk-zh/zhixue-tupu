<script setup>
import { computed } from 'vue'
import { useExamsStore } from '@/store/modules/exams'
import { useTasksStore } from '@/store/modules/tasks'
import { daysUntil } from '@/utils/examDate'
import { calcPercentage } from '@/utils/progress'

const examsStore = useExamsStore()
const tasksStore = useTasksStore()

/**
 * 紧迫高亮判定（倒计时 ≤ 7 天，含今天 0 天）
 * @param {number} countdownDays
 * @returns {boolean}
 */
function isUrgent(countdownDays) {
  return typeof countdownDays === 'number' && countdownDays <= 7
}

/**
 * 即将考试选取算法
 * - 筛选倒计时 ≥ 0（含今天、排除已过与非法日期）
 * - 按倒计时升序、同值按入库顺序稳定排序
 * - 取前 3 条
 * - 映射为卡片视图模型
 */
const upcomingExams = computed(() => {
  const list = examsStore.exams
  if (!Array.isArray(list)) return []

  return list
    .map((exam, originalIndex) => {
      const countdownDays = daysUntil(exam.examDate)
      return { exam, countdownDays, originalIndex }
    })
    .filter((item) => item.countdownDays !== null && item.countdownDays >= 0)
    .sort((a, b) => {
      if (a.countdownDays !== b.countdownDays) {
        return a.countdownDays - b.countdownDays
      }
      return a.originalIndex - b.originalIndex
    })
    .slice(0, 3)
    .map((item, displayOrder) => {
      const p = tasksStore.getTaskProgress(item.exam.id)
      return {
        examId: item.exam.id,
        name: item.exam.name,
        countdownDays: item.countdownDays,
        isUrgent: isUrgent(item.countdownDays),
        progress: calcPercentage(p.done, p.total),
        displayOrder
      }
    })
})
</script>

<template>
  <section class="upcoming-section">
    <h2 class="upcoming-section__title">即将考试</h2>
    <el-empty v-if="upcomingExams.length === 0" description="暂无即将到来的考试" />
    <div v-else class="upcoming-cards">
      <div
        v-for="card in upcomingExams"
        :key="card.examId"
        class="upcoming-card"
        :class="{ 'upcoming-card--urgent': card.isUrgent }"
      >
        <div class="upcoming-card__name">{{ card.name }}</div>
        <div class="upcoming-card__countdown">
          <span v-if="card.countdownDays === 0" class="upcoming-card__countdown-today">今天</span>
          <template v-else>
            <span class="upcoming-card__countdown-num">{{ card.countdownDays }}</span>
            <span class="upcoming-card__countdown-unit">天</span>
          </template>
        </div>

        <div class="upcoming-card__progress">
          <el-progress :percentage="card.progress" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.upcoming-section {
  margin-bottom: 28px;
}

.upcoming-section__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.upcoming-cards {
  display: flex;
  gap: 16px;
}

.upcoming-card {
  flex: 1;
  min-width: 0;
  padding: 24px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.upcoming-card:hover {
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.upcoming-card--urgent {
  border: 2px solid;
  border-image: var(--urgent-gradient) 1;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.04) 0%, rgba(238, 90, 36, 0.04) 100%);
}

.upcoming-card__name {
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.upcoming-card__countdown {
  margin-bottom: 18px;
  line-height: 1;
}

.upcoming-card__countdown-num {
  font-size: 40px;
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.upcoming-card--urgent .upcoming-card__countdown-num {
  background: var(--urgent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.upcoming-card__countdown-unit {
  margin-left: 4px;
  font-size: 16px;
  color: #606266;
}

.upcoming-card__countdown-today {
  font-size: 36px;
  font-weight: 800;
  color: var(--urgent-color);
}

.upcoming-card__progress {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .upcoming-cards {
    flex-direction: column;
  }
}
</style>