# 模块与数据边界

系统分为协作协议、运行时校验和安装升级三部分。协议描述角色应该如何工作；Engine 读取已经形成的仓库事实；Adoption 将通用组件安装到宿主，并保留宿主配置及历史证据。

## 目录组织

```text
.agent/
├── roles/          角色操作说明
├── specs/          协作协议、路线、交接与 Git 生命周期
├── engine/         独立 Go Module，workflow-check
├── adoption/       Python 分发、安装与升级工具
├── templates/      接入配置与 Registry 模板
└── VERSION         源码版本

宿主接入后生成或维护：
.agent/workflow.yaml   项目机器配置
.agent/upstream.yaml   上游来源与精确基线
.agent/tasks/<task>/   任务状态与证据
.agent/registry/       共享资源授权记录（按需）
```

分发产物不携带宿主的 live 配置、Task 和 Registry 分配。框架仓库自身可以跟踪开发期 Task；3.4.0 的分发与直接来源安装会将这些 Task 排除，仓库自托管与向宿主分发使用不同边界。直接在分发仓库调用一个业务任务的 Gate，不构成有效的接入验证。

来源：[PACKAGE_MANIFEST.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/PACKAGE_MANIFEST.md)

## Engine 的调用链

CLI 解析 Gate 名称、任务路径及仓库根目录，加载 `.agent/workflow.yaml`，构造 `Validator`，再调用对应 Gate。配置、Git 接口与任务状态是校验器的输入；结果通过状态、Issue 与错误返回。

```text
CLI → LoadConfig → Validator
                    ├── task/state.yaml 与任务文档
                    ├── Git 接口：提交、祖先关系、Diff、状态
                    └── 集成分支 Registry
                                  ↓
                          PASS / FAIL / ERROR
```

`Git` 接口只暴露读取操作；`ExecGit` 通过 `os/exec` 调用 Git，并设置 `GIT_OPTIONAL_LOCKS=0`。测试可以用临时 Git 仓库验证真实提交关系，也可以注入实现覆盖异常路径。Module 名 `workflow-v2-engine` 是历史标识，不能据此推断当前协议版本。

来源：[main.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/cmd/workflow-check/main.go#L95) · [git.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/git.go#L9)

## 协议启动与机器校验

`WorkflowAgentDirective.md` 维护角色启动、阶段推导与模式推导；`WorkflowHandoffContract.md` 维护出站四字段和失败落盘规则。两者由角色读取，Engine 不解析这些 Markdown，也不根据四字段交接启动下一角色。

Git 自检工具新增的 `baseline` 是可执行的事实读取器：报告当前分支、HEAD、upstream、同步状态及任务目录冲突。如何由这些事实决定建分支、选路线和路由失败，仍由协议和角色执行。不能把工具存在等同于一个自动调度器。

来源：[启动与阶段推导](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowAgentDirective.md#L30) · [git-lifecycle-check](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/tools/git-lifecycle-check)

## 项目配置与共享资源

集成分支、Registry 路径和资源类型来自宿主配置。任务状态声明申请的资源值；校验器从配置指定的共享集成分支读取 Registry，核对值、所属任务和授权状态。只在 feature 分支写一条预留记录，不能取得共享资源授权。

这个边界用于迁移版本号、错误码域等跨任务资源。Engine 不内置具体业务类型，也不负责竞争分配资源；授权记录的写入和分支集成仍需按协议执行。

来源：[validator.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/validator.go#L117) · [registry.go](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/engine/internal/workflow/registry.go)

## 指令入口与宿主规则

Workflow 的入口是 `WorkflowAgentDirective.md`，由明确激活的角色读取。没有使用 `AGENTS.md` 作为包入口，是为了避免把 Workflow 的角色协议隐式施加给宿主里的普通 Agent 会话。

宿主根 `AGENTS.md` 由宿主维护；分发包不创建、不覆盖。Workflow Core 负责通用规则，Adoption 负责确定宿主的真实集成分支和配置。两者混用，会使升级包覆盖项目事实或让历史证据失去解释依据。

来源：[WorkflowAgentDirective.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/specs/WorkflowAgentDirective.md)
