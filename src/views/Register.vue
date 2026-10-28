<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)
const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'change'] },
    { pattern: /^[A-Za-z0-9_]{3,20}$/, message: '用户名需3-20位字母、数字或下划线', trigger: ['blur', 'change'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
    { min: 6, message: '密码至少6位', trigger: ['blur', 'change'] }
  ]
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
    const { data } = await request.post('/register', {
      username: form.username.trim(),
      password: form.password
    })
    if (data.code === 0) {
      ElMessage.success('注册成功，请登录')
      router.replace('/login')
    } else {
      ElMessage.error(data.message || '注册失败，请重试')
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
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <span class="register-logo">📚</span>
        <h1 class="register-title">智学图谱</h1>
        <p class="register-subtitle">创建新账号</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit" class="register-btn">注册</el-button>
        </el-form-item>
        <div class="register-footer">
          已有账号？<a href="/login" class="login-link">去登录</a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
}

.register-card {
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

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-logo {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.register-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.register-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.login-link {
  color: var(--primary-color);
  font-weight: 500;
}
.login-link:hover {
  color: var(--primary-end);
}

@media (max-width: 480px) {
  .register-card {
    padding: 32px 20px;
  }
}
</style>