# 五个 Gate

Gate 是阶段入口的只读检查。五个 Gate 共享状态 Schema、阻塞状态和路线一致性校验，再按交接位置组合 Contract、Review、Owner、Delivery 与 Git 检查。它们没有统一简化为一个“任务完成”布尔值。

## 阶段条件

| Gate | 主要条件 |
| --- | --- |
| `coder-start` | Contract 有效，共享资源已授权，仓库满足交接条件 |
| `cleaner-start` | Review 为 `PENDING`，Target 已固定，feature 已同步，尾提交只含允许路径 |
| `owner-gate-start` | `CLEAN` 仍适用于当前实现，仓库满足交接条件 |
| `delivery-start` | Contract、资源授权和 `CLEAN` 有效，Owner 接受绑定当前 Review Target |
| `merge-ready` | 前述绑定成立，Delivery 为 `PASS`，验收快照与集成分支基线仍有效 |

`blocked.active=true` 在五个 Gate 上都会阻止推进，检查放在 Schema 校验之后，避免其他昂贵检查掩盖阻塞事实。`PASS` 只表示这次读取的事实满足该 Gate 条件。

来源：[gates.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/gates.go#L33)

## 判定结果与退出码

```text
PASS     exit 0   本次 Gate 条件满足
FAIL     exit 1   可读取事实违反不变量或阶段条件
ERROR    exit 2   输入、校验器或运行错误
```

CLI 将不满足条件的 Issue 输出为任务、检查项、实际值、期望值与原因。区分 `FAIL` 和 `ERROR` 后，调用方可以区分“需要补齐或重做证据”与“本次无法完成判定”。不能把读不到 Git 对象当作一次正常的审查不通过。

来源：[main.go · printResult](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/cmd/workflow-check/main.go#L141)

## Git 交接条件

`handoffReady` 检查当前分支、工作区和 feature 与本地 remote-tracking ref 的关系，避免脏工作区、detached HEAD 或未同步提交进入下一角色。Engine 不执行 `fetch`、`commit` 或 `push`。

独立于 Engine 的 `git-lifecycle-check`，通过真实 `git ls-remote` 进行远端核验。Gate 自身仍只比较本地 tracking ref；如果远端已推进而本地未刷新，Gate 可能误判同步。出站协议要求额外执行远端核验，这个缺口没有被包装成 Engine 的强保证。

来源：[gates.go · handoffReady](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/gates.go) · [V3.4.0 协议与 Engine 边界](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.4.0.md)

## 启动推导不能代替入口 Gate

3.4.0 的角色启动协议先从 Task 推导阶段与入口 Gate，再实际运行检查。推导得到 `REVIEW_PENDING` 并不等于 `cleaner-start` 已通过，开工声明也不是机器授权。五个 Gate 的名称、退出码、检查语义以及 Engine 代码相对 3.2.0 保持不变。

`baseline` 的 `READY_WITH_PRESERVED_CHANGES` 只说明初始化可以保留他人修改继续进行；如果这些修改使最终工作区不干净，TaskBuilder 必须停在 `BOOTSTRAP_HELD`。不能借初始化例外放宽正常交接的 clean exit。

## 调用方式

以下命令用于已经完成 Adoption、存在真实配置和任务状态的宿主仓库。

```bash
.agent/bin/workflow-check gate cleaner-start .agent/tasks/your-task-id
.agent/bin/workflow-check gate merge-ready .agent/tasks/your-task-id
```

`merge-ready` 结束机器校验链。是否合并、何时合并以及采用什么集成方式，仍由 Owner 决定。Gate 没有持有仓库锁，也没有在判定后阻止后续写入；实际集成仍需检查判定所对应的分支状态。
