/**
 * 管理后台 API 类型（与后端 admin 接口一致）。
 * 后端 admin 接口直接返回实体/Map，不包一层 ApiResult。
 */

/** 登录请求 */
export interface AdminLoginRequest {
  username: string
  password: string
}

/** 登录成功响应 */
export interface AdminLoginResponse {
  success: boolean
  username: string
  token: string
}

/** 定时任务列表项（统一 cron） */
export interface ScheduledTaskItem {
  id: number
  taskKey: string
  cronExpression: string | null
  enabled: number
  description: string | null
  createTime: string | null
  updateTime: string | null
}

/** 定时任务编辑入参 */
export interface ScheduledTaskUpdateRequest {
  enabled?: number
  cronExpression?: string
  description?: string
}

/** LLM 配置账号项 */
export interface LlmConfigAccountItem {
  name: string
  account: string
  apiKey: string
  status: number | null
}

/** LLM 配置响应 */
export interface LlmConfigResponse {
  apiUrl: string
  modelId: string
  accounts: LlmConfigAccountItem[]
}

/** LLM 配置保存请求 */
export interface LlmConfigRequest {
  apiUrl?: string
  modelId?: string
  accounts?: LlmConfigAccountItem[]
}

/** LLM 请求日志实体（与后端 LlmRequestLogEntity 对应） */
export interface LlmRequestLogItem {
  id?: number
  prompt?: string
  response?: string
  modelType?: string
  accountName?: string
  taskType?: string
  bizKey?: string
  createTime?: string
  requestDurationMs?: number
  inputTokens?: number
  outputTokens?: number
  status?: string
}

/** LLM 日志分页结果 */
export interface LlmLogPageResult {
  list: LlmRequestLogItem[]
  total: number
  pages: number
}

/** 系统配置项（管理端列表） */
export interface SysConfigItem {
  id: number
  configKey: string
  configValue: string | null
  updatedAt: string | null
}

/** 系统配置单条更新入参 */
export interface SysConfigUpdateRequest {
  configValue?: string
}
