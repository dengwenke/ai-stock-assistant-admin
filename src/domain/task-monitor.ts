import type { ScheduledTaskItem } from '@/api/types'

export interface MonitoredTaskDefinition {
  taskKey: string
  title: string
  description: string
  llmTaskType?: string
  category: 'data-sync' | 'outbox' | 'indicator' | 'notice'
}

export interface TaskTypeOption {
  label: string
  value: string
}

export const SCHEDULED_TASKS: MonitoredTaskDefinition[] = [
  {
    taskKey: 'cninfo.notice.sync',
    title: '巨潮公告同步',
    description: '从巨潮资讯增量拉取最新公告数据。',
    category: 'data-sync',
  },
  {
    taskKey: 'tushare.daily.sync',
    title: 'Tushare 日线同步',
    description: '从 Tushare 拉取日线行情数据。',
    category: 'data-sync',
  },
  {
    taskKey: 'tushare.stock.basic.sync',
    title: 'Tushare 股票基础同步',
    description: '从 Tushare 拉取股票基本信息与每日指标。',
    category: 'data-sync',
  },
  {
    taskKey: 'gain.track.scan',
    title: '涨跌追踪扫描',
    description: '扫描涨幅跟踪记录，更新 T/T+3/T+10 涨幅。',
    category: 'indicator',
  },
  {
    taskKey: 'GainTrackFillTask',
    title: '涨跌追踪补全',
    description: '补全涨跌追踪数据，保障后续分析输入完整性。',
    llmTaskType: 'GainTrackFillTask',
    category: 'indicator',
  },
  {
    taskKey: 'notice.t.date.update',
    title: '公告 T 日更新',
    description: '根据发布时间与交易日历回填公告 T 日。',
    category: 'notice',
  },
]

export const DRIVER_TASKS: MonitoredTaskDefinition[] = [
  {
    taskKey: 'outbox.dispatch',
    title: 'Outbox 事件分发',
    description: '分发待处理的 Outbox 领域事件，触发公告分析等后续流程。',
    category: 'outbox',
  },
  {
    taskKey: 'outbox.archive.cleanup',
    title: 'Outbox 归档清理',
    description: '清理已发布的 Outbox 事件，释放存储空间。',
    category: 'outbox',
  },
  {
    taskKey: 'outbox.metrics.snapshot',
    title: 'Outbox 指标采集',
    description: '采集 Outbox 可观测指标，用于监控告警。',
    category: 'outbox',
  },
]

export const MONITORED_TASKS: MonitoredTaskDefinition[] = [...SCHEDULED_TASKS, ...DRIVER_TASKS]

export const SCHEDULED_TASK_KEY_SET = new Set(SCHEDULED_TASKS.map((t) => t.taskKey))
export const DRIVER_TASK_KEY_SET = new Set(DRIVER_TASKS.map((t) => t.taskKey))
export const MONITORED_TASK_KEY_SET = new Set(MONITORED_TASKS.map((t) => t.taskKey))

export const MONITORED_TASK_TYPE_OPTIONS: TaskTypeOption[] = MONITORED_TASKS
  .filter((t) => Boolean(t.llmTaskType))
  .map((t) => ({
    label: `${t.title} (${t.llmTaskType})`,
    value: t.llmTaskType as string,
  }))

const SCHEDULED_TASK_ORDER = new Map(
  SCHEDULED_TASKS.map((task, index) => [task.taskKey, index] as const)
)

export function sortScheduledTasks(tasks: ScheduledTaskItem[]): ScheduledTaskItem[] {
  return [...tasks].sort((a, b) => {
    const aOrder = SCHEDULED_TASK_ORDER.get(a.taskKey)
    const bOrder = SCHEDULED_TASK_ORDER.get(b.taskKey)
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
    if (aOrder !== undefined) return -1
    if (bOrder !== undefined) return 1
    return a.taskKey.localeCompare(b.taskKey)
  })
}

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  'data-sync': '数据同步',
  'outbox': 'Outbox',
  'indicator': '指标计算',
  'notice': '公告处理',
}

export const TASK_CATEGORY_COLORS: Record<string, string> = {
  'data-sync': '#409eff',
  'outbox': '#67c23a',
  'indicator': '#e6a23c',
  'notice': '#909399',
}
