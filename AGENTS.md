## 项目规则

- 运行 shell 命令前先读取 `RTK.md`；所有 shell 命令必须加 `rtk` 前缀。
- 代码修改、代码审查或实现规划前，只读取 `docs/experience/README.md` 这一份经验手册；按手册列出命中的经验 ID。
- 编码前列出命中的经验 ID；编辑后检查本次改动是否违反命中的经验。
- 代码生成或修改后按三层策略运行校验：
  - 先用 `rtk git diff --name-only` 识别本次涉及路径，再映射到 workspace：`apps/user-web` -> `@ff-ai-frontend/user-web`，`apps/admin-web` -> `@ff-ai-frontend/admin-web`，`packages/api` -> `@ff-ai-frontend/api`，`packages/components` -> `@ff-ai-frontend/components`，`packages/dictionaries` -> `@ff-ai-frontend/dictionaries`，`packages/utils` -> `@ff-ai-frontend/utils`。
  - 日常代码改动只运行涉及 workspace 的校验，例如 `rtk pnpm --filter @ff-ai-frontend/api --filter @ff-ai-frontend/user-web --filter @ff-ai-frontend/admin-web lint` 和对应 `typecheck`。
  - 修改共享包时同时校验直接受影响应用；修改 `packages/api`、`packages/components`、`packages/dictionaries`、`packages/utils` 后，按实际引用关系补跑 `apps/user-web` 和/或 `apps/admin-web`。
  - 修改根配置、锁文件、工具链、跨 workspace 公共规则，或准备提交前，运行 `rtk npm run lint` 和 `rtk npm run typecheck` 全量校验。
- `AGENTS.md` 只放常开操作规则；长期有效的 AI 编码经验放入 `docs/experience/`，维护规范见 `docs/experience/authoring.md`。
- 用户在当前提示中明确写出精确 Skill 名称时，才使用用户安装的自定义 Skill。

@RTK.md
