# 管理后台目录结构说明（Admin）

## 顶层

- `src/`：应用源码
- `public/`：静态资源
- `vite.config.ts`：开发服务与构建配置

## src 目录职责

- `api/`：后端接口调用与类型定义
- `config/`：菜单、常量、可配置项
- `domain/`：领域模型与领域常量（如任务监测定义）
- `layouts/`：应用整体布局壳
- `router/`：路由配置与鉴权守卫
- `stores/`：Pinia 全局状态
- `views/`：路由级页面
- `styles/`：全局样式入口

## 约定

- 新页面：先在 `views/` 建文件，再在 `router/` 注册路由，最后在 `config/menu.ts` 补菜单映射（如需展示）。
- 新接口：先定义 `types.ts`，再在 `client.ts` 增方法，视图中仅调用封装方法。
- 跨页面复用逻辑优先抽到 `domain/` 或 `stores/`，避免在页面间复制。
