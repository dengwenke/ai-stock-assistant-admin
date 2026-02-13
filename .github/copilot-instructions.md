# AI Stock Assistant Admin - Copilot 指南

## 范围
- 管理端 Vue 3 + Vite 应用位于 [ai-stock-assistant-admin](ai-stock-assistant-admin/)，对接后端 `/api/admin/**` 接口（见 [README.md](ai-stock-assistant-admin/README.md)）。

## 前端约定
- 使用 Vue 3 Composition API + `<script setup lang="ts">`，所有 props/emits 必须带类型。
- 页面放在 `src/views/`，布局在 `src/layouts/`，可复用 UI 放在 `src/components/`。
- 路由与菜单由前端配置驱动：菜单配置在 `src/config/menu.ts`。
- 所有 API 请求走 `src/api/client.ts`，类型定义在 `src/api/types.ts`。
- 使用 Pinia 管理登录与全局状态（见 `src/stores/`）。
- 优先使用 Element Plus 组件。

## 认证与接口
- 登录：`POST /api/admin/auth/login`，成功返回 `token`（见 [README.md](ai-stock-assistant-admin/README.md)）。
- 请求头：`Authorization: Bearer <token>`。
- Token 存于 `localStorage`，键名 `stock_assistant_admin_token`。

## 开发流程
- `npm run dev` 启动开发服务器，默认端口 5174；`/api` 代理到 `http://localhost:8000`。
- `npm run build` 输出 `dist/`，用于静态托管。
