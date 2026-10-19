# diwork-app

个人工作管理平台：工作计划 → 任务执行 → 工作记录 → 工作复盘。

当前处于项目骨架阶段，以下功能为规划，尚未实现。

## 产品功能

| 模块 | 主要功能 |
|---|---|
| 工作台 | 今日任务、本周日历、任务汇总、完成率、逾期与临近截止提醒 |
| 工作计划 | 日 / 周 / 月周期计划、一次性计划、目标计划、子任务拆解、发生日期预览与规则启停 |
| 任务中心 | 统一管理周期、目标和临时任务，支持优先级、状态、日期、进度与筛选 |
| 工作记录 | 关联任务或独立记录，保存内容、成果、卡点、耗时与下一步，追踪进度历史 |

一期优先交付 Web。桌面端、甘特图、任务自动化、多用户与 AI Agent 后续推进。

## 技术栈

| 类别 | 选型 |
|---|---|
| Web | React、TypeScript、Vite |
| UI | Tailwind CSS、shadcn/ui、Motion、Lucide React |
| 路由与状态 | React Router、TanStack Query、Zustand |
| 表单 | React Hook Form、Zod |
| 桌面端 | Tauri 2 |
| 后端 | Java、Spring Boot、Spring Scheduling |
| 数据库 | SQLite |
| 数据迁移 | Flyway（待验证 SQLite 支持） |
| 部署 | Nginx、Spring Boot JAR |
| 前端工作区 | pnpm workspace |

依赖版本与环境兼容性在应用初始化时验证并锁定。

## 目录

```text
apps/web/             # Web 前端
apps/desktop/         # 桌面端
packages/             # 共享 UI、业务、API、类型与平台适配
services/backend/     # 后端
database/             # 数据模型与迁移
design/prototypes/    # 产品原型
docs/                 # 产品、技术与 MVP 文档
.agents/skills/       # 项目 AI Skills
scripts/              # 维护脚本
```

## 文档职责

| 文件 | 内容 |
|---|---|
| README.md | 产品功能、技术栈与项目导航 |
| [AGENTS.md](./AGENTS.md) | AI 编码协作与验证规则 |
| [docs/product.md](./docs/product.md) | 详细业务模型、字段与产品规则 |
| [docs/technical.md](./docs/technical.md) | 技术方案、架构与部署约束 |
| [docs/mvp.md](./docs/mvp.md) | 一期实施顺序、待确认事项与验收清单 |
