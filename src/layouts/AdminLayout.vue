<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { SIDEBAR_MENUS } from '@/config/menu'
import {
  Odometer,
  Timer,
  Setting,
  Document,
  Key,
  SwitchButton,
  Fold,
  Expand,
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const sidebarCollapsed = ref(false)
const iconMap: Record<string, typeof Odometer> = {
  Odometer,
  Timer,
  Setting,
  Document,
  Key,
}

const currentTitle = computed(() => {
  const name = route.name as string
  const item = SIDEBAR_MENUS.find((m) => m.id === name)
  return item?.title ?? (route.meta?.title as string) ?? '管理后台'
})

async function logout() {
  await ElMessageBox.confirm('确定退出登录？', '提示', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  })
  auth.clearAuth()
  router.replace('/login')
}
</script>

<template>
  <el-container class="admin-layout">
    <el-aside :width="sidebarCollapsed ? '64px' : '220px'" class="aside">
      <div class="logo">
        <span class="logo-text">{{ sidebarCollapsed ? '管' : '管理后台' }}</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="sidebarCollapsed"
        class="sidebar-menu"
        background-color="#0f1419"
        text-color="#94a3b8"
        active-text-color="#22d3ee"
        router
      >
        <el-menu-item
          v-for="m in SIDEBAR_MENUS"
          :key="m.id"
          :index="m.path"
        >
          <el-icon>
            <component :is="iconMap[m.icon ?? 'Setting']" />
          </el-icon>
          <template #title>{{ m.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container direction="vertical">
      <el-header class="header">
        <div class="header-left">
          <el-button
            text
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <el-icon><component :is="sidebarCollapsed ? Expand : Fold" /></el-icon>
          </el-button>
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <span class="username">{{ auth.username }}</span>
          <el-button type="danger" link @click="logout">
            <el-icon><SwitchButton /></el-icon>
            <span>退出</span>
          </el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  height: 100vh;
  overflow: hidden;
}

.aside {
  background: #0f1419;
  border-right: 1px solid #1e293b;
  transition: width 0.2s;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #1e293b;
}

.logo-text {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-menu {
  border-right: none;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.username {
  font-size: 0.875rem;
  color: #64748b;
}

.main {
  background: #f1f5f9;
  padding: 16px;
  overflow: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
