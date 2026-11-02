# 安装与三方升级

Adoption 处理通用 Workflow 文件与宿主修改之间的关系。它从精确提交构建 Source Distribution，以 Manifest 固定文件清单和分类；安装时生成宿主所需的配置与来源记录；升级时使用 B/L/N 三方比较，而非整目录覆盖。

## 文件所有权

| 分类 | 分发内容 | 宿主处理 |
| --- | --- | --- |
| `managed` | roles、specs、engine、adoption、templates 等 | 安装；升级参与三方比较 |
| `package_only` | 根 README、CI、设计文档、发布脚本等 | 包内保留，不安装到宿主 |
| `generated` | `workflow.yaml`、`upstream.yaml`、binary | 由工具按事务语义生成或更新 |
| `protected` | 宿主根规则、业务文件、任务、Registry、历史证据 | 不覆盖或删除 |

`workflow.yaml` 首装时生成，升级中只读。Registry 默认不创建；只有显式指定资源种类和路径时才创建空表，不预填真实分配记录。

来源：[PACKAGE_MANIFEST.md](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/PACKAGE_MANIFEST.md)

## 框架仓库自托管的例外

3.4.0 允许框架仓库跟踪自己的 `.agent/tasks/**`，用于保存框架开发过程的证据。这些文件在两条来源路径中都会被排除：`create_source_distribution` 构建归档，`_load_source_tree` 为直接 `--source` 安装读取来源。Task 不进入归档或 `MANIFEST.json`，也不安装到宿主。

例外只覆盖 Task 前缀。tracked 的 `workflow.yaml`、`upstream.yaml`、Registry、binary、根 `AGENTS.md` 等宿主数据仍会使来源校验失败。不能据此将整个 `.agent/` 视为可忽略内容。

来源：[workflow_adoption.py · 分发排除](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/workflow_adoption.py#L597) · [直接来源排除](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/workflow_adoption.py#L946)

## B / L / N 比较

B 是 `.agent/upstream.yaml` 记录的精确上游基线，L 是宿主当前文件，N 是新包。三方比较用来识别上游变更、宿主修改及两侧冲突。

| 文件关系 | 处理含义 |
| --- | --- |
| L = B，N 变化 | 可采用上游新版本 |
| N = B，L 变化 | 保留宿主修改 |
| L、N 相对 B 均变化且冲突 | 拒绝本次升级，先处理冲突 |
| B 缺失 | `BASE_UNKNOWN`，不猜测基线 |
| 上游删除 | 依照删除授权和本地修改状态处理 |

冲突、基线缺失或删除未授权时整次 fail closed，避免将一部分角色规范升级、另一部分校验器留在旧版本。

## 来源校验与事务恢复

通过归档安装时，需要固定归档 SHA256 和完整源 Commit；归档拒绝绝对路径、路径穿越、符号链接、硬链接及特殊文件。外部 binary 也必须有固定校验和，并与分发包来源 Commit 一致。

写入前生成事务备份和报告；发生失败后恢复已修改或删除文件，并清理本次新建文件。回滚失败时仍保留备份，供 `restore` 恢复。接入校验使用真实 Engine Gate 和最小任务 Fixture，不能仅靠复制完成判定接入成功。

```text
<git-dir>/workflow-adoption/
├── backups/<txn>/
│   ├── manifest.json
│   └── before/...
└── reports/<txn>.json
```

来源：[Adoption README](https://cnb.cool/framework-station/agent-workflow/-/blob/263194ba83e72c1fc67f177fb22e9bffeff0780e/.agent/adoption/README.md)

## 源码版本与 binary 来源

`.agent/upstream.yaml` 记录已安装分发包的来源；`workflow-check version` 报告 binary 的构建版本与 Commit。只更新源码而保留 binary 的升级，两者可能不同，需要分别解释。

直接本地构建的开发 binary 报告 `dev / unknown`。安装工具从同一分发包构建时注入真实来源；正式发布资产再使用 `buildSource=release` 区分。本次核对的 `v3.4.0` Tag 已存在并指向 `263194b`；构建清单中的 `NOT_RELEASED` 是分发产物标记，不能用它反推平台尚未发布，也不能仅凭 Tag 宣称 Release 附件已验证。
