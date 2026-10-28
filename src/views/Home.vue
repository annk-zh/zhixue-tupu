<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useExamsStore } from '@/store/modules/exams'
import { daysUntil } from '@/utils/examDate'
import UpcomingExams from '@/components/UpcomingExams.vue'
import RecentExamsBar from '@/components/RecentExamsBar.vue'

const examsStore = useExamsStore()

onMounted(async () => {
  await examsStore.ensureLoaded()
})

/* ===== 对话框与表单状态（新增/编辑共用） ===== */
const dialogVisible = ref(false)
const dialogMode = ref('add') // 'add' | 'edit'
const editingId = ref(null)
const submitting = ref(false)
const formRef = ref(null)
const form = reactive({ name: '', examDate: '', note: '' })

/** 表单校验规则 */
const formRules = {
  name: [
    {
      required: true,
      validator: (rule, value, callback) => {
        if (typeof value !== 'string' || value.trim() === '') {
          callback(new Error('考试名不能为空'))
        } else if (value.trim().length > 50) {
          callback(new Error('考试名不能超过 50 字符'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ],
  examDate: [
    { required: true, message: '请选择考试日期', trigger: ['blur', 'change'] }
  ]
}

/* ===== 对话框控制 ===== */

/** 关闭对话框并重置表单与状态 */
function closeDialog() {
  dialogVisible.value = false
  submitting.value = false
  editingId.value = null
  formRef.value?.resetFields()
  form.name = ''
  form.examDate = ''
  form.note = ''
}

/** 打开新增对话框 */
function openAddDialog() {
  form.name = ''
  form.examDate = ''
  form.note = ''
  dialogMode.value = 'add'
  editingId.value = null
  dialogVisible.value = true
}

/** 打开编辑对话框（单例约束：同一考试已打开则直接返回） */
function openEditDialog(exam) {
  if (dialogVisible.value && editingId.value === exam.id) return
  form.name = exam.name
  form.examDate = exam.examDate
  form.note = exam.note ?? ''
  dialogMode.value = 'edit'
  editingId.value = exam.id
  dialogVisible.value = true
}

/* ===== 提交处理（新增/编辑分流） ===== */

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (dialogMode.value === 'add') {
    submitting.value = true
    const res = await examsStore.addExam({
      name: form.name,
      examDate: form.examDate,
      note: form.note
    })
    if (res.success) {
      ElMessage.success('添加成功')
      closeDialog()
    } else {
      ElMessage.error(res.message)
    }
    submitting.value = false
    return
  }

  // 编辑分流：二次确认
  try {
    await ElMessageBox.confirm('确认提交修改？', '提示', { type: 'warning' })
  } catch {
    return
  }
  submitting.value = true
  const res = await examsStore.updateExam(editingId.value, {
    name: form.name,
    examDate: form.examDate,
    note: form.note
  })
  if (res.success) {
    ElMessage.success('修改成功')
    closeDialog()
  } else if (res.message === '考试不存在') {
    ElMessage.error(res.message)
    closeDialog()
  } else {
    ElMessage.error(res.message)
  }
  submitting.value = false
}

/* ===== 删除处理 ===== */

async function handleDelete(exam) {
  try {
    await ElMessageBox.confirm(`确认删除考试「${exam.name}」？`, '提示', { type: 'warning' })
  } catch {
    return
  }
  const res = await examsStore.deleteExam(exam.id)
  if (res.success) {
    ElMessage.success('删除成功')
  } else if (res.message === '考试不存在') {
    ElMessage.error(res.message)
  } else {
    ElMessage.error(res.message)
  }
}

/* ===== 列表展示 ===== */

/** 按考试日期升序稳定排序（双键：examDate + 原索引） */
const sortedExams = computed(() => {
  return examsStore.exams
    .map((exam, index) => ({ exam, index }))
    .sort((a, b) => {
      if (a.exam.examDate !== b.exam.examDate) {
        return a.exam.examDate < b.exam.examDate ? -1 : 1
      }
      return a.index - b.index
    })
    .map((item) => item.exam)
})

/**
 * 倒计时文案映射（四态）
 * @param {string} examDate YYYY-MM-DD
 * @returns {string}
 */
function formatCountdown(examDate) {
  const n = daysUntil(examDate)
  if (n === null) return '日期异常'
  if (n > 0) return `还剩 ${n} 天`
  if (n === 0) return '今天考试'
  return `已过 ${-n} 天`
}

/** 倒计时标签类型（用于颜色区分） */
function countdownType(examDate) {
  const n = daysUntil(examDate)
  if (n === null) return 'danger'
  if (n > 0) return 'primary'
  if (n === 0) return 'warning'
  return 'info'
}
</script>

<template>
  <div class="page-container">
    <!-- 即将考试区域 -->
    <UpcomingExams />

    <!-- 最近考试完成率柱状图 -->
    <RecentExamsBar />

    <!-- 顶部按钮区 -->
    <div class="action-bar">
      <el-button type="primary" @click="openAddDialog">添加考试</el-button>

    </div>

    <!-- 列表区 -->
    <div class="exam-list">
      <el-empty v-if="sortedExams.length === 0" description="暂无考试" />
      <el-card
        v-for="exam in sortedExams"
        :key="exam.id"
        shadow="hover"
        class="exam-card"
      >
        <div class="exam-card__header">
          <span class="exam-name">{{ exam.name }}</span>
          <el-tag :type="countdownType(exam.examDate)" size="small">
            {{ formatCountdown(exam.examDate) }}
          </el-tag>
        </div>
        <div class="exam-card__body">
          <span class="exam-date">考试日期：{{ exam.examDate }}</span>
          <span v-if="exam.note" class="exam-note">备注：{{ exam.note }}</span>
        </div>
        <div class="exam-card__actions">
          <el-button size="small" @click="$router.push({ name: 'ExamDetail', params: { id: exam.id } })">详情</el-button>
          <el-button size="small" @click="openEditDialog(exam)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(exam)">删除</el-button>
        </div>
      </el-card>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '添加考试' : '编辑考试'"
      width="480px"
      @close="closeDialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="考试名" prop="name">
          <el-input v-model="form.name" placeholder="请输入考试名称" :maxlength="50" />
        </el-form-item>
        <el-form-item label="考试日期" prop="examDate">
          <el-date-picker
            v-model="form.examDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择考试日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="note">
          <el-input v-model="form.note" type="textarea" :rows="3" placeholder="可选" :maxlength="200" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-container {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 20px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.exam-card {
  padding: 4px;
}

.exam-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.exam-name {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
}

.exam-card__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 14px;
  color: #606266;
}

.exam-card__actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-container {
    margin: 16px auto;
    padding: 0 12px;
  }

  .exam-card__actions {
    flex-wrap: wrap;
  }
}
</style>