<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useExamsStore } from '@/store/modules/exams'
import { useTasksStore } from '@/store/modules/tasks'
import { exportSnapshot, validateSnapshot, restoreSnapshot } from '@/utils/dataPort'
import { seedSnapshot } from '@/utils/seedData'
import { useAuthStore } from '@/store/modules/auth'
import { isLoggedIn, clearToken } from '@/utils/auth'

const examsStore = useExamsStore()
const tasksStore = useTasksStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const fileInputRef = ref(null)

const showNavbar = computed(() => isLoggedIn() && !route.meta.public)

onMounted(async () => {
  if (isLoggedIn()) {
    await authStore.fetchMe()
  }
})

function handleLogout() {
  clearToken()
  authStore.clearAuth()
  router.replace('/login')
}

async function handleLoadSeed() {
  const validation = validateSnapshot(seedSnapshot)
  if (!validation.valid) {
    ElMessage.error(validation.reason || '示例数据不合法')
    return
  }
  const isEmpty = examsStore.exams.length === 0 && tasksStore.tasks.length === 0
  if (!isEmpty) {
    try {
      await ElMessageBox.confirm('载入将覆盖当前数据，是否继续？', '提示', { type: 'warning' })
    } catch {
      return
    }
  }
  const result = await restoreSnapshot(seedSnapshot)
  if (result.success) {
    ElMessage.success('示例数据已载入')
  } else {
    ElMessage.error('载入失败，请重试')
  }
}

async function handleClearData() {
  try {
    await ElMessageBox.confirm('确认清空全部数据？', '提示', { type: 'warning' })
  } catch {
    return
  }
  for (const exam of [...examsStore.exams]) {
    await examsStore.deleteExam(exam.id)
  }
  ElMessage.success('数据已清空')
}

function handleExport() {
  const result = exportSnapshot()
  if (result.success) {
    ElMessage.success('导出成功')
  } else {
    ElMessage.error('导出失败，请检查浏览器存储设置')
  }
}

function handleImportClick() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    let raw
    try {
      raw = JSON.parse(text)
    } catch {
      ElMessage.error('文件格式不合法，导入取消')
      return
    }

    const validation = validateSnapshot(raw)
    if (!validation.valid) {
      ElMessage.error(validation.reason || '文件格式不合法，导入取消')
      return
    }

    try {
      await ElMessageBox.confirm('确认覆盖当前数据？', '提示', { type: 'warning' })
    } catch {
      return
    }

    const result = await restoreSnapshot(raw)
    if (result.success) {
      ElMessage.success('导入成功')
    } else {
      ElMessage.error('导入失败，请重试')
    }
  } catch (e) {
    ElMessage.error('导入失败，请重试')
  }
}

function handleDropdownCommand(command) {
  switch (command) {
    case 'export': handleExport(); break
    case 'import': handleImportClick(); break
    case 'seed': handleLoadSeed(); break
    case 'clear': handleClearData(); break
  }
}
</script>

<template>
  <nav v-if="showNavbar" class="navbar">
    <div class="navbar__left" @click="router.push('/')">
      <span class="navbar__logo">📚</span>
      <span class="navbar__title">智学图谱</span>
    </div>
    <div class="navbar__right">
      <el-dropdown trigger="click" @command="handleDropdownCommand">
        <el-button text class="navbar__menu-btn">
          数据管理 ▾
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="export">导出数据</el-dropdown-item>
            <el-dropdown-item command="import">导入数据</el-dropdown-item>
            <el-dropdown-item command="seed">载入示例</el-dropdown-item>
            <el-dropdown-item command="clear" divided>清空数据</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span class="navbar__user">{{ authStore.username }}</span>
      <el-button size="small" @click="handleLogout">退出登录</el-button>
    </div>
  </nav>

  <main :class="{ 'has-navbar': showNavbar }">
    <router-view />
  </main>

  <input
    ref="fileInputRef"
    type="file"
    accept=".json"
    style="display: none"
    @change="handleFileChange"
  />
</template>


<style>
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
</style>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 1px 12px rgba(102, 126, 234, 0.06);
  z-index: 1000;
}

.navbar__left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.navbar__logo {
  font-size: 24px;
}

.navbar__title {
  font-size: 20px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.navbar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar__menu-btn {
  color: #606266;
  font-size: 14px;
}

.navbar__user {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.has-navbar {
  padding-top: 56px;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 12px;
    height: 50px;
  }
  .has-navbar {
    padding-top: 50px;
  }
  .navbar__title {
    font-size: 18px;
  }
}
</style>