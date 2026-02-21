import axios from 'axios'
import { API_BASE, STORAGE_KEYS } from '@/constants'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  ScheduledTaskPageResult,
  ScheduledTaskUpdateRequest,
  LlmRequestLogItem,
  LlmLogPageResult,
  SysConfigItem,
  SysConfigUpdateRequest,
  SysConfigCreateRequest,
  OutboxEventPageResult,
  OutboxMetrics,
  OutboxReplayResult,
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

/** 定时任务分页查询 */
export async function getScheduledTaskPage(params: {
  page?: number
  size?: number
}): Promise<ScheduledTaskPageResult> {
  const res = await client.get<ScheduledTaskPageResult>('/admin/scheduled-task', { params })
  return res.data ?? { list: [], total: 0, page: 1, size: 20, pages: 0 }
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

/** 按任务类型获取最近一条 LLM 调用日志 */
export async function getLatestLlmLogByTaskType(taskType: string): Promise<LlmRequestLogItem | null> {
  const data = await getLlmLogPage({
    page: 1,
    size: 1,
    taskType,
  })
  return data.list[0] ?? null
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

/** 系统配置新增 */
export async function createConfig(body: SysConfigCreateRequest): Promise<void> {
  await client.post('/admin/config', body)
}

/** Outbox 事件分页查询 */
export async function getOutboxEvents(params: {
  page?: number
  size?: number
  status?: string
  eventType?: string
  bizKey?: string
}): Promise<OutboxEventPageResult> {
  const res = await client.get<OutboxEventPageResult>('/admin/outbox/events', { params })
  return res.data ?? { list: [], total: 0, page: 1, size: 20, pages: 0 }
}

/** Outbox 事件重放（按 ID） */
export async function replayOutboxEvents(ids: number[]): Promise<OutboxReplayResult> {
  const res = await client.post<OutboxReplayResult>('/admin/outbox/events/replay', { ids })
  return res.data ?? { matchedCount: 0, resetCount: 0, dryRun: false, policyName: '' }
}

/** Outbox 事件重放（按查询条件） */
export async function replayOutboxByQuery(params: {
  statuses?: string[]
  eventType?: string
  bizKeyLike?: string
  limit?: number
  dryRun?: boolean
}): Promise<OutboxReplayResult> {
  const res = await client.post<OutboxReplayResult>('/admin/outbox/events/replay-by-query', params)
  return res.data ?? { matchedCount: 0, resetCount: 0, dryRun: false, policyName: '' }
}

/** Outbox 事件重放（按策略） */
export async function replayOutboxByPolicy(params: {
  policyName: string
  bizKeyLike?: string
  limit?: number
  dryRun?: boolean
}): Promise<OutboxReplayResult> {
  const res = await client.post<OutboxReplayResult>('/admin/outbox/events/replay-by-policy', params)
  return res.data ?? { matchedCount: 0, resetCount: 0, dryRun: false, policyName: '' }
}

/** Outbox 监控指标 */
export async function getOutboxMetrics(params?: {
  lookbackMinutes?: number
  pendingWarn?: number
  failedWarn?: number
  deadWarn?: number
  processingWarn?: number
}): Promise<OutboxMetrics> {
  const res = await client.get<OutboxMetrics>('/admin/outbox/metrics/overview', { params })
  return res.data ?? {
    pendingCount: 0,
    processingCount: 0,
    failedCount: 0,
    deadCount: 0,
    successInWindow: 0,
    avgProcessTimeMs: 0,
    alertPending: false,
    alertFailed: false,
    alertDead: false,
    alertProcessing: false,
    pendingWarn: 500,
    failedWarn: 50,
    deadWarn: 10,
    processingWarn: 100,
  }
}

export { client }
