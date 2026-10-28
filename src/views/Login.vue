<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import { setToken } from '@/utils/auth'
import { migrateLocalData } from '@/utils/migration'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: ['blur', 'change'] }],
  password: [{ required: true, message: '请输入密码', trigger: ['blur', 'change'] }]
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const { data } = await request.post('/login', {
      username: form.username.trim(),
      password: form.password
    })
    if (data.code === 0 && data.data?.token) {
      setToken(data.data.token)
      const migRes = await migrateLocalData()
      if (!migRes.success) {
        ElMessage.warning(migRes.message)
      } else if (migRes.migrated && migRes.migrated.exams + migRes.migrated.tasks > 0) {
        ElMessage.success('旧数据迁移完成')
      }
      router.replace('/')
    } else {
      form.password = ''
      ElMessage.error(data.message || '登录失败，请重试')
    }
  } catch (err) {
    const msg = err.response?.data?.message || '网络异常，请稍后重试'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <span class="login-logo">📚</span>
        <h1 class="login-title">智学图谱</h1>
        <p class="login-subtitle">登录你的学习空间</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" class="login-btn">登录</el-button>
        </el-form-item>
        <div class="login-footer">
          还没有账号？<a href="/register" class="register-link">去注册</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.login-card {
  width: 420px;
  max-width: 100%;
  padding: 40px 36px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow: 0 8px 40px rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.register-link {
  color: var(--primary-color);
  font-weight: 500;
}
.register-link:hover {
  color: var(--primary-end);
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 20px;
  }
}
</style>