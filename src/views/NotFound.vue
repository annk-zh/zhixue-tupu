<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="not-found-page">
    <el-card shadow="never">
      <p class="not-found-text">页面不存在</p>
      <el-button @click="router.push({ name: 'Home' })">返回首页</el-button>
    </el-card>
  </div>
</template>

<style scoped>
.not-found-page {
  max-width: 720px;
  margin: 40px auto;
  padding: 0 16px;
}

.not-found-text {
  font-size: 16px;
  margin-bottom: 16px;
}
</style>