# Agent Workflow

Agent Workflow 将 AI 辅助开发中的阶段交接落在 Git 提交和仓库内的任务文件上。角色负责产出设计、实现与审查证据，Go 校验器负责检查这些证据是否仍对应当前仓库状态，人类 Owner 决定是否接受与集成。

它以源码包的形式接入宿主仓库。本文固定于 `263194b`，源码版本为 **3.4.0**。本次从远端取得的 `v3.4.0` 标签指向同一提交；CNB Release 与发布附件未核验，标签存在不等于发布资产已通过校验。

## 交接中的一致性问题

多轮开发最容易失真的部分是结论的适用范围：审查时看到的代码与准备交付的代码可能不同；Owner 接受过的实现可能被后续提交替换；验收通过时的集成分支基线也可能已经前进。单独保留一个 `CLEAN` 或 `PASS` 字段无法区分这些情况。

项目将 Contract、Review、Delivery 分别绑定到不可变提交，并在阶段入口重新验证绑定关系。一次审查针对实现提交 C1；后续提交只允许包含当前任务在该阶段的元数据白名单。业务文件发生变化，旧审查不能继续用于交接。

来源：[README.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/README.md#L21)

## 组件与职责

| 组件 | 保存或检查的事实 | 执行位置 |
| --- | --- | --- |
| Role / Spec | 角色职责、修改范围、交接格式、失败处理 | 独立 Agent 会话 |
| Task / Evidence | 路线、状态、提交绑定、审查与接受记录 | 宿主 Git 仓库 |
| Go Engine | 证据有效性、Git 状态、资源授权、路线一致性 | `workflow-check` |
| Adoption | 分发包校验、首装、三方升级、回滚 | Python CLI |

Engine 提供只读判定；模型调用、角色启动、分支写入与最终合并由外部执行。这样可以把可复核的仓库事实与角色的自然语言判断分开维护，但也意味着协议的执行依赖会话纪律和宿主的 Git 保护。

## 一条任务如何推进

TaskBuilder 从任务目标发现当前 Git 基线、生成任务名称并初始化任务；后续角色只凭角色名与 Task 目录，在新会话中重建上下文。阶段与模式由持久化状态推导，上一会话的交接说明不再承担事实传递。

普通实现任务经过 TaskBuilder、Analyst、Coder、Cleaner、OwnerGate、Deliverer。Cleaner 独立审查实现，OwnerGate 保存人工决策，Deliverer 验证已接受的候选。`ARCHITECT` 路线交付结构设计，使用 Architect 和 OwnerGate 的结构验证，不经过 Cleaner。

```text
NORMAL / COMPLEX
TaskBuilder → Analyst → Coder → Cleaner → OwnerGate → Deliverer → Owner 集成

ARCHITECT
TaskBuilder → Analyst → Architect → OwnerGate → Deliverer → Owner 集成
```

两条路径共用任务文件与 Gate。七种角色是两条路线的并集，不是每个任务都运行七个角色。

## 当前实现的重心

3.3.0 补齐 TaskBuilder 的基线发现、命名与依赖分类；3.4.0 将跨会话协作收敛到 Task Artifact，交接输出缩为四字段。相对旧阅读页所用的 3.2.0 快照，`.agent/engine/**` 没有代码变更，增强集中在协议、Git 自检工具、分发规则与对应测试。

## 阅读路径

任务创建从[任务初始化与依赖](08-bootstrap.md)开始，角色接手规则见[独立会话与交接](09-sessions.md)。关注实现的读者可先看[证据绑定与失效](03-evidence.md)，再看[五个 Gate](04-gates.md)。关注项目接入与维护，可从[模块与数据边界](02-architecture.md)进入[安装与三方升级](06-adoption.md)。[验证与已知限制](07-verification.md)集中列出机器保证的范围和当前验证缺口。

源码入口：[README.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/README.md) · [完整设计](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/docs/design/agent-workflow.md)
