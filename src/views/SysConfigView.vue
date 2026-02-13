<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getConfigList, updateConfig } from '@/api/client'
import type { SysConfigItem } from '@/api/types'

const list = ref<SysConfigItem[]>([])
const loading = ref(false)
const editingKey = ref<string | null>(null)
const editValue = ref('')

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

onMounted(load)
</script>

<template>
  <div class="sys-config-view">
    <div class="toolbar">
      <h2 class="page-title">配置管理</h2>
      <el-button :loading="loading" @click="load">刷新</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe style="width: 100%">
      <el-table-column prop="configKey" label="配置键" min-width="220" />
      <el-table-column label="配置值" min-width="320">
        <template #default="{ row }">
          <template v-if="editingKey === row.configKey">
            <el-input
              v-model="editValue"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="配置值"
              style="width: 100%"
            />
            <div class="edit-actions">
              <el-button type="primary" size="small" @click="saveEdit">保存</el-button>
              <el-button size="small" @click="cancelEdit">取消</el-button>
            </div>
          </template>
          <template v-else>
            <span class="config-value">{{ row.configValue ?? '-' }}</span>
            <el-button type="primary" link size="small" @click="startEdit(row)">编辑</el-button>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="updatedAt" label="更新时间" width="170" />
    </el-table>
  </div>
</template>

<style scoped>
.sys-config-view {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.config-value {
  font-family: ui-monospace, monospace;
  font-size: 0.8125rem;
  word-break: break-all;
  margin-right: 8px;
}

.edit-actions {
  margin-top: 8px;
}
</style>
