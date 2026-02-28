# AGENTS 协作说明（ai-stock-assistant-admin）

## 开始工作前必读

1. `docs/knowledge-base/INDEX.md`
2. `docs/knowledge-base/standards/EXECUTION.md`
3. `README.md`

## 前端实现约束

- 管理端优先使用统一 token（颜色、间距、圆角、字体），避免页面内硬编码重复样式。
- 页面布局遵循 `AdminLayout` 的侧栏 + 顶栏 + 内容区结构，避免新页面自建整体壳。
- 菜单定义与路由保持一一对应：`src/config/menu.ts` 和 `src/router/index.ts` 同步修改。
- API 封装统一走 `src/api/client.ts`，避免在视图层直接发请求。
