<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock } from '@element-plus/icons-vue'
import {
  getScheduledTaskPage,
  createScheduledTask,
  updateScheduledTask,
  refreshScheduledTasks,
  runScheduledTask,
  deleteScheduledTask,
} from '@/api/client'
import type { ScheduledTaskItem, ScheduledTaskUpdateRequest, ScheduledTaskCreateRequest } from '@/api/types'
import { SCHEDULED_TASKS } from '@/domain/task-monitor'

const list = ref<ScheduledTaskItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const refreshLoading = ref(false)

// ═══════════ 对话框状态 ═══════════
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增定时任务' : '编辑定时任务')
const dialogSaving = ref(false)

interface TaskForm {
  taskKey: string
  cronExpression: string
  enabled: number
  description: string
}
const taskForm = ref<TaskForm>({
  taskKey: '',
  cronExpression: '',
  enabled: 1,
  description: '',
})

// ═══════════ Cron 预设 ═══════════
interface CronPreset {
  label: string
  cron: string
  desc: string
}
const CRON_PRESETS: CronPreset[] = [
  { label: '每天 09:00', cron: '0 0 9 * * ?', desc: '每天上午9点执行' },
  { label: '每天 00:00', cron: '0 0 0 * * ?', desc: '每天午夜执行' },
  { label: '每天 21:00', cron: '0 0 21 * * ?', desc: '每天晚上9点执行' },
  { label: '每小时整点', cron: '0 0 * * * ?', desc: '每小时0分0秒执行' },
  { label: '每30分钟', cron: '0 */30 * * * ?', desc: '每30分钟执行一次' },
  { label: '每5分钟', cron: '0 */5 * * * ?', desc: '每5分钟执行一次' },
  { label: '工作日 09:00', cron: '0 0 9 ? * MON-FRI', desc: '周一到周五9点执行' },
]

function applyPreset(preset: CronPreset) {
  taskForm.value.cronExpression = preset.cron
}

// ═══════════ Cron 校验 ═══════════
const cronError = ref('')

/**
 * 校验 Spring Boot 6字段 cron 表达式
 * 格式：秒 分 时 日 月 周
 */
function validateCron(cron: string): string {
  if (!cron || !cron.trim()) return '请输入 Cron 表达式'
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 6) return `需要 6 个字段（秒 分 时 日 月 周），当前 ${parts.length} 个`
  
  const fieldNames = ['秒', '分', '时', '日', '月', '周']
  const fieldRanges = [
    { min: 0, max: 59 },  // 秒
    { min: 0, max: 59 },  // 分
    { min: 0, max: 23 },  // 时
    { min: 1, max: 31 },  // 日
    { min: 1, max: 12 },  // 月
    { min: 0, max: 7 },   // 周 (0-7, 0和7都是周日)
  ]
  
  for (let i = 0; i < 6; i++) {
    const part = parts[i]
    // 允许的特殊字符
    if (/^[*?]$/.test(part)) continue
    if (/^[*/\-,0-9A-Za-z]+$/.test(part)) {
      // 提取数字部分验证范围  
      const nums = part.match(/\d+/g)
      if (nums) {
        for (const n of nums) {
          const num = parseInt(n, 10)
          if (num < fieldRanges[i].min || num > fieldRanges[i].max) {
            return `${fieldNames[i]}字段值 ${num} 超出范围 (${fieldRanges[i].min}-${fieldRanges[i].max})`
          }
        }
      }
    } else {
      return `${fieldNames[i]}字段包含无效字符`
    }
  }
  return ''
}

watch(() => taskForm.value.cronExpression, (val) => {
  cronError.value = validateCron(val)
})

// ═══════════ Cron 人类可读描述 ═══════════
const cronDescription = computed(() => {
  const cron = taskForm.value.cronExpression?.trim()
  if (!cron || cronError.value) return ''
  
  // 匹配常见预设模式
  const preset = CRON_PRESETS.find(p => p.cron === cron)
  if (preset) return preset.desc
  
  const parts = cron.split(/\s+/)
  if (parts.length !== 6) return ''
  
  const [sec, min, hour, day, month, week] = parts
  const pieces: string[] = []
  
  // 解析时间
  if (sec === '0' && /^\d+$/.test(min) && /^\d+$/.test(hour)) {
    pieces.push(`${hour.padStart(2, '0')}:${min.padStart(2, '0')}`)
  } else if (sec === '0' && min.startsWith('*/')) {
    pieces.push(`每${min.slice(2)}分钟`)
  } else if (sec === '0' && min === '0' && hour === '*') {
    pieces.push('每小时整点')
  } else if (sec === '0' && min === '0' && hour.startsWith('*/')) {
    pieces.push(`每${hour.slice(2)}小时`)
  }
  
  // 解析日期限定
  if (day === '*' && month === '*' && week === '?') {
    pieces.unshift('每天')
  } else if (week === 'MON-FRI' || week === '1-5') {
    pieces.unshift('工作日')
  } else if (week !== '?' && week !== '*') {
    pieces.unshift(`周${week}`)
  }
  
  return pieces.length ? pieces.join(' ') + ' 执行' : ''
})

// ═══════════ 辅助函数 ═══════════
function getTaskTitle(taskKey: string): string {
  const task = SCHEDULED_TASKS.find((t) => t.taskKey === taskKey)
  return task?.title || taskKey
}

function getTaskDescription(taskKey: string): string {
  const task = SCHEDULED_TASKS.find((t) => t.taskKey === taskKey)
  return task?.description || ''
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

// ═══════════ 对话框操作 ═══════════
function openAdd() {
  dialogMode.value = 'add'
  taskForm.value = {
    taskKey: '',
    cronExpression: '',
    enabled: 1,
    description: '',
  }
  cronError.value = ''
  dialogVisible.value = true
}

function openEdit(row: ScheduledTaskItem) {
  dialogMode.value = 'edit'
  taskForm.value = {
    taskKey: row.taskKey,
    cronExpression: row.cronExpression ?? '',
    enabled: row.enabled,
    description: row.description ?? '',
  }
  cronError.value = validateCron(taskForm.value.cronExpression)
  dialogVisible.value = true
}

async function submitDialog() {
  // 校验 cron
  const err = validateCron(taskForm.value.cronExpression)
  if (err) {
    cronError.value = err
    ElMessage.warning(err)
    return
  }
  
  // 校验任务键（新增时必填）
  if (dialogMode.value === 'add' && !taskForm.value.taskKey.trim()) {
    ElMessage.warning('请输入任务键')
    return
  }
  
  dialogSaving.value = true
  try {
    if (dialogMode.value === 'add') {
      const body: ScheduledTaskCreateRequest = {
        taskKey: taskForm.value.taskKey.trim(),
        cronExpression: taskForm.value.cronExpression.trim(),
        enabled: taskForm.value.enabled,
        description: taskForm.value.description || undefined,
      }
      await createScheduledTask(body)
      ElMessage.success('已创建')
    } else {
      const payload: ScheduledTaskUpdateRequest = {
        enabled: taskForm.value.enabled,
        cronExpression: taskForm.value.cronExpression.trim(),
        description: taskForm.value.description,
      }
      await updateScheduledTask(taskForm.value.taskKey, payload)
      ElMessage.success('已保存')
    }
    dialogVisible.value = false
    await load()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '操作失败'
    // 409 表示 taskKey 已存在
    if (String(e).includes('409')) {
      ElMessage.error('任务键已存在，请使用其他名称')
    } else {
      ElMessage.error(msg)
    }
  } finally {
    dialogSaving.value = false
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
      <div class="header-left">
        <h1 class="page-title">定时任务</h1>
        <p class="page-desc">
          管理数据同步、指标计算等定时任务。修改后需点击「刷新调度」使配置生效。
        </p>
      </div>
      <div class="toolbar">
        <el-button @click="openAdd">
          新增
        </el-button>
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
      size="small"
    >
      <el-table-column label="任务" min-width="180">
        <template #default="{ row }">
          <div class="task-name">
            <span class="task-title">{{ getTaskTitle(row.taskKey) }}</span>
            <span class="task-key">{{ row.taskKey }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="cronExpression" label="Cron 表达式" min-width="130">
        <template #default="{ row }">
          <code class="cron-cell">{{ row.cronExpression || '—' }}</code>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" label="状态" width="70" align="center">
        <template #default="{ row }">
          <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
            {{ row.enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="说明" min-width="150" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.description || getTaskDescription(row.taskKey) || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
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
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      class="pagination"
      size="small"
      @current-change="onPageChange"
      @size-change="onSizeChange"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      class="task-dialog"
      :close-on-click-modal="false"
      @close="dialogVisible = false"
    >
      <el-form
        :model="taskForm"
        label-width="100px"
        label-position="left"
      >
        <el-form-item label="任务键" required>
          <el-input
            v-model="taskForm.taskKey"
            :disabled="dialogMode === 'edit'"
            placeholder="如 my.custom.task"
          />
          <div v-if="dialogMode === 'add'" class="form-hint">
            唯一标识，建议使用点分命名如：domain.action
          </div>
        </el-form-item>
        
        <el-form-item label="Cron 表达式" required :error="cronError">
          <el-input
            v-model="taskForm.cronExpression"
            placeholder="如 0 0 9 * * ?"
            clearable
            :class="{ 'is-error': cronError }"
          />
          <div class="cron-fields-hint">
            <span>秒</span><span>分</span><span>时</span><span>日</span><span>月</span><span>周</span>
          </div>
          <div v-if="cronError" class="cron-error">{{ cronError }}</div>
          <div v-else-if="cronDescription" class="cron-description">
            <el-icon><Clock /></el-icon>
            {{ cronDescription }}
          </div>
        </el-form-item>
        
        <el-form-item label="常用预设">
          <div class="preset-buttons">
            <el-button
              v-for="preset in CRON_PRESETS"
              :key="preset.cron"
              size="small"
              :type="taskForm.cronExpression === preset.cron ? 'primary' : 'default'"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="启用">
          <el-switch v-model="taskForm.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
        
        <el-form-item label="说明">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="2"
            placeholder="任务说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialogSaving"
          :disabled="!!cronError"
          @click="submitDialog"
        >
          {{ dialogMode === 'add' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.scheduled-task-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 4px 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
}

.page-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.4;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 16px;
  flex-shrink: 0;
}

.task-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.task-title {
  font-weight: 500;
  color: #0f172a;
  font-size: 0.875rem;
}

.task-key {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
}

.cron-cell {
  font-size: 0.78125rem;
  font-family: ui-monospace, monospace;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}

.form-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

/* ═══════════ 对话框增强样式 ═══════════ */
.task-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.cron-fields-hint {
  display: flex;
  gap: 0;
  margin-top: 4px;
  font-size: 0.7rem;
  color: #94a3b8;
}

.cron-fields-hint span {
  flex: 1;
  text-align: center;
  padding: 2px 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-left: none;
}

.cron-fields-hint span:first-child {
  border-left: 1px solid #e2e8f0;
  border-radius: 4px 0 0 4px;
}

.cron-fields-hint span:last-child {
  border-radius: 0 4px 4px 0;
}

.cron-error {
  font-size: 0.75rem;
  color: #f56c6c;
  margin-top: 4px;
}

.cron-description {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #67c23a;
  margin-top: 6px;
}

.cron-description .el-icon {
  font-size: 14px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-buttons .el-button {
  margin: 0;
}

:deep(.el-input.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}
</style>
