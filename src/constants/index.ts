/**
 * 管理后台常量：Storage 键、API 基础路径等。
 */

export const STORAGE_KEYS = {
  /** 管理端 JWT，与用户端区分 */
  ADMIN_TOKEN: 'stock_assistant_admin_token',
  ADMIN_USERNAME: 'stock_assistant_admin_username',
} as const

/** API 基础路径（与 vite proxy 一致，请求 /api/admin/*） */
export const API_BASE = '/api'
