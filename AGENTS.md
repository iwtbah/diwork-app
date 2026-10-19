# AI 编码协作规范

适用于本仓库；用户明确指令优先，子目录约定补充对应范围。

## 工作方式

- 默认使用中文沟通，代码标识符使用英文。
- 开始前检查工作区，保留已有改动；按任务阅读 `README.md`、`docs/product.md`、`docs/technical.md` 和 `docs/mvp.md`。
- 产品规则以 `docs/product.md` 为准，技术方案在 `docs/technical.md` 维护，验收在 `docs/mvp.md` 维护；不在各目录重复编写说明。
- 按实际需要新增目录、依赖与文档，避免空模板、重复索引和提前搭建的治理流程。
- 当前只有项目骨架，不将规划、空目录或结构检查描述为已实现的功能。

## 代码边界

- `apps/web`、`apps/desktop` 仅组装入口；共享业务放 `packages/features`，通用组件放 `packages/ui`，请求放 `packages/api-client`，类型放 `packages/types`，平台能力放 `packages/platform`。
- 共享包不反向依赖应用入口；UI 不访问业务 API，共享业务不直接依赖 Tauri。
- `services/backend` 采用 Spring Boot 单体；客户端通过 API 访问数据。
- 数据模型放 `database/schema`，迁移在 `database/migrations` 唯一维护，接入后端时确定打包方式；原型放 `design/prototypes`。
- 项目技能放 `.agents/skills/<name>/SKILL.md`，只在任务相关时加载；技能不替代用户授权。

## 验证与交付

- 修改后运行 `npm run check`；应用接入后补充受影响模块的真实构建与必要测试。纯文档修改不新增单元测试。
- 初始化应用时验证并锁定依赖，提交适用锁文件与配置示例。
- 不提交密钥、真实用户数据、数据库文件、日志或构建产物；不强推或覆盖远端历史。
- 提交前检查 diff，保持修改范围；交付时简述改动、验证结果与未完成事项。
