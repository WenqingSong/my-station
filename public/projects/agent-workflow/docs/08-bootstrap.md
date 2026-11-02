# 任务初始化与依赖

TaskBuilder 负责将 Owner 的目标转成可交付任务。3.3.0 起，默认输入不再要求 Owner 手填 Slug、分支名和完整起始 SHA；这些可以从目标与 Git 现场发现。Owner 主动指定的分支、基线和范围仍是硬约束。

## 从当前分支与 HEAD 开始

默认起始分支是当前检出的分支，起始提交是当前 HEAD。TaskBuilder 读取分支、暂存区、工作区、未跟踪文件、upstream 与远端同名分支事实，不能擅自切换到 main / develop，也不能用远端最新 SHA 替换当前 HEAD。

```bash
.agent/specs/tools/git-lifecycle-check baseline \
  --task order-validation \
  --branch task/order-validation \
  --json
```

`baseline` 报告 `current_branch`、`head`、`upstream`、`sync`、任务目录占用和候选分支状态。命令只读取事实，不建分支、不同步历史。`AHEAD`、`BEHIND`、`DIVERGED` 用于说明现场，不触发自动 pull、merge、rebase 或 reset。

远端 SHA 来自 `ls-remote`，计数优先基于本地 upstream；没有可计算的对象时输出未知状态。因此，同步标签需要结合远端 SHA 与对象可用性解释，不能假设 `baseline` 隐式执行过 fetch。detached HEAD 不猜测分支，交给 Owner 确定基线。

来源：[git-lifecycle-check · cmd_baseline](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/tools/git-lifecycle-check#L530) · [TaskBuilder 基线规则](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/roles/TaskBuilderPrompt.md#L105)

## 命名与权限边界

未给出名称时，从目标生成 2～5 个英文小写词组成的 kebab-case Slug，分支名使用 `task/<task-slug>`。候选需要检查 Git ref 合法性、受保护分支、本地与远端冲突、任务目录占用。同目标的既有任务可进入更新流程，目标不同则不能覆盖已有目录。

这只授予当前任务初始分支的创建权限。Merge、Rebase、Force Push、删除分支、向共享集成分支推送等操作没有因此获得授权。技术设计上的未知项先调查，或交由 Analyst；会改变业务行为、一致性或安全边界的关键问题才需要最小化地询问 Owner。

来源：[TaskBuilderPrompt.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/roles/TaskBuilderPrompt.md) · [3.3.0 初始化协议](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.3.0.md)

## 保留既有修改与 clean exit

初始化阶段允许保留任务目录外的既有修改。暂存和提交范围必须精确限定到当前任务目录；`commit-check --preserve-foreign` 只适用于 TaskBuilder 的 bootstrap，用于识别并排除外来暂存内容，不允许将其顺手带进任务提交。

| 状态 | 含义 |
| --- | --- |
| `READY_WITH_PRESERVED_CHANGES` | baseline 认为可以保留外来修改继续初始化 |
| `TASK_DIR_CONFLICT` | 当前任务目录已经存在冲突修改，不能覆盖 |
| `BOOTSTRAP_HELD` | 任务 Commit / Push 已完成，但保留的修改使工作区无法 clean exit |
| `BASE_UNRESOLVED` | 无法确定安全基线，需要 Owner 处理 |

保护他人修改与完成交接是两件事。初始化可以完成提交，随后停在 `BOOTSTRAP_HELD`；不能为了使 Gate 通过而丢弃、stash 或提交他人的修改。这些结果码属于协议或工具输出，不扩展 `state.yaml` Schema。

来源：[Git 生命周期](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowGitLifecycle.md) · [暂存内容保留测试](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_git_lifecycle.py#L521)

## 依赖不是任务编号顺序

| 依赖类型 | 上游未交付时 |
| --- | --- |
| `Blocking` | 当前 Goal / AC 必须依赖上游正式结果；不初始化、不交接 |
| `Reference-only` | 可以独立调查和定义；不得引用未审查结论为既定事实 |
| `Parallel` | 无交付依赖，可以并行；各自仍需审批和 Gate |

依赖写在 `task.md` 的 `## Dependencies`，没有新增状态字段，也没有引入依赖图调度引擎。分类依据真实交付关系，不能为了开工将 Blocking 降级为 Reference-only。

来源：[TaskBuilder · TB-DEP-1](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/roles/TaskBuilderPrompt.md#L470)
