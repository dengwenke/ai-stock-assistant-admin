<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLlmLogPage, getLlmLogById } from '@/api/client'
import type { LlmRequestLogItem } from '@/api/types'

const list = ref<LlmRequestLogItem[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const taskType = ref('')
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref<LlmRequestLogItem | null>(null)

async function load() {
  loading.value = true
  try {
    const res = await getLlmLogPage({
      page: page.value,
      size: pageSize.value,
      taskType: taskType.value || undefined,
    })
    list.value = res.list
    total.value = res.total
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function showDetail(id: number) {
  detailVisible.value = true
  detailRow.value = null
  detailLoading.value = true
  try {
    detailRow.value = await getLlmLogById(id)
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载详情失败')
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

function onSizeChange() {
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="llm-logs-view">
    <div class="toolbar">
      <h2 class="page-title">LLM 调用日志</h2>
      <el-input
        v-model="taskType"
        placeholder="按任务类型筛选"
        clearable
        style="width: 200px"
        @clear="load"
        @keyup.enter="load"
      />
      <el-button type="primary" @click="load">查询</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="taskType" label="任务类型" width="120" />
      <el-table-column prop="accountName" label="账号" width="100" />
      <el-table-column prop="bizKey" label="业务键" min-width="120" />
      <el-table-column prop="createTime" label="时间" width="170" />
      <el-table-column prop="requestDurationMs" label="耗时(ms)" width="90" />
      <el-table-column prop="status" label="状态" width="80" />
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.id"
            type="primary"
            link
            size="small"
            @click="showDetail(row.id)"
          >
            详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next"
      class="pagination"
      @current-change="load"
      @size-change="onSizeChange"
    />
    <el-dialog
      v-model="detailVisible"
      title="调用详情"
      width="80%"
      destroy-on-close
    >
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detailRow">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="ID">{{ detailRow.id }}</el-descriptions-item>
            <el-descriptions-item label="任务类型">{{ detailRow.taskType }}</el-descriptions-item>
            <el-descriptions-item label="账号">{{ detailRow.accountName }}</el-descriptions-item>
            <el-descriptions-item label="业务键">{{ detailRow.bizKey }}</el-descriptions-item>
            <el-descriptions-item label="时间">{{ detailRow.createTime }}</el-descriptions-item>
            <el-descriptions-item label="耗时(ms)">{{ detailRow.requestDurationMs }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ detailRow.status }}</el-descriptions-item>
          </el-descriptions>
          <div class="detail-block">
            <div class="detail-label">Prompt</div>
            <pre class="detail-content">{{ detailRow.prompt ?? '-' }}</pre>
          </div>
          <div class="detail-block">
            <div class="detail-label">Response</div>
            <pre class="detail-content">{{ detailRow.response ?? '-' }}</pre>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.llm-logs-view {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  margin-right: auto;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.detail-body {
  min-height: 120px;
}

.detail-block {
  margin-top: 16px;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.detail-content {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 0.8125rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
}
</style>
