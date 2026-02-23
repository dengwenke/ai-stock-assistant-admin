# 管理后台 (stock-assistant-admin)

AI 股票分析助手的管理端前端，与后端 `ai-stock-assistant` 的 `/api/admin/**` 接口对接。

## 技术栈

- Vue 3 + TypeScript
- Vite 6
- Vue Router 4、Pinia
- Element Plus

## 开发

```bash
npm install
npm run dev
```

默认端口 **5174**（与用户端 5173 区分）。API 请求通过 Vite 代理到 `http://localhost:8000`。

## 菜单与功能对应（后端接口）

后端当前**没有**独立的「菜单表」或「功能权限表」接口；菜单由前端配置驱动，对应现有 admin 能力：

| 菜单项       | 路由              | 后端接口 |
|-------------|-------------------|----------|
| 仪表盘      | `/`               | -        |
| 定时任务    | `/scheduled-task` | `GET/PATCH /api/admin/scheduled-task`、`POST .../refresh`、`POST .../run` |
| 配置管理    | `/sys-config`     | `GET /api/admin/config`、`PATCH /api/admin/config/{configKey}` |
| LLM 配置    | `/llm-config`     | `GET/PUT /api/admin/llm/config` |
| LLM 调用日志 | `/llm-logs`      | `GET /api/admin/llm/logs`、`GET .../logs/:id` |

菜单配置见 `src/config/menu.ts`。若后续后端提供菜单/功能接口，可改为从接口拉取并与此配置合并或替换。

## 任务监测架构

- 监测任务统一定义在 `src/domain/task-monitor.ts`（当前已接入 `GainTrackFillTask`）。
- 仪表盘会聚合：
  - 调度状态（`GET /api/admin/scheduled-task`）
  - 最近一次 LLM 执行状态/时间/耗时（`GET /api/admin/llm/logs` 按 `taskType`）
- 定时任务页默认仅展示监测任务，可切换查看全部任务。
- 从仪表盘点击“查看日志”会跳转到 `/llm-logs?taskType=...` 并自动带上筛选条件。

## 认证

- 登录：`POST /api/admin/auth/login`（username + password），返回 `token`。
- 请求头：`Authorization: Bearer <token>`。
- Token 存于 `localStorage`（键：`stock_assistant_admin_token`），与用户端区分。

## 构建

```bash
npm run build
npm run preview
```

## 后端代码风格

- 后端项目使用 **Java 21**，代码风格应使用更新版本的规范以避免警告
- 推荐使用：
  - 较新版本的 Maven 编译器插件（3.13.0+）
  - 启用 `-parameters` 编译器参数
  - 遵循现代 Java 风格指南，如 Google Java Style Guide 或 Alibaba Java Coding Guidelines
- 避免使用已过时的 API 和语法，确保代码在 Java 21 环境下编译无警告
