<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useExamsStore } from '@/store/modules/exams'
import { useTasksStore } from '@/store/modules/tasks'
import { daysUntil } from '@/utils/examDate'
import { calcPercentage } from '@/utils/progress'
import ExamProgressRing from '@/components/ExamProgressRing.vue'

const route = useRoute()
const router = useRouter()
const examsStore = useExamsStore()
const tasksStore = useTasksStore()

onMounted(async () => {
  await examsStore.ensureLoaded()
  await tasksStore.reloadByExamId(route.params.id)
})

/* ===== 考试概览 ===== */
const examId = computed(() => route.params.id)
const exam = computed(() => (examId.value ? examsStore.getExamById(examId.value) : null))
const countdown = computed(() => (exam.value ? daysUntil(exam.value.examDate) : null))

/* ===== 任务列表 ===== */
const taskList = computed(() => tasksStore.getTasksByExamId(examId.value))
const progress = computed(() => tasksStore.getTaskProgress(examId.value))
const ringPercentage = computed(() => calcPercentage(progress.value.done, progress.value.total))

/* ===== 新增任务 ===== */
const newTaskContent = ref('')

function handleAddTask() {
  const content = newTaskContent.value.trim()
  if (!content) {
    ElMessage.warning('任务内容不能为空')
    return
  }
  addTaskAsync(content)
}

async function addTaskAsync(content) {
  const res = await tasksStore.addTask({ examId: examId.value, content })
  if (res.success) {
    newTaskContent.value = ''
  } else {
    ElMessage.error(res.message)
  }
}

/* ===== 完成态切换 ===== */
function handleToggleTask(task) {
  toggleTaskAsync(task)
}

async function toggleTaskAsync(task) {
  const res = await tasksStore.toggleTask(task.id)
  if (!res.success) {
    ElMessage.error(res.message)
  }
}

/* ===== 编辑态（单例约束） ===== */

const editingId = ref(null)
const editContent = ref('')

function startEdit(task) {
  editingId.value = task.id
  editContent.value = task.content
}

function cancelEdit() {
  editingId.value = null
  editContent.value = ''
}

function saveEdit() {
  const content = editContent.value.trim()
  if (!content) {
    ElMessage.warning('任务内容不能为空')
    return
  }
  saveEditAsync(content)
}

async function saveEditAsync(content) {
  const res = await tasksStore.updateTask(editingId.value, { content })
  if (res.success) {
    cancelEdit()
  } else {
    ElMessage.error(res.message)
  }
}

/* ===== 删除任务 ===== */
async function handleDeleteTask(task) {
  try {
    await ElMessageBox.confirm('确认删除该任务？', '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await tasksStore.deleteTask(task.id)
  if (!res.success) {
    ElMessage.error(res.message)
  }
}
</script>

<template>
  <div class="page-placeholder">
    <!-- 考试不存在 -->
    <el-card v-if="!exam" shadow="never">
      <p class="not-found">考试不存在</p>
      <el-button @click="router.push({ name: 'Home' })">返回首页</el-button>
    </el-card>

    <template v-else>
      <!-- 概览区 -->
      <el-card shadow="never" class="overview-card">
        <ExamProgressRing :percentage="ringPercentage" />
        <div class="overview__name">{{ exam.name }}</div>
        <div class="overview__meta">
          <span>考试日期：{{ exam.examDate }}</span>
          <span v-if="countdown !== null" class="overview__countdown">
            倒计时：
            <strong v-if="countdown > 0">{{ countdown }} 天</strong>
            <strong v-else-if="countdown === 0">今天考试</strong>
            <strong v-else>已过 {{ -countdown }} 天</strong>
          </span>
        </div>
        <div v-if="exam.note" class="overview__note">备注：{{ exam.note }}</div>
      </el-card>

      <!-- 任务区 -->
      <el-card shadow="never" class="task-card">
        <template #header>
          <div class="task-header">
            <span>复习任务</span>
            <span class="task-progress">已完成 {{ progress.done }} / 共 {{ progress.total }}</span>
          </div>
        </template>

        <!-- 添加任务 -->
        <div class="task-add">
          <el-input
            v-model="newTaskContent"
            placeholder="输入任务内容，回车添加"
            :maxlength="100"
            @keyup.enter="handleAddTask"
          />
          <el-button type="primary" @click="handleAddTask">添加任务</el-button>
        </div>

        <!-- 任务列表 -->
        <div class="task-list">
          <el-empty v-if="taskList.length === 0" description="暂无复习任务" />
          <div v-for="task in taskList" :key="task.id" class="task-item">
            <el-checkbox
              :model-value="task.done"
              @change="handleToggleTask(task)"
            />
            <div class="task-item__content">
              <span v-if="editingId !== task.id" :class="{ 'task-item__done': task.done }">
                {{ task.content }}
              </span>
              <el-input
                v-else
                v-model="editContent"
                size="small"
                :maxlength="100"
                @keyup.enter="saveEdit"
              />
            </div>
            <div class="task-item__actions">
              <template v-if="editingId === task.id">
                <el-button size="small" type="primary" @click="saveEdit">保存</el-button>
                <el-button size="small" @click="cancelEdit">取消</el-button>
              </template>
              <template v-else>
                <el-button size="small" @click="startEdit(task)">编辑</el-button>
                <el-button size="small" type="danger" @click="handleDeleteTask(task)">删除</el-button>
              </template>
            </div>
          </div>
        </div>
      </el-card>

      <el-button @click="router.push({ name: 'Home' })">返回首页</el-button>
    </template>
  </div>
</template>

<style scoped>
.page-placeholder {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 20px;
}

.not-found {
  font-size: 16px;
  margin-bottom: 16px;
}

.overview-card {
  margin-bottom: 16px;
  text-align: center;
  padding: 8px;
}

.overview__name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #303133;
}

.overview__meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 14px;
  color: #606266;
}

.overview__countdown strong {
  font-size: 18px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.overview__note {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}

.task-card {
  margin-bottom: 16px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.task-progress {
  font-size: 14px;
  color: #606266;
  font-weight: 400;
}

.task-add {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f5;
}

.task-item:last-child {
  border-bottom: none;
}

.task-item__content {
  flex: 1;
  min-width: 0;
  font-size: 14px;
}

.task-item__done {
  text-decoration: line-through;
  color: #c0c4cc;
}

.task-item__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-placeholder {
    margin: 16px auto;
    padding: 0 12px;
  }

  .overview__meta {
    flex-direction: column;
    gap: 8px;
  }

  .task-add {
    flex-direction: column;
  }

  .task-item {
    flex-wrap: wrap;
  }
}
</style>