# 独立会话与交接

3.4.0 将交接信息收敛为 Task 定位。下一角色不依赖上一会话重新编写的说明书，而是从规范、Task Artifact 和 Git 重建阶段与审查对象。长 `HANDOFF_PROMPT` 已取消，事实的持久化位置成为协议的核心约束。

## 角色名加任务目录

```text
以 CLEANER 角色执行任务：
.agent/tasks/order-validation/
```

新会话按五步启动：读取规范链，读取 Task 内全部现存 Artifact，推导 stage / mode / 入口 Gate，输出开工声明，实际运行入口 Gate。`task.md` 或 `state.yaml` 缺失会阻塞；其他 Artifact 是否需要，取决于已有状态和角色职责。

```text
ROLE: CLEANER
TASK: order-validation
STAGE: REVIEW_PENDING
TARGET: <review.target 完整 SHA>
ENTRY_GATE: <cleaner-start 的实际结果>
```

开工声明展示角色如何理解现场，不能代替 Gate 的真实执行。阶段推导表维护在 Directive §2.2；其他角色文件引用该表，不复制一份独立定义。Engine 不解析声明，也不负责启动角色。

来源：[WorkflowAgentDirective.md · 启动协议](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowAgentDirective.md#L30)

## 推导依据与冲突处理

| 事实 | 来源 |
| --- | --- |
| 目标、范围、验收与审查基线 | `task.md` |
| 路线与目标提交 | `state.route`、`state.review.target`，并用 Gate 复核 |
| 复审对象 | `findings.md` 中 `Status: OPEN` 的条目 |
| 失败原因与接收者动作 | 对应失败 Artifact 或 `loop-ledger.md` |
| 当前提交与真实远端 | Git、`ls-remote` |

`mode` 与 Finding 编号不再是必填输入。旧式 mode 可作为覆盖提示，但与推导结果冲突时阻塞；旧 `HANDOFF_PROMPT` 不作为事实来源。Owner `REJECTED` 后的退回角色必须读取 `owner-decision.md` 的 `Return To`，缺失时不能猜测。阶段表没有覆盖的状态组合、路线缺失或 Artifact 自相矛盾，也不能按“最接近的一行”继续。

这里约束的是角色读取与判断过程。五个 Gate 对历史 route 缺失的兼容行为仍保留；协议启动检查更严格，不能据此宣称 Engine 新增了相同检查。

## 四字段出站

```text
RESULT: CLEAN
NEXT_ROLE: OWNER_GATE
TASK_PATH: .agent/tasks/order-validation/
OWNER_ACTION: NONE
```

四字段只表达本角色终态、唯一接收者、任务目录和 Owner 动作。完整 SHA、AC、文件列表、执行步骤与失败原因留在相应 Artifact 和 Git，不再复制到交接块。上例只示意字段形式，实际结果码与路由必须符合角色出口表。

`OWNER_ACTION=NONE` 表示无需额外决策即可按任务目录启动下一会话，并不表示框架已经自动调用下一角色。`CONTINUE` 用于同会话推进；`DECIDE:` 等待 Owner 决策；`DO:` 表示需要 Owner 先完成外部动作；`STOP` 用于合法停止。OwnerGate 的 ARCHITECT V1 到 V2 仍是同会话推进。

来源：[WorkflowHandoffContract.md · 四字段与动作语义](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowHandoffContract.md#L37)

## 失败必须可恢复

| 失败来源 | 持久化位置 |
| --- | --- |
| Cleaner `CHANGES_REQUIRED` | `findings.md`，包含触发、实际/期望及修复边界 |
| OwnerGate `REJECTED` | `owner-decision.md`，包含 `Return To` |
| Deliverer `FAIL_*` | `delivery.md`，包含检查项与证据 |
| Coder / Analyst / Architect / TaskBuilder 失败 | `loop-ledger.md`，包含 `handoff_target`、`receiver_action`、根因与证据 |

失败交接在对应载体落盘并 push 后才能发出。持久化失败时只能停止并报告 `PERSISTENCE_FAILURE`，不能把聊天中的失败说明当成已完成交接。账本属于 Neutral Tail，所以记录失败事实不必自动废弃此前有效的 Review；这不意味着 Engine 认证了失败路由或账本真实性。

来源：[交接契约 · 失败持久化](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowHandoffContract.md#L118) · [GL-15](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_git_lifecycle.py#L1011)

## 更新与终止

TaskBuilder 的 `owner_update` 使用 `task_path` 和 `owner_decision`，完成态为 `UPDATE_COMPLETE`。影响实现或验收的变更返回 Coder，改变 Contract / Design 前提的变更返回 Analyst；没有直接返回 Cleaner 的出口。原因是 `task.md` 不在 Review-neutral 白名单，任务定义变化后不能继续沿用旧 `CLEAN`。

Owner 明确终止使用 `STOPPED`，与 `BLOCKED` 区分。终止事实落在账本或决策记录，不通过写入 `blocked.active=true` 表达，也不删除已产生的证据。Engine 没有新增 `STOPPED` 状态字段；它是交接协议的角色终态码。

来源：[3.4.0 兼容性与更新路径](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.4.0.md)
