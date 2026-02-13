<script setup lang="ts">
import { SIDEBAR_MENUS } from '@/config/menu'
import { useRouter } from 'vue-router'

const router = useRouter()

function go(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="dashboard">
    <h2 class="page-title">仪表盘</h2>
    <p class="page-desc">管理后台功能入口与概览</p>
    <el-row :gutter="16" class="menu-cards">
      <el-col
        v-for="m in SIDEBAR_MENUS"
        :key="m.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
      >
        <el-card
          shadow="hover"
          class="menu-card"
          @click="go(m.path)"
        >
          <div class="card-body">
            <span class="card-title">{{ m.title }}</span>
            <p class="card-desc">点击进入 {{ m.title }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1000px;
}

.page-title {
  margin: 0 0 8px;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-desc {
  margin: 0 0 24px;
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
}

.menu-cards {
  margin-top: 16px;
}

.menu-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.menu-card:hover {
  transform: translateY(-2px);
}

.card-body {
  padding: 8px 0;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-desc {
  margin: 8px 0 0;
  font-size: 0.8125rem;
  color: var(--el-text-color-secondary);
}
</style>
