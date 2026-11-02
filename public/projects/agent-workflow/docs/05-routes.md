# 路线与角色协议

V3.2.0 将路线从文档描述提升为机器可校验的任务事实。TaskBuilder 根据任务目标、范围与交付物选择路线；Engine 只核对已记录的路线及其证据是否一致，不根据自然语言需求代替 TaskBuilder 分类。

## 三条路线

| 路线 | Contract 约束 | 主要交付与审查路径 |
| --- | --- | --- |
| `NORMAL` | `NOT_REQUIRED` | Coder 实现 → Cleaner 独立审查 |
| `COMPLEX` | 独立 Contract 审批 | Coder 实现 → Cleaner 独立审查 |
| `ARCHITECT` | 独立 Contract 审批 | Architect 结构交付 → OwnerGate 结构验证与人工决策 |

`NORMAL` 不能携带独立 Contract 状态；`COMPLEX` 和 `ARCHITECT` 不能用 `NOT_REQUIRED` 跳过审批。路线不是按文件数或工作量命名的复杂度分档。

## R-1 至 R-4

1. 路线枚举必须合法。
2. 路线必须与 Contract 状态一致。
3. `state.yaml.route` 必须与 `task.md` 的 `## Complexity` 一致。
4. Contract Approval 所记录的路线必须仍有效，Review 证据形态也必须符合当前路线。

`state.yaml.route` 是机器权威源，但供人阅读的任务文档不能与之矛盾。模板里保留 `NORMAL / COMPLEX / ARCHITECT` 三选一占位不算完成声明。历史任务缺少 route 时，五个 Gate 保留兼容行为，不推断路线；独立 `route` 命令默认 strict，历史任务需显式传 `--allow-legacy`。

来源：[route.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/route.go#L11) · [route_test.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/route_test.go#L294)

## 路线变更使旧证据失效

改变路线需要 Owner 要求，并重新形成相应的批准和交付证据。把 `COMPLEX` 改成 `NORMAL` 以绕过审批，或将结构快照直接用于普通实现审查，都不能只靠改状态字段完成。

ARCHITECT 的 Review Target 需要绑定实际结构快照。Engine 会读取提交内容与路径触达事实进行核对，但不认证提交作者、会话身份或 Owner 指令的真实性。

## 路线推导与旧任务

3.4.0 的启动协议要求角色从 Task 推导阶段、模式与入口 Gate。它对路线缺失、状态矛盾及无法匹配阶段表的组合采取阻塞处理；旧任务不通过猜测路线自动升级。该协议约束与 Engine 对缺少 route 的历史任务兼容行为是两个层次，不能混为一谈。

Owner 拒绝后的退回对象，必须读取 `owner-decision.md` 的 `Return To`；字段缺失时停止推导。角色输入与推导结果冲突也不能静默切换角色。

具体启动步骤、四字段输出及失败记录见[独立会话与交接](09-sessions.md)。

来源：[WorkflowAgentDirective.md §2](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowAgentDirective.md#L30) · [V3.4.0 Release Notes](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.4.0.md)
