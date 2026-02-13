<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)

const from = computed(() => {
  const f = route.query.from
  return typeof f === 'string' ? f : '/'
})

async function onSubmit() {
  if (!username.value.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!password.value) {
    ElMessage.warning('请输入密码')
    return
  }
  loading.value = true
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    ElMessage.success('登录成功')
    await router.replace(from.value || '/')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>管理后台</span>
        </div>
      </template>
      <p class="login-desc">请使用管理员账号登录</p>
      <el-form label-width="0" @submit.prevent="onSubmit">
        <el-form-item>
          <el-input
            v-model="username"
            placeholder="用户名"
            size="large"
            autocomplete="username"
            :disabled="loading"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="密码"
            size="large"
            autocomplete="current-password"
            show-password
            :disabled="loading"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="onSubmit"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.login-card {
  width: 100%;
  max-width: 380px;
}

.card-header {
  font-size: 1.25rem;
  font-weight: 600;
}

.login-desc {
  margin: 0 0 20px;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}
</style>
