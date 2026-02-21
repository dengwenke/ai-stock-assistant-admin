<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getScheduledTaskPage,
  updateScheduledTask,
  refreshScheduledTasks,
  runScheduledTask,
  deleteScheduledTask,
} from '@/api/client'
import type { ScheduledTaskItem, ScheduledTaskUpdateRequest } from '@/api/types'
import {
  SCHEDULED_TASKS,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_COLORS,
} from '@/domain/task-monitor'

const list = ref<ScheduledTaskItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const refreshLoading = ref(false)

const editVisible = ref(false)
const editForm = ref<ScheduledTaskUpdateRequest & { taskKey: string }>({
  taskKey: '',
  enabled: 1,
  cronExpression: '',
  description: '',
})
const editSaving = ref(false)

function getTaskTitle(taskKey: string): string {
  const task = SCHEDULED_TASKS.find((t) => t.taskKey === taskKey)
  return task?.title || taskKey
}

function getTaskDescription(taskKey: string): string {
  const task = SCHEDULED_TASKS.find((t) => t.taskKey === taskKey)
  return task?.description || ''
}

function getTaskCategory(taskKey: string): string {
  const task = SCHEDULED_TASKS.find((t) => t.taskKey === taskKey)
  return task?.category || ''
}

async function load() {
  loading.value = true
  try {
    const res = await getScheduledTaskPage({ page: page.value, size: pageSize.value })
    list.value = res.list
    total.value = res.total
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleRefresh() {
  refreshLoading.value = true
  try {
    await refreshScheduledTasks()
    ElMessage.success('调度已刷新')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '刷新失败')
  } finally {
    refreshLoading.value = false
  }
}

function openEdit(row: ScheduledTaskItem) {
  editForm.value = {
    taskKey: row.taskKey,
    enabled: row.enabled,
    cronExpression: row.cronExpression ?? '',
    description: row.description ?? '',
  }
  editVisible.value = true
}

async function submitEdit() {
  const { taskKey, ...body } = editForm.value
  const payload: ScheduledTaskUpdateRequest = {}
  if (body.enabled !== undefined) payload.enabled = body.enabled
  if (body.cronExpression !== undefined) payload.cronExpression = body.cronExpression
  if (body.description !== undefined) payload.description = body.description
  if (Object.keys(payload).length === 0) {
    editVisible.value = false
    return
  }
  editSaving.value = true
  try {
    await updateScheduledTask(taskKey, payload)
    ElMessage.success('已保存')
    editVisible.value = false
    await load()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    editSaving.value = false
  }
}

async function handleRun(taskKey: string) {
  try {
    await ElMessageBox.confirm(`确定立即执行任务「${taskKey}」？`, '确认执行', {
      confirmButtonText: '执行',
      cancelButtonText: '取消',
      type: 'info',
    })
  } catch {
    return
  }
  try {
    await runScheduledTask(taskKey)
    ElMessage.success('已触发执行')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '执行失败')
  }
}

async function handleDelete(row: ScheduledTaskItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除任务「${row.taskKey}」？删除后将从配置中移除，需刷新调度后生效。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return
  }
  try {
    await deleteScheduledTask(row.taskKey)
    ElMessage.success('已删除')
    await load()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onSizeChange(s: number) {
  pageSize.value = s
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <div class="scheduled-task-view">
    <div class="page-header">
      <h1 class="page-title">定时任务</h1>
      <p class="page-desc">
        管理数据同步、指标计算等定时任务。修改后需点击「刷新调度」使配置生效。
      </p>
      <div class="toolbar">
        <el-button
          type="primary"
          :loading="refreshLoading"
          @click="handleRefresh"
        >
          刷新调度
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      stripe
      style="width: 100%"
    >
      <el-table-column label="任务" min-width="220">
        <template #default="{ row }">
          <div class="task-name">
            <span class="task-title">{{ getTaskTitle(row.taskKey) }}</span>
            <span class="task-key">{{ row.taskKey }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="100">
        <template #default="{ row }">
          <span
            v-if="getTaskCategory(row.taskKey)"
            class="category-tag"
            :style="{ borderColor: TASK_CATEGORY_COLORS[getTaskCategory(row.taskKey)] || '#909399', color: TASK_CATEGORY_COLORS[getTaskCategory(row.taskKey)] || '#909399' }"
          >
            {{ TASK_CATEGORY_LABELS[getTaskCategory(row.taskKey)] || '' }}
          </span>
          <span v-else class="category-tag category-other">其他</span>
        </template>
      </el-table-column>
      <el-table-column prop="cronExpression" label="Cron 表达式" min-width="140">
        <template #default="{ row }">
          <code class="cron-cell">{{ row.cronExpression || '—' }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="88" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
            {{ row.enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.description || getTaskDescription(row.taskKey) || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button type="success" link size="small" @click="handleRun(row.taskKey)">
            执行
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            删除
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
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />

    <el-dialog
      v-model="editVisible"
      title="编辑定时任务"
      width="480px"
      class="edit-dialog"
      :close-on-click-modal="false"
      @close="editVisible = false"
    >
      <el-form
        :model="editForm"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="任务键">
          <el-input :model-value="editForm.taskKey" disabled />
        </el-form-item>
        <el-form-item label="Cron 表达式" required>
          <el-input
            v-model="editForm.cronExpression"
            placeholder="如 0 0 9 * * ?"
            clearable
          />
          <div class="form-hint">秒 分 时 日 月 周，例：0 0 9 * * ? 表示每天 9:00</div>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="2"
            placeholder="任务说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="submitEdit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.scheduled-task-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 1.375rem;
  font-weight: 600;
  color: #0f172a;
}

.page-desc {
  margin: 0 0 14px 0;
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-weight: 500;
  color: #0f172a;
}

.task-key {
  font-size: 0.75rem;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

.category-tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid;
}

.category-other {
  border-color: #909399;
  color: #909399;
}

.cron-cell {
  font-size: 0.8125rem;
  font-family: ui-monospace, monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.form-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

.edit-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
