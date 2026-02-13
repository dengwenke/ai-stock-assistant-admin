import axios from 'axios'
import { API_BASE, STORAGE_KEYS } from '@/constants'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ScheduledTaskItem,
  ScheduledTaskUpdateRequest,
  LlmConfigResponse,
  LlmConfigRequest,
  LlmRequestLogItem,
  LlmLogPageResult,
  SysConfigItem,
  SysConfigUpdateRequest,
} from './types'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalError?: boolean
  }
}

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
  headers: { 'Content-Type': 'application/json' },
})

function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN)
}

client.interceptors.request.use((config) => {
  const t = getStoredToken()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status
    const isLogin = err.config?.url?.includes('/admin/auth/login')
    if ((status === 401 || status === 403) && !isLogin) {
      useAuthStore().clearAuth()
      if (router.currentRoute.value.name !== 'login') {
        router.replace({
          name: 'login',
          query: { from: router.currentRoute.value.fullPath },
        })
      }
    }
    return Promise.reject(err)
  }
)

/** 管理端登录（后端直接返回 { success, username, token }） */
export async function adminLogin(req: AdminLoginRequest): Promise<AdminLoginResponse> {
  const res = await client.post<AdminLoginResponse>('/admin/auth/login', req, {
    skipGlobalError: true,
  })
  const data = res.data
  if (!data.success || !data.token) {
    throw new Error('登录失败')
  }
  return data
}

/** 管理端登出 */
export async function adminLogout(): Promise<void> {
  await client.post('/admin/auth/logout')
}

/** 定时任务列表 */
export async function getScheduledTaskList(): Promise<ScheduledTaskItem[]> {
  const res = await client.get<ScheduledTaskItem[]>('/admin/scheduled-task')
  return res.data ?? []
}

/** 定时任务部分更新 */
export async function updateScheduledTask(
  taskKey: string,
  body: ScheduledTaskUpdateRequest
): Promise<void> {
  await client.patch(`/admin/scheduled-task/${encodeURIComponent(taskKey)}`, body)
}

/** 刷新调度（使配置生效） */
export async function refreshScheduledTasks(): Promise<void> {
  await client.post('/admin/scheduled-task/refresh')
}

/** 删除指定定时任务配置 */
export async function deleteScheduledTask(taskKey: string): Promise<void> {
  await client.delete(`/admin/scheduled-task/${encodeURIComponent(taskKey)}`)
}

/** 立即执行指定任务 */
export async function runScheduledTask(taskKey: string): Promise<void> {
  await client.post('/admin/scheduled-task/run', null, {
    params: { taskKey },
  })
}

/** 获取 LLM 配置 */
export async function getLlmConfig(): Promise<LlmConfigResponse> {
  const res = await client.get<LlmConfigResponse>('/admin/llm/config')
  return res.data ?? { apiUrl: '', modelId: '', accounts: [] }
}

/** 保存 LLM 配置 */
export async function saveLlmConfig(body: LlmConfigRequest): Promise<void> {
  await client.put('/admin/llm/config', body)
}

/** LLM 调用日志分页 */
export async function getLlmLogPage(params: {
  page?: number
  size?: number
  taskType?: string
}): Promise<LlmLogPageResult> {
  const res = await client.get<LlmLogPageResult>('/admin/llm/logs', { params })
  const data = res.data
  return {
    list: data?.list ?? [],
    total: data?.total ?? 0,
    pages: data?.pages ?? 0,
  }
}

/** LLM 调用日志详情 */
export async function getLlmLogById(id: number): Promise<LlmRequestLogItem> {
  const res = await client.get<LlmRequestLogItem>(`/admin/llm/logs/${id}`)
  return res.data
}

/** 系统配置列表（全部） */
export async function getConfigList(): Promise<SysConfigItem[]> {
  const res = await client.get<SysConfigItem[]>('/admin/config')
  return res.data ?? []
}

/** 系统配置单条更新 */
export async function updateConfig(
  configKey: string,
  body: SysConfigUpdateRequest
): Promise<void> {
  await client.patch(
    `/admin/config/${encodeURIComponent(configKey)}`,
    body
  )
}

export { client }
