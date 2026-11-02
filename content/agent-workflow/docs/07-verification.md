# 验证与已知限制

本页记录 `263194b` 的验证边界。2026-11-02 更新阅读页时，已重新执行与 3.3 / 3.4 变化相关的 **56 项检查**：49 项规范一致性检查、5 项真实 Git / Gate 行为检查、2 项分发检查。它们全部通过；未重跑完整 Go Engine、Adoption 和发布测试集合。

## 本次实际执行

| 检查 | 数量 | 结论与范围 |
| --- | --- | --- |
| `test_cold_start.py` | 10 | 启动步骤、阶段与模式推导、七角色事实来源一致 |
| `test_handoff_contract.py` | 21 | 四字段、路由矩阵、角色出口与失败落盘要求一致 |
| `test_taskbuilder_autonomy.py` | 18 | 基线、命名、依赖和权限规则的规范检查 |
| `test_git_lifecycle.py` 选定用例 | 5 | GL-14/15/16、当前分支基线、保留外来暂存内容 |
| `test_workflow_adoption.py` 选定用例 | 2 | tracked Task 从分发排除、干净来源可分发 |

行为检查使用临时 Git 仓库及本地构建的真实 `workflow-check`。GL-14 验证 Task 与 Git 提供审查事实；GL-15 验证失败账本可从 Git 恢复且不破坏 `CLEAN`；GL-16 验证修改 `task.md` 后 OwnerGate 入口拒绝旧审查。它们没有调用 LLM，不能证明模型在新会话里必然正确执行规范。

来源：[GL-14/15/16](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_git_lifecycle.py#L975) · [冷启动规范检查](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_cold_start.py) · [自托管 Task 分发测试](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/tests/test_workflow_adoption.py#L368)

## 可重复的检查入口

```bash
python3 .agent/adoption/tests/test_cold_start.py -v
python3 .agent/adoption/tests/test_handoff_contract.py -v
python3 .agent/adoption/tests/test_taskbuilder_autonomy.py -v

python3 .agent/adoption/tests/test_git_lifecycle.py \
  LifecycleTest.test_gl14_cold_start_facts_are_derivable \
  LifecycleTest.test_gl15_failure_handoff_is_recoverable_and_neutral \
  LifecycleTest.test_gl16_task_builder_update_does_not_claim_clean \
  LifecycleTest.test_taskbuilder_baseline_uses_current_branch_and_head \
  LifecycleTest.test_taskbuilder_bootstrap_preserves_staged_foreign_content -v

python3 .agent/adoption/tests/test_workflow_adoption.py \
  DistributionContractTests.test_tracked_task_data_is_excluded_not_rejected \
  CiGeneratedArtifactIsolationTests.test_clean_source_tree_is_distributable -v
```

Go Engine 要求 Go 1.23+，Adoption 的支持要求为 Python 3.10+ 和 Git。本次选定用例在当前 macOS 环境通过，不构成对该平台完整安装、升级和恢复流程的验证。

## Engine 既有覆盖

相对旧阅读页的 `ccd95f8`，`.agent/engine/**` 无代码变化。原有测试仍覆盖审查后源码注释变更、Owner 接受旧 Target、集成分支前进、业务文件重命名为元数据路径，以及 feature 独有 Registry 预留无效等场景。本次没有重跑完整 Engine 测试，因此这里保留的是源码可核对的覆盖范围。

来源：[git_integration_test.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/git_integration_test.go#L313) · [integrity_test.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/integrity_test.go#L518)

## 机器保证的边界

Engine 能验证提交对象、祖先关系、路径范围、已保存状态与 Registry 记录，不能认证 Agent 身份、Session 独立性、Owner 指令真实性或自然语言设计正确性。3.4.0 的启动步骤、阶段表和四字段属于规范层；Engine 不解析交接块。

DANGER 的两轮预算由角色 Prompt 与账本执行。Engine 识别允许的账本路径，但不能证明轮次数值真实或账本始终 append-only。真实 LLM 冷启动验收仍需独立会话的人工记录。

`handoffReady` 使用本地 remote-tracking ref，真实远端状态需要额外核验。Git 自检读取远端不代表 Engine 自动执行了相同检查，也不拦截绕过协议的直接 Git 写操作。

来源：[Directive · 协议边界](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowAgentDirective.md#L8) · [3.4.0 已知边界](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/releases/v3.4.0.md)

## Tag、Release 与运行验证

本次 `git fetch` 取得了远端 annotated Tag `v3.4.0`，解析后指向 `263194ba83e72c1fc67f177fb22e9bffeff0780e`，与当前 main 一致。CNB Release、附件 SHA256、promote 和 latest 状态未核验，不声称发布流水线已经全部完成。

Manifest 中的 `NOT_RELEASED` 是构建产物标记，不能单独用来判断平台发布状态。源码版本、Git Tag、Release 附件和实际运行验证需要分别解释。

仓库记录的完整 Adoption E2E 在 Linux 临时宿主执行；其他平台的交叉编译不等于运行验证。框架自托管 Task 可以提供这次框架开发的证据，不等于已在多个真实宿主或生产项目完成接入验证，也不支持没有实测依据的效率提升数据。

来源：[发布契约](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/PACKAGE_MANIFEST.md) · [README 已知边界](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/README.md)
