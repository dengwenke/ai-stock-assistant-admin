<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { SIDEBAR_MENUS } from '@/config/menu'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLatestLlmLogByTaskType, getScheduledTaskPage } from '@/api/client'
import {
  SCHEDULED_TASKS,
  DRIVER_TASKS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
} from '@/domain/task-monitor'

interface TaskMonitorCard {
  taskKey: string
  title: string
  description: string
  category: string
  llmTaskType?: string
  enabledText: string
  statusText: string
  statusType: 'success' | 'info' | 'warning' | 'danger'
  lastRunTime: string
  durationText: string
}

const router = useRouter()
const monitorLoading = ref(false)
const scheduledCards = ref<TaskMonitorCard[]>([])
const driverCards = ref<TaskMonitorCard[]>([])

const groupedScheduledCards = computed(() => {
  const groups: Record<string, TaskMonitorCard[]> = {}
  for (const card of scheduledCards.value) {
    if (!groups[card.category]) {
      groups[card.category] = []
    }
    groups[card.category].push(card)
  }
  return groups
})

const groupedDriverCards = computed(() => {
  const groups: Record<string, TaskMonitorCard[]> = {}
  for (const card of driverCards.value) {
    if (!groups[card.category]) {
      groups[card.category] = []
    }
    groups[card.category].push(card)
  }
  return groups
})

function go(path: string) {
  router.push(path)
}

function goLogs(taskType?: string) {
  router.push({
    path: '/llm-logs',
    query: taskType ? { taskType } : undefined,
  })
}

function buildStatusText(status?: string): {
  text: string
  type: 'success' | 'info' | 'warning' | 'danger'
} {
  if (!status) return { text: '暂无记录', type: 'info' }
  if (status === 'SUCCESS') return { text: '成功', type: 'success' }
  if (status === 'FAILED') return { text: '失败', type: 'danger' }
  return { text: status, type: 'warning' }
}

async function buildCards(
  taskDefs: typeof SCHEDULED_TASKS,
  taskMap: Map<string, { enabled: number }>
): Promise<TaskMonitorCard[]> {
  return Promise.all(
    taskDefs.map(async (task) => {
      const row = taskMap.get(task.taskKey)
      const latestLog = task.llmTaskType
        ? await getLatestLlmLogByTaskType(task.llmTaskType)
        : null
      const status = buildStatusText(latestLog?.status)
      return {
        taskKey: task.taskKey,
        title: task.title,
        description: task.description,
        category: task.category,
        llmTaskType: task.llmTaskType,
        enabledText: row ? (row.enabled === 1 ? '启用中' : '已禁用') : '未注册',
        statusText: status.text,
        statusType: status.type,
        lastRunTime: latestLog?.createTime ?? '暂无',
        durationText: latestLog?.requestDurationMs
          ? `${latestLog.requestDurationMs} ms`
          : '暂无',
      } satisfies TaskMonitorCard
    })
  )
}

async function loadMonitor() {
  monitorLoading.value = true
  try {
    const res = await getScheduledTaskPage({ page: 1, size: 100 })
    const taskMap = new Map(res.list.map((item) => [item.taskKey, item]))
    scheduledCards.value = await buildCards(SCHEDULED_TASKS, taskMap)
    driverCards.value = await buildCards(DRIVER_TASKS, taskMap)
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载监测信息失败')
  } finally {
    monitorLoading.value = false
  }
}

onMounted(loadMonitor)
</script>

<template>
  <div class="dashboard">
    <h2 class="page-title">仪表盘</h2>
    <p class="page-desc">管理后台功能入口与任务监测概览</p>
    
    <el-card class="monitor-panel" shadow="never" v-loading="monitorLoading">
      <template #header>
        <div class="monitor-header">
          <span>定时任务监测</span>
          <div class="monitor-actions">
            <el-button type="primary" link @click="go('/scheduled-task')">任务管理</el-button>
          </div>
        </div>
      </template>
      
      <div class="monitor-groups">
        <div v-for="(cards, category) in groupedScheduledCards" :key="category" class="monitor-group">
          <div class="group-header">
            <span class="group-dot" :style="{ background: TASK_CATEGORY_COLORS[category] || '#909399' }"></span>
            <span class="group-title">{{ TASK_CATEGORY_LABELS[category] || category }}</span>
            <span class="group-count">{{ cards.length }}</span>
          </div>
          <div class="monitor-cards">
            <div v-for="card in cards" :key="card.taskKey" class="monitor-card">
              <div class="monitor-title">{{ card.title }}</div>
              <div class="monitor-desc">{{ card.description }}</div>
              <div class="monitor-meta">
                <div class="monitor-line">
                  <span class="label">调度状态</span>
                  <span class="value" :class="{ 'disabled': card.enabledText !== '启用中' }">{{ card.enabledText }}</span>
                </div>
                <div class="monitor-line">
                  <span class="label">最新结果</span>
                  <el-tag :type="card.statusType" size="small">{{ card.statusText }}</el-tag>
                </div>
                <div class="monitor-line">
                  <span class="label">最近执行</span>
                  <span class="value">{{ card.lastRunTime }}</span>
                </div>
                <div v-if="card.durationText !== '暂无'" class="monitor-line">
                  <span class="label">耗时</span>
                  <span class="value">{{ card.durationText }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button
                  v-if="card.llmTaskType"
                  type="primary"
                  link
                  size="small"
                  @click="goLogs(card.llmTaskType)"
                >
                  查看日志
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="monitor-panel" shadow="never" v-loading="monitorLoading">
      <template #header>
        <div class="monitor-header">
          <span>驱动任务监测</span>
          <div class="monitor-actions">
            <el-button type="primary" link @click="go('/outbox')">Outbox 管理</el-button>
            <el-button type="primary" link @click="go('/driver-task')">驱动任务</el-button>
          </div>
        </div>
      </template>
      
      <div class="monitor-groups">
        <div v-for="(cards, category) in groupedDriverCards" :key="category" class="monitor-group">
          <div class="group-header">
            <span class="group-dot" :style="{ background: TASK_CATEGORY_COLORS[category] || '#909399' }"></span>
            <span class="group-title">{{ TASK_CATEGORY_LABELS[category] || category }}</span>
            <span class="group-count">{{ cards.length }}</span>
          </div>
          <div class="monitor-cards">
            <div v-for="card in cards" :key="card.taskKey" class="monitor-card">
              <div class="monitor-title">{{ card.title }}</div>
              <div class="monitor-desc">{{ card.description }}</div>
              <div class="monitor-meta">
                <div class="monitor-line">
                  <span class="label">调度状态</span>
                  <span class="value" :class="{ 'disabled': card.enabledText !== '启用中' }">{{ card.enabledText }}</span>
                </div>
                <div class="monitor-line">
                  <span class="label">最新结果</span>
                  <el-tag :type="card.statusType" size="small">{{ card.statusText }}</el-tag>
                </div>
                <div class="monitor-line">
                  <span class="label">最近执行</span>
                  <span class="value">{{ card.lastRunTime }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
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
  max-width: 1200px;
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

.monitor-panel {
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.monitor-actions {
  display: flex;
  gap: 8px;
}

.monitor-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.monitor-group {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 16px;
}

.monitor-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.group-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0f172a;
}

.group-count {
  font-size: 0.75rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 10px;
}

.monitor-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.monitor-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
  transition: box-shadow 0.2s;
}

.monitor-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.monitor-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.monitor-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 4px 0 10px;
  line-height: 1.4;
}

.monitor-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.monitor-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
}

.monitor-line .label {
  color: #94a3b8;
  min-width: 60px;
}

.monitor-line .value {
  color: #334155;
}

.monitor-line .value.disabled {
  color: #ef4444;
}

.card-actions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e2e8f0;
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
