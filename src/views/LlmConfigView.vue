<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getLlmConfig, saveLlmConfig } from '@/api/client'
import type { LlmConfigResponse, LlmConfigRequest } from '@/api/types'

const loading = ref(false)
const saving = ref(false)
const config = ref<LlmConfigResponse>({
  apiUrl: '',
  modelId: '',
  accounts: [],
})

async function load() {
  loading.value = true
  try {
    config.value = await getLlmConfig()
    if (!config.value.accounts?.length) {
      config.value.accounts = [{ name: '', account: '', apiKey: '', status: 1 }]
    }
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

function addAccount() {
  config.value.accounts = config.value.accounts ?? []
  config.value.accounts.push({ name: '', account: '', apiKey: '', status: 1 })
}

function removeAccount(index: number) {
  config.value.accounts.splice(index, 1)
}

async function save() {
  saving.value = true
  try {
    const body: LlmConfigRequest = {
      apiUrl: config.value.apiUrl || undefined,
      modelId: config.value.modelId || undefined,
      accounts: config.value.accounts?.map((a) => ({
        name: a.name,
        account: a.account,
        apiKey: a.apiKey,
        status: a.status ?? 1,
      })),
    }
    await saveLlmConfig(body)
    ElMessage.success('保存成功')
  } catch (e: unknown) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="llm-config-view" v-loading="loading">
    <h2 class="page-title">LLM 配置</h2>
    <el-form label-width="100px" class="config-form">
      <el-form-item label="API 地址">
        <el-input v-model="config.apiUrl" placeholder="如 https://api.volcengineapi.com" />
      </el-form-item>
      <el-form-item label="模型 ID">
        <el-input v-model="config.modelId" placeholder="模型 ID" />
      </el-form-item>
      <el-form-item label="账号列表">
        <div class="accounts-wrap">
          <div
            v-for="(acc, index) in config.accounts"
            :key="index"
            class="account-item"
          >
            <el-input v-model="acc.name" placeholder="名称" size="default" style="width: 120px" />
            <el-input v-model="acc.account" placeholder="账号" size="default" style="width: 140px" />
            <el-input v-model="acc.apiKey" placeholder="API Key" type="password" show-password size="default" style="flex: 1; min-width: 160px" />
            <el-select v-model="acc.status" placeholder="状态" size="default" style="width: 90px">
              <el-option :value="1" label="启用" />
              <el-option :value="0" label="禁用" />
            </el-select>
            <el-button type="danger" link @click="removeAccount(index)">删除</el-button>
          </div>
          <el-button type="primary" link @click="addAccount">+ 添加账号</el-button>
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.llm-config-view {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  min-height: 200px;
}

.page-title {
  margin: 0 0 20px;
  font-size: 1.125rem;
  font-weight: 600;
}

.config-form {
  max-width: 720px;
}

.accounts-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
</style>
