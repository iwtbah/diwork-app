# 架构说明

来源：[技术选型与部署方案 V1.0](../../个人工作管理平台_技术选型与部署方案_V1.0.md)。该文档是推荐方向，环境与依赖兼容性尚待验证。

一期数据流：浏览器 → Nginx（静态资源 / `/api` 反向代理）→ Spring Boot 单实例 → SQLite。阶段二由 Tauri 复用前端共享模块并经 API 访问同一后端。

- [ADR 0001：仓库结构](./decisions/0001-repository-layout.md)
- 前端 workspace 管理 `apps/*` 和 `packages/*`；Java / Rust 使用各自构建工具。
- 数据库迁移唯一来源位于 `database/migrations`，后端构建打包方式待初始化验证。
- MVP 不引入自动化 Runner、多用户权限体系或服务拆分。

后续 ADR 使用递增编号，包含状态、背景、决策、后果和验证条件。未验证的兼容性不得标注成已完成。
