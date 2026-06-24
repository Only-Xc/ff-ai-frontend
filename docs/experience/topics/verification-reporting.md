# 验证与汇报

用途：处理经验清单、dirty worktree、验证失败归因、mock 主流程和最终汇报。

读取信号：experience checklist、dirty worktree、verification warning、mock workflow、final reporting。

关联 topic：按被验证对象选择对应 topic。

## 经验

### EXP-VERIFY-001 复杂修改前列经验检查点

- 触发：开始复杂代码修改、代码审查、实现规划或跨文件文档调整。
- 经验：编辑前把触发的经验 ID 提取成简短检查点，验证阶段按检查点回看。
- 检查：读取入口；读取命中 topic；列出经验 ID；识别必要关联 topic。
- 关联：按主任务读取对应 topic。

### EXP-VERIFY-002 区分既有状态和本次改动

- 触发：工作区已有改动，验证命令出现 warning、失败、快照差异或环境依赖问题。
- 经验：分别记录本次编辑、用户既有改动和环境问题；归因建立在文件变更或验证证据上。
- 检查：`git status --short`；本次触碰文件；验证输出；失败是否来自依赖、网络、缓存或既有 warning。
- 关联：按验证对象读取对应 topic。

### EXP-VERIFY-003 mock 覆盖主流程状态变化

- 触发：本地开发依赖 mock 数据、后端接口暂缺，或主流程需要前端独立验证。
- 经验：mock 覆盖列表、详情、操作成功、失败反馈和操作后的状态变化。
- 检查：列表刷新；详情数据；创建/更新/删除或状态流转；操作后 item 归属变化；失败态和 loading 态。
- 关联：操作后状态归属变化读 `state-data-flow`。
