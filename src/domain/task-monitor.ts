import type { ScheduledTaskItem } from '@/api/types'

export interface MonitoredTaskDefinition {
  taskKey: string
  title: string
  description: string
  llmTaskType?: string
}

export interface TaskTypeOption {
  label: string
  value: string
}

export const MONITORED_TASKS: MonitoredTaskDefinition[] = [
  {
    taskKey: 'GainTrackFillTask',
    title: '涨跌追踪补全',
    description: '补全涨跌追踪数据，保障后续分析输入完整性。',
    llmTaskType: 'GainTrackFillTask',
  },
]

export const MONITORED_TASK_KEY_SET = new Set(MONITORED_TASKS.map((t) => t.taskKey))

export const MONITORED_TASK_TYPE_OPTIONS: TaskTypeOption[] = MONITORED_TASKS
  .filter((t) => Boolean(t.llmTaskType))
  .map((t) => ({
    label: `${t.title} (${t.llmTaskType})`,
    value: t.llmTaskType as string,
  }))

const MONITORED_TASK_ORDER = new Map(
  MONITORED_TASKS.map((task, index) => [task.taskKey, index] as const)
)

export function sortScheduledTasks(tasks: ScheduledTaskItem[]): ScheduledTaskItem[] {
  return [...tasks].sort((a, b) => {
    const aOrder = MONITORED_TASK_ORDER.get(a.taskKey)
    const bOrder = MONITORED_TASK_ORDER.get(b.taskKey)
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder
    if (aOrder !== undefined) return -1
    if (bOrder !== undefined) return 1
    return a.taskKey.localeCompare(b.taskKey)
  })
}
