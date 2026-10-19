# 后端服务

阶段：一期；状态：Spring Boot 工程预留，尚未提供 `pom.xml`、应用入口或 HTTP 接口。

采用 Java + Spring Boot 单体；JDK、Spring Boot、SQLite JDBC 及迁移工具版本在 M1 实测后锁定。建议 Maven Wrapper，以便统一本地与 CI 构建。

```text
src/main/java/        # Java 源码；按业务模块划分职责
src/main/resources/   # 应用配置及构建时打包的资源
src/test/java/        # 业务规则、接口与持久化集成验证
```

按工作计划、周期规则、任务、工作记录、工作台组织业务模块；每个模块再按需要划分接口、应用服务与数据访问。一期避免无必要的微服务拆分。

- 对外 API 统一 `/api` 前缀，契约约定位于 `docs/api`。
- 数据库资源来源统一为 `database/migrations`；构建接入时解决资源打包，禁止复制后分别维护。
- 先验证 SQLite 原生驱动、事务、SQL 方言、幂等生成和迁移兼容性。
- 接入 Spring Scheduling 时具备启动补偿和重复触发幂等能力。
- 不在核心 API 内运行用户自动化脚本。

后端初始化后补充启动、测试、打包、健康检查、配置说明以及真实依赖锁定信息。
