# Web 前端

阶段：一期；状态：预留源码目录，尚无可运行应用。

推荐方向：React + TypeScript + Vite，UI 按技术方案接入 Tailwind CSS、shadcn/ui 等。具体版本在初始化时验证并锁定。

- `src/`：入口、路由组装、Web 配置与浏览器适配。
- `public/`：公开静态资源；不放私有数据或密钥。
- 业务页面优先复用 `packages/features`，组件复用 `packages/ui`。
- 构建产物由 Nginx 托管；业务接口统一通过 `/api`。

应用初始化后补充真实开发、构建、类型检查和测试命令。前端环境变量会进入客户端，不能保存凭证。
