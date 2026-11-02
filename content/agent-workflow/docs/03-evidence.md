# 证据绑定与失效

状态文件保存结论与目标提交。校验器既检查状态值，也解析目标提交、检查祖先关系，并核对目标之后的变更范围。因此，`review.status: CLEAN` 只是检查入口，不能单独证明当前实现已经被审查。

## 不可变提交引用

`resolveImmutableCommit` 接受 7～40 位十六进制 SHA 字面值，拒绝 `HEAD`、分支名和 Tag。它确认对象存在，解析为完整 SHA，并检查解析结果以原始字面值为前缀。后续绑定比较使用完整 SHA，避免同一提交的短 SHA 与长 SHA 被误判为不同对象。

提交存在也不等于属于当前分支。Review Target 必须是当前 feature HEAD 的祖先或同一提交；历史改写后孤立的旧 Target 即使具有相同 Tree，也不能继续支持当前 `CLEAN`。

来源：[gates.go · resolveImmutableCommit / reviewTailValid](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/gates.go#L300)

## 三类绑定

| 证据 | 绑定字段 | 失效条件 |
| --- | --- | --- |
| Contract | `contract.target` | 批准版本与当前 `contract.md` 内容不一致，或目标不属于当前历史 |
| Review | `review.target` | 目标不属于当前历史，或目标到 HEAD 的 Diff 包含非白名单路径 |
| Delivery | `delivery.review_target`、`feature_head`、`develop_base` | 审查目标变化、验收后出现非白名单变更，或集成分支基线变化 |

Owner Acceptance 另外保存 `owner.review_target`。实现重审后即使重新得到 `CLEAN`，旧的 Owner 接受记录仍不能用于新 Target。

## 为什么允许元数据尾提交

审查与验收的结论需要写回仓库。如果要求 HEAD 永远等于被审查提交，记录审查结果本身就会改变 HEAD。实现将目标快照与后续记录分离：保留固定的实现 SHA，允许当前任务在阶段白名单内继续提交元数据。

Review 白名单包括 `findings.md`、`core-logic.md`、`owner-decision.md`、`delivery.md`、`state.yaml` 和两类 DANGER 证据文件；Delivery 白名单更窄。所有路径都必须精确位于 `.agent/tasks/<current-task>/`，其他任务里的同名文件不享有例外。

```text
C1 实现快照 ── M1 审查记录 ── M2 Owner 决策
↑ review.target                 ↑ feature HEAD

C1..HEAD 仅包含当前任务的允许路径 → 保留 Review 绑定
C1..HEAD 包含业务文件变更         → 拒绝沿用 Review
```

白名单按路径定义，未列出的文件默认视为实质变化，包括源码注释。实现检查的是两端快照的路径 Diff，并没有逐个重放中间提交来证明整段历史从未修改过业务文件。

来源：[paths.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/paths.go#L5) · [gates.go · reviewTailValid](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/gates.go#L377)

## 任务定义修改与失败记录

`task.md` 不在 Review-neutral 白名单。TaskBuilder 修改验收条件后，旧 `CLEAN` 在 OwnerGate 入口失效；3.4.0 的 `UPDATE_COMPLETE` 不能直接交给 Cleaner，影响实现或验收的更新返回 Coder，改变 Contract / Design 前提的更新返回 Analyst。重新形成实现与 Review Request 后，再进入审查。

失败交接记录使用 `loop-ledger.md` 等已有 Artifact。账本在当前任务根目录属于 Neutral Tail，追加失败原因和接收者动作可以保留原 Review 绑定。但路径获准不代表 Engine 校验了账本内容或 append-only 历史。

来源：[3.4.0 任务更新规则](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.4.0.md) · [真实 Git / Gate 测试 GL-15、GL-16](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_git_lifecycle.py#L1011)

## Rename 与祖先关系

Diff 禁用了 rename detection。将业务文件移到 `findings.md` 这样的允许路径时，需要同时看到业务路径删除和元数据路径新增；只检查重命名后的路径会漏掉前者。`--no-renames` 将两个方向拆开，交由默认拒绝的路径规则判定。

祖先检查解决另一类问题：两棵树内容相同，不代表审查目标属于当前 feature 历史。这两个检查各自约束内容范围和历史归属，不能互相替代。

来源：[git.go · diffNoRenames](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/git.go#L65) · [integrity_test.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/integrity_test.go#L518)

## 交付基线前进后的处理

`deliveryFreshness` 核对已验收的 feature 快照到当前 remote feature 的尾部变更，同时要求当前集成分支 SHA 等于 `delivery.develop_base`。集成分支前进后，旧 `PASS` 不再满足 `merge-ready`，需要基于新基线重新形成验收证据。

字段名 `develop_base` 是历史命名，实际比较的集成分支由配置决定。这里的 remote 引用仍受本地 tracking ref 新鲜度限制，详见[验证与已知限制](07-verification.md)。
