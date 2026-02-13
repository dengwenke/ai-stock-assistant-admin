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

## 认证

- 登录：`POST /api/admin/auth/login`（username + password），返回 `token`。
- 请求头：`Authorization: Bearer <token>`。
- Token 存于 `localStorage`（键：`stock_assistant_admin_token`），与用户端区分。

## 构建

```bash
npm run build
npm run preview
```
