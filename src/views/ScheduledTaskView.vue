<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getScheduledTaskList,
  updateScheduledTask,
  refreshScheduledTasks,
  runScheduledTask,
  deleteScheduledTask,
} from '@/api/client'
import type { ScheduledTaskItem, ScheduledTaskUpdateRequest } from '@/api/types'

const list = ref<ScheduledTaskItem[]>([])
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

async function load() {
  loading.value = true
  try {
    list.value = await getScheduledTaskList()
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
    await load()
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
    await load()
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

onMounted(load)
</script>

<template>
  <div class="scheduled-task-view">
    <div class="page-header">
      <h1 class="page-title">定时任务</h1>
      <p class="page-desc">统一使用 Cron 表达式配置执行时间，修改后需点击「刷新调度」使配置生效。</p>
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

    <div class="table-card">
      <el-table
        v-loading="loading"
        :data="list"
        stripe
        class="task-table"
      >
        <el-table-column prop="taskKey" label="任务键" min-width="200" show-overflow-tooltip />
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
        <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.description || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-button type="primary" link size="small" @click="handleRun(row.taskKey)">
              立即执行
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

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
  max-width: 1100px;
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

.table-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.task-table {
  width: 100%;
}

.cron-cell {
  font-size: 0.8125rem;
  font-family: ui-monospace, monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
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
