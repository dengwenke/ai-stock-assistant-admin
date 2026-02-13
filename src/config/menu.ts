/**
 * 管理后台菜单配置（前端配置驱动，对应现有 admin 功能）。
 * 后端暂无菜单表接口，此处集中维护菜单与路由、权限标识的映射；
 * 若后续后端提供菜单/功能接口，可改为从接口拉取并与此配置合并或替换。
 */

export interface MenuItem {
  /** 唯一标识，与路由 name 一致 */
  id: string
  /** 显示名称 */
  title: string
  /** 路由路径 */
  path: string
  /** 图标名（Element Plus 图标组件名） */
  icon?: string
  /** 子菜单 */
  children?: MenuItem[]
  /** 排序（数字越小越靠前） */
  order?: number
}

/** 侧栏菜单列表：对应「功能管理」中的可访问功能 */
export const SIDEBAR_MENUS: MenuItem[] = [
  {
    id: 'dashboard',
    title: '仪表盘',
    path: '/',
    icon: 'Odometer',
    order: 0,
  },
  {
    id: 'scheduled-task',
    title: '定时任务',
    path: '/scheduled-task',
    icon: 'Timer',
    order: 10,
  },
  {
    id: 'sys-config',
    title: '配置管理',
    path: '/sys-config',
    icon: 'Key',
    order: 18,
  },
  {
    id: 'llm-config',
    title: 'LLM 配置',
    path: '/llm-config',
    icon: 'Setting',
    order: 20,
  },
  {
    id: 'llm-logs',
    title: 'LLM 调用日志',
    path: '/llm-logs',
    icon: 'Document',
    order: 30,
  },
].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))

/** 根据 path 查找菜单项 */
export function findMenuByPath(path: string): MenuItem | undefined {
  for (const m of SIDEBAR_MENUS) {
    if (m.path === path || (path !== '/' && m.path !== '/' && path.startsWith(m.path))) {
      return m
    }
  }
  return undefined
}

/** 根据 id 查找菜单项 */
export function findMenuById(id: string): MenuItem | undefined {
  return SIDEBAR_MENUS.find((m) => m.id === id)
}
