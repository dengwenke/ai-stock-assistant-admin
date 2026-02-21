<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigList, updateConfig, createConfig } from '@/api/client'
import type { SysConfigItem } from '@/api/types'

const list = ref<SysConfigItem[]>([])
const loading = ref(false)
const editingKey = ref<string | null>(null)
const editValue = ref('')
const showAddDialog = ref(false)
const searchKeyword = ref('')
const addForm = ref({
  configKey: '',
  configValue: '',
  description: ''
})
const addLoading = ref(false)

const filteredList = computed(() => {
  if (!searchKeyword.value.trim()) return list.value
  const keyword = searchKeyword.value.toLowerCase()
  return list.value.filter(item =>
    item.configKey.toLowerCase().includes(keyword) ||
    (item.description?.toLowerCase().includes(keyword))
  )
})

const stats = computed(() => ({
  total: list.value.length,
  sensitive: list.value.filter(item =>
    ['password', 'secret', 'token', 'api_key', 'key'].some(k =>
      item.configKey.toLowerCase().includes(k)
    )
  ).length
}))

async function load() {
  loading.value = true
  try {
    list.value = await getConfigList()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function startEdit(row: SysConfigItem) {
  editingKey.value = row.configKey
  editValue.value = row.configValue ?? ''
}

function cancelEdit() {
  editingKey.value = null
  editValue.value = ''
}

async function saveEdit() {
  const key = editingKey.value
  if (!key) return
  try {
    await updateConfig(key, { configValue: editValue.value })
    ElMessage.success('已保存')
    cancelEdit()
    await load()
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  }
}

function openAddDialog() {
  addForm.value = { configKey: '', configValue: '', description: '' }
  showAddDialog.value = true
}

async function submitAdd() {
  if (!addForm.value.configKey.trim()) {
    ElMessage.warning('请输入配置键')
    return
  }
  addLoading.value = true
  try {
    await createConfig({
      configKey: addForm.value.configKey.trim(),
      configValue: addForm.value.configValue || undefined,
      description: addForm.value.description.trim() || undefined
    })
    ElMessage.success('添加成功')
    showAddDialog.value = false
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 409) {
      ElMessage.error('配置键已存在')
    } else {
      ElMessage.error(e instanceof Error ? e.message : '添加失败')
    }
  } finally {
    addLoading.value = false
  }
}

function isSensitiveKey(key: string): boolean {
  return ['password', 'secret', 'token', 'api_key', 'key'].some(k =>
    key.toLowerCase().includes(k)
  )
}

onMounted(load)
</script>

<template>
  <div class="config-page">
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">配置管理</h1>
        <p class="page-desc">管理系统运行时配置参数，支持动态调整无需重启服务</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增配置
        </el-button>
        <el-button :loading="loading" @click="load">
          <el-icon class="mr-1"><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon :size="20"><Setting /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">配置总数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon sensitive">
          <el-icon :size="20"><Lock /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stats.sensitive }}</span>
          <span class="stat-label">敏感配置</span>
        </div>
      </div>
    </div>

    <div class="config-card">
      <div class="card-toolbar">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索配置键或描述..."
            clearable
            :prefix-icon="Search"
          />
        </div>
        <div class="result-count">
          共 <span class="count">{{ filteredList.length }}</span> 项配置
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredList"
        stripe
        class="config-table"
        row-key="id"
      >
        <el-table-column prop="configKey" label="配置键" min-width="220">
          <template #default="{ row }">
            <div class="key-cell">
              <el-icon v-if="isSensitiveKey(row.configKey)" class="sensitive-icon">
                <Lock />
              </el-icon>
              <span class="key-text">{{ row.configKey }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="配置值" min-width="320">
          <template #default="{ row }">
            <template v-if="editingKey === row.configKey">
              <div class="edit-mode">
                <el-input
                  v-model="editValue"
                  type="textarea"
                  :autosize="{ minRows: 2, maxRows: 6 }"
                  placeholder="配置值"
                  class="edit-input"
                />
                <div class="edit-actions">
                  <el-button type="primary" size="small" @click="saveEdit">
                    <el-icon class="mr-1"><Check /></el-icon>
                    保存
                  </el-button>
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="value-cell">
                <code class="value-text">{{ row.configValue ?? '-' }}</code>
                <el-button type="primary" link size="small" class="edit-btn" @click="startEdit(row)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span class="description-text">{{ row.description ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" align="center">
          <template #default="{ row }">
            <span class="time-text">{{ row.updatedAt ?? '-' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="showAddDialog"
      title="新增配置"
      width="520px"
      :close-on-click-modal="false"
      class="add-dialog"
    >
      <el-form label-width="80px" class="add-form">
        <el-form-item label="配置键" required>
          <el-input
            v-model="addForm.configKey"
            placeholder="请输入配置键，如 app.timeout"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input
            v-model="addForm.configValue"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="请输入配置值（可选）"
            class="form-input"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="addForm.description"
            placeholder="请输入配置描述，说明该配置的用途"
            class="form-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" :loading="addLoading" @click="submitAdd">
            <el-icon v-if="!addLoading" class="mr-1"><Plus /></el-icon>
            确定添加
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Plus, Refresh, Search, Edit, Check, Lock, Setting } from '@element-plus/icons-vue'
export default {
  components: { Plus, Refresh, Search, Edit, Check, Lock, Setting }
}
</script>

<style scoped>
.config-page {
  min-height: 100%;
  background: #f5f7fa;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-content {
  flex: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.page-desc {
  margin: 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.mr-1 {
  margin-right: 4px;
}

.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-width: 160px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.stat-icon.sensitive {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 2px;
}

.config-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
}

.search-box {
  width: 280px;
}

.result-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.count {
  font-weight: 600;
  color: #667eea;
}

.config-table {
  width: 100%;
}

.key-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sensitive-icon {
  color: #f5576c;
  flex-shrink: 0;
}

.key-text {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

.value-cell {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.value-text {
  flex: 1;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  color: #4b5563;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-all;
  line-height: 1.5;
}

.edit-btn {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
}

.config-table :deep(.el-table__row:hover) .edit-btn {
  opacity: 1;
}

.edit-mode {
  width: 100%;
}

.edit-input {
  margin-bottom: 8px;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.description-text {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.5;
}

.time-text {
  font-size: 0.8125rem;
  color: #9ca3af;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.add-dialog :deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  margin: 0;
}

.add-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  color: #1f2937;
}

.add-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.add-form {
  margin: 0;
}

.form-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-table) {
  --el-table-header-bg-color: #f9fafb;
  --el-table-header-text-color: #6b7280;
  --el-table-row-hover-bg-color: #faf5ff;
}

:deep(.el-table th.el-table__cell) {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #667eea;
  --el-button-border-color: #667eea;
  --el-button-hover-bg-color: #5a67d8;
  --el-button-hover-border-color: #5a67d8;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .config-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .stats-row {
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
  }

  .card-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }
}
</style>
