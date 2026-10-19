# 前端共享包

这些包仅包含工作区描述与源码占位，尚未声明导出或编译产物。

| 包 | 职责 |
|---|---|
| `@diwork/ui` | 通用组件、样式与设计令牌，不依赖业务请求 |
| `@diwork/features` | 工作台、计划、任务与工作记录的页面及业务逻辑 |
| `@diwork/api-client` | HTTP 请求、错误处理、API 契约适配 |
| `@diwork/types` | 前端共享类型，不依赖 UI 或运行时平台 |
| `@diwork/platform` | 浏览器 / 桌面的能力接口与适配实现 |

依赖方向：应用入口 → features → ui / api-client / platform / types。禁止共享包反向依赖应用入口。API 接入后明确契约生成方式，避免手工维护相互冲突的数据类型。
