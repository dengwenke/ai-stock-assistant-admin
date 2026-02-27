<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getOutboxEvents, replayOutboxEvents, replayOutboxByPolicy, getOutboxMetrics } from '@/api/client'
import type { OutboxEvent, OutboxMetrics, OutboxReplayResult } from '@/api/types'

const loading = ref(false)
const events = ref<OutboxEvent[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const statusFilter = ref('')
const eventTypeFilter = ref('')
const bizKeyFilter = ref('')

const metrics = ref<OutboxMetrics | null>(null)
const selectedIds = ref<number[]>([])
const replayResult = ref<OutboxReplayResult | null>(null)
const replayLoading = ref(false)

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'PROCESSING', label: 'PROCESSING' },
  { value: 'SUCCESS', label: 'SUCCESS' },
  { value: 'FAILED', label: 'FAILED' },
  { value: 'DEAD', label: 'DEAD' },
]

const eventTypeOptions = [
  { value: '', label: '全部' },
  { value: 'NOTICE_PENDING_CREATED', label: 'NOTICE_PENDING_CREATED' },
]

const policyOptions = [
  { value: 'notice_dead', label: '公告 DEAD 事件' },
  { value: 'notice_failed_or_dead', label: '公告 FAILED/DEAD' },
]

const selectedPolicy = ref('')

async function fetchMetrics() {
  try {
    metrics.value = await getOutboxMetrics()
  } catch (e) {
    console.error('获取监控指标失败', e)
  }
}

async function fetchEvents() {
  loading.value = true
  try {
    const res = await getOutboxEvents({
      page: page.value,
      size: pageSize.value,
      status: statusFilter.value || undefined,
      eventType: eventTypeFilter.value || undefined,
      bizKey: bizKeyFilter.value || undefined,
    })
    events.value = res.list
    total.value = res.total
    selectedIds.value = []
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '获取事件列表失败')
  } finally {
    loading.value = false
  }
}

function onPageChange(p: number) {
  page.value = p
  fetchEvents()
}

function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  fetchEvents()
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === events.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = events.value.map(e => e.id)
  }
}

async function handleReplayByIds() {
  if (selectedIds.value.length === 0) return
  replayLoading.value = true
  replayResult.value = null
  try {
    replayResult.value = await replayOutboxEvents(selectedIds.value)
    ElMessage.success(`匹配: ${replayResult.value.matchedCount}, 重置: ${replayResult.value.resetCount}`)
    await fetchEvents()
    await fetchMetrics()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '重放失败')
  } finally {
    replayLoading.value = false
  }
}

async function handleReplayByPolicy() {
  if (!selectedPolicy.value) return
  replayLoading.value = true
  replayResult.value = null
  try {
    replayResult.value = await replayOutboxByPolicy({ policyName: selectedPolicy.value })
    ElMessage.success(`匹配: ${replayResult.value.matchedCount}, 重置: ${replayResult.value.resetCount}`)
    await fetchEvents()
    await fetchMetrics()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '策略重放失败')
  } finally {
    replayLoading.value = false
  }
}

onMounted(() => {
  fetchMetrics()
  fetchEvents()
})
</script>

<template>
  <div class="outbox-view">
    <div class="toolbar">
      <h2 class="page-title">Outbox 事件管理</h2>
    </div>

    <div v-if="metrics" class="metrics-grid">
      <div class="metric-card" :class="{ 'metric-alert': metrics.alertPending }">
        <div class="metric-label">PENDING</div>
        <div class="metric-value">{{ metrics.pendingCount }}</div>
        <div class="metric-warn">阈值: {{ metrics.pendingWarn }}</div>
      </div>
      <div class="metric-card" :class="{ 'metric-alert': metrics.alertProcessing }">
        <div class="metric-label">PROCESSING</div>
        <div class="metric-value">{{ metrics.processingCount }}</div>
        <div class="metric-warn">阈值: {{ metrics.processingWarn }}</div>
      </div>
      <div class="metric-card" :class="{ 'metric-alert': metrics.alertFailed }">
        <div class="metric-label">FAILED</div>
        <div class="metric-value">{{ metrics.failedCount }}</div>
        <div class="metric-warn">阈值: {{ metrics.failedWarn }}</div>
      </div>
      <div class="metric-card" :class="{ 'metric-alert': metrics.alertDead }">
        <div class="metric-label">DEAD</div>
        <div class="metric-value">{{ metrics.deadCount }}</div>
        <div class="metric-warn">阈值: {{ metrics.deadWarn }}</div>
      </div>
      <div class="metric-card metric-info">
        <div class="metric-label">窗口成功</div>
        <div class="metric-value">{{ metrics.successInWindow }}</div>
        <div class="metric-warn">最近 60 分钟</div>
      </div>
      <div class="metric-card metric-info">
        <div class="metric-label">平均耗时</div>
        <div class="metric-value">{{ metrics.avgProcessTimeMs }}ms</div>
      </div>
    </div>

    <div class="filter-section">
      <el-select v-model="statusFilter" clearable placeholder="状态" style="width: 140px" @change="page = 1; fetchEvents()">
        <el-option v-for="opt in statusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-select v-model="eventTypeFilter" clearable placeholder="事件类型" style="width: 200px" @change="page = 1; fetchEvents()">
        <el-option v-for="opt in eventTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
      <el-input v-model="bizKeyFilter" placeholder="业务键模糊搜索" clearable style="width: 200px" @keyup.enter="page = 1; fetchEvents()" @clear="page = 1; fetchEvents()" />
      <el-button type="primary" @click="page = 1; fetchEvents()">查询</el-button>
    </div>

    <div class="action-section">
      <div class="action-left">
        <el-button type="primary" :disabled="selectedIds.length === 0 || replayLoading" @click="handleReplayByIds">
          重放选中 ({{ selectedIds.length }})
        </el-button>
        <el-select v-model="selectedPolicy" clearable placeholder="选择策略" style="width: 180px">
          <el-option v-for="opt in policyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-button type="warning" :disabled="!selectedPolicy || replayLoading" @click="handleReplayByPolicy">
          策略重放
        </el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="events" stripe style="width: 100%">
      <el-table-column width="50">
        <template #header>
          <el-checkbox
            :checked="selectedIds.length === events.length && events.length > 0"
            @change="toggleSelectAll"
          />
        </template>
        <template #default="{ row }">
          <el-checkbox :checked="selectedIds.includes(row.id)" @change="toggleSelect(row.id)" />
        </template>
      </el-table-column>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="eventType" label="事件类型" min-width="180" />
      <el-table-column prop="bizKey" label="业务键" min-width="180" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" size="small">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="retryCount" label="重试" width="60" />
      <el-table-column prop="nextRetryTime" label="下次重试" width="150" />
      <el-table-column prop="lastError" label="最后错误" min-width="150" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column prop="updateTime" label="更新时间" width="170" />
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      class="pagination"
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />
  </div>
</template>

<script lang="ts">
function getStatusTagType(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | ''> = {
    PENDING: 'warning',
    PROCESSING: 'info',
    SUCCESS: 'success',
    FAILED: 'danger',
    DEAD: 'danger',
  }
  return map[status] || 'info'
}
</script>

<style scoped>
.outbox-view {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.metric-card.metric-alert {
  border-color: #f56c6c;
  background: #fef0f0;
}

.metric-card.metric-info {
  border-color: #409eff;
}

.metric-label {
  font-size: 0.75rem;
  color: #909399;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #303133;
}

.metric-warn {
  font-size: 0.75rem;
  color: #c0c4cc;
  margin-top: 4px;
}

.filter-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.action-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
