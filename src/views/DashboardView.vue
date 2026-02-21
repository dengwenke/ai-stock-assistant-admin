<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { SIDEBAR_MENUS } from '@/config/menu'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getLatestLlmLogByTaskType, getScheduledTaskList } from '@/api/client'
import { MONITORED_TASKS } from '@/domain/task-monitor'

interface TaskMonitorCard {
  taskKey: string
  title: string
  description: string
  llmTaskType?: string
  enabledText: string
  statusText: string
  statusType: 'success' | 'info' | 'warning' | 'danger'
  lastRunTime: string
  durationText: string
}

const router = useRouter()
const monitorLoading = ref(false)
const monitorCards = ref<TaskMonitorCard[]>([])

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

async function loadMonitor() {
  monitorLoading.value = true
  try {
    const taskList = await getScheduledTaskList()
    const taskMap = new Map(taskList.map((item) => [item.taskKey, item]))
    const cards = await Promise.all(
      MONITORED_TASKS.map(async (task) => {
        const row = taskMap.get(task.taskKey)
        const latestLog = task.llmTaskType
          ? await getLatestLlmLogByTaskType(task.llmTaskType)
          : null
        const status = buildStatusText(latestLog?.status)
        return {
          taskKey: task.taskKey,
          title: task.title,
          description: task.description,
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
    monitorCards.value = cards
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
    <p class="page-desc">管理后台功能入口与概览</p>
    <el-card class="monitor-panel" shadow="never" v-loading="monitorLoading">
      <template #header>
        <div class="monitor-header">
          <span>任务监测</span>
          <el-button type="primary" link @click="go('/scheduled-task')">管理任务</el-button>
        </div>
      </template>
      <div class="monitor-cards">
        <div v-for="card in monitorCards" :key="card.taskKey" class="monitor-card">
          <div class="monitor-title">{{ card.title }}</div>
          <div class="monitor-desc">{{ card.description }}</div>
          <div class="monitor-line">任务键：<code>{{ card.taskKey }}</code></div>
          <div class="monitor-line">调度状态：{{ card.enabledText }}</div>
          <div class="monitor-line">
            最新结果：
            <el-tag :type="card.statusType" size="small">{{ card.statusText }}</el-tag>
          </div>
          <div class="monitor-line">最近执行：{{ card.lastRunTime }}</div>
          <div class="monitor-line">耗时：{{ card.durationText }}</div>
          <div class="monitor-actions">
            <el-button
              v-if="card.llmTaskType"
              type="primary"
              link
              @click="goLogs(card.llmTaskType)"
            >
              查看日志
            </el-button>
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

.monitor-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.monitor-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafc;
}

.monitor-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.monitor-desc {
  font-size: 0.8125rem;
  color: #475569;
  margin: 6px 0 10px;
}

.monitor-line {
  font-size: 0.8125rem;
  color: #334155;
  margin-top: 6px;
}

.monitor-actions {
  margin-top: 8px;
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
