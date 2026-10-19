# diwork-app

个人工作管理平台：工作计划 → 任务执行 → 工作记录 → 工作台复盘。

当前阶段是**项目结构初始化**，尚未实现可运行的 Web、桌面端或后端服务。技术方向沿用已有方案：React + TypeScript + Vite、Tauri 2、Spring Boot + Java、SQLite；具体依赖版本及部署兼容性将在应用初始化时验证并锁定。

## 目录导航

```text
diwork-app/
├── AGENTS.md                  # AI 编码协作规则
├── .agents/skills/            # 项目专用 AI Skills
├── .github/                   # CI、Issue 与 PR 模板
├── apps/
│   ├── web/                   # React Web 入口（一期）
│   └── desktop/               # Tauri 外壳（阶段二）
├── packages/
│   ├── ui/                    # 共享 UI 与设计令牌
│   ├── features/              # 共享业务页面与逻辑
│   ├── api-client/            # API 客户端
│   ├── types/                 # 共享 TypeScript 类型
│   └── platform/              # Web / 桌面平台适配
├── services/backend/          # Spring Boot 单体服务
├── database/                  # 数据模型、迁移、演示数据
├── design/                    # 原型、设计规范、设计资源
├── docs/
│   ├── product/               # 产品文档索引
│   ├── architecture/          # 架构说明与 ADR
│   ├── api/                   # API 契约约定
│   ├── mvp/                   # MVP 范围、里程碑、验收
│   └── development/           # 开发与发布说明
├── infra/                     # Nginx、部署与运维预留
├── tests/                     # 跨模块集成及端到端测试预留
└── scripts/                   # 项目维护脚本
```

前端采用 pnpm workspace；Java 和 Rust 工程分别使用自己的构建工具。MVP 使用标准拼写，AI 协作入口使用工具通用识别的 `AGENTS.md`。

## 开始协作

1. 阅读 [产品规划](./个人工作管理平台_产品功能规划_V1.1.md) 和 [技术方案](./个人工作管理平台_技术选型与部署方案_V1.0.md)。原始文件保留在根目录。
2. 阅读 [协作规则](./AGENTS.md)、[开发指南](./docs/development/README.md) 和 [MVP 计划](./docs/mvp/README.md)。
3. 安装 Node.js 22 或以上，运行 `npm run check`（无需安装依赖），检查目录、工作区、内部文档链接及结构配置。
4. 按 MVP 里程碑初始化可运行应用，再提交依赖版本和锁文件。

当前没有可执行的 `dev`、应用构建或业务测试命令；CI 仅验证仓库骨架。应用接入后必须补充真实构建与测试，不以结构检查代替业务验证。

## 约定与文档

- 原型：[design/prototypes](./design/prototypes/README.md)
- MVP：[范围](./docs/mvp/scope.md)、[里程碑](./docs/mvp/milestones.md)、[验收](./docs/mvp/acceptance.md)
- 架构：[架构导航](./docs/architecture/README.md)、[初始决策](./docs/architecture/decisions/0001-repository-layout.md)
- 数据库：[数据库目录](./database/README.md)
- AI Skills：[编写与使用约定](./.agents/skills/README.md)
- 贡献：[CONTRIBUTING.md](./CONTRIBUTING.md)

许可证由仓库所有者后续确定，本次未添加 LICENSE 文件。
