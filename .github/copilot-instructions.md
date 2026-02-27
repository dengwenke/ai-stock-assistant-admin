# AI Stock Assistant Admin - Copilot 指南

## 范围
- 管理端 Vue 3 + Vite 应用位于 [ai-stock-assistant-admin](ai-stock-assistant-admin/)，对接后端 `/api/admin/**` 接口（见 [README.md](ai-stock-assistant-admin/README.md)）。

## 前端约定与架构
- **技术栈**：Vue 3 Composition API + `<script setup lang="ts">` + Element Plus + Pinia + Vue Router 4。
- **命名规范**：Vue 组件 `PascalCase`（如 `XxxView.vue`），目录/路由/工具函数 `kebab-case`，类型/接口 `PascalCase`，Composables `useXxx.ts`。禁止中文或混合命名。
- **目录职责**：
  - `src/views/`：路由页面组件（与路由 1:1 对应）。
  - `src/components/`：可复用 UI 组件（按领域分子目录）。
  - `src/layouts/`：页面布局。
  - `src/api/`：`client.ts` 统一封装 Axios 请求，`types.ts` 定义 DTO 类型。
  - `src/stores/`：Pinia 全局状态（按领域拆分）。
  - `src/composables/`：无全局单例的组合式函数。
  - `src/utils/`：纯函数工具；`src/constants/`：应用常量。
- **路由与菜单**：由前端配置驱动（`src/config/menu.ts`）。所有 props/emits 必须带类型。

## 认证与接口
- 登录：`POST /api/admin/auth/login`，成功返回 `token`（见 [README.md](ai-stock-assistant-admin/README.md)）。
- 请求头：`Authorization: Bearer <token>`。
- Token 存于 `localStorage`，键名 `stock_assistant_admin_token`。

## 设计系统与 CSS
- 优先使用 Element Plus 组件。
- 遵循统一的设计 Token（如 `--control-h`, `--radius-md`, `--bg-card`），禁止硬编码颜色、间距、圆角。

## 开发流程
- `npm run dev` 启动开发服务器，默认端口 5174；`/api` 代理到 `http://localhost:8000`。
- `npm run build` 输出 `dist/`，用于静态托管。
