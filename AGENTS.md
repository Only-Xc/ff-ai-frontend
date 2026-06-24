## 项目规则

- 运行 shell 命令前先读取 `RTK.md`；所有 shell 命令必须加 `rtk` 前缀。
- 代码修改、代码审查或实现规划前，先读取 `docs/experience/README.md`；再按任务信号只读取命中的 `docs/experience/topics/*.md`。
- 经验读取默认控制为入口 + 1 个主 topic；跨领域任务最多补读 1 个关联 topic；只应用当前任务相关经验。
- 代码生成或修改后优先运行 `rtk npm run lint` 和 `rtk npm run typecheck`。
- `AGENTS.md` 只放常开操作规则；长期有效的 AI 编码经验放入 `docs/experience/`，维护规范见 `docs/experience/authoring.md`。
- 用户在当前提示中明确写出精确 Skill 名称时，才使用用户安装的自定义 Skill。

@RTK.md
