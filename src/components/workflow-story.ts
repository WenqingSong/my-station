// Display scenarios grounded in the v3.4.0 protocol; these do not execute agents.
export const collaboration = [
  { role: 'TaskBuilder', label: '拆解任务', verb: '把目标变成可以验收的工作', body: '从需求和 Git 现场确定范围、验收条件与任务路线。先说清楚要交付什么，再开始写代码。', artifact: 'task.md · state.yaml', boundary: '定义任务，不写业务实现。', symbol: '01', cell: 0 },
  { role: 'Analyst', label: '设计方案', verb: '先解决关键选择', body: '调查约束、比较方案，明确必须保持的性质。复杂路线的设计约定需要人类批准，编码才有共同依据。', artifact: 'contract.md · docs/design/', boundary: '简单路线可直接进入编码；这里演示 COMPLEX 路线。', symbol: '02', cell: 1 },
  { role: 'Coder', label: '实现与自检', verb: '在已确认的范围内实现', body: '按设计完成代码与测试，把实现落到一个明确的 Git 提交。遇到设计冲突，回到方案讨论。', artifact: '代码 · 测试 · 实现提交', boundary: '实现者不能给自己的代码签发独立审查结论。', symbol: '03', cell: 2 },
  { role: 'Cleaner', label: '独立审查', verb: '独立会话，重新检查', body: '读取任务、设计和实际代码，核对验收条件与测试证据。发现问题先记录，再退回修复；通过也只对审查过的版本有效。', artifact: 'findings.md · core-logic.md', boundary: '修复后重新审查，不用旧结论覆盖新实现。', symbol: '04', cell: 5 },
  { role: 'OwnerGate', label: '人工决策', verb: '把关键判断交还给人', body: 'Agent 解释核心逻辑和审查证据，由人类 Owner 决定接受还是退回。记录决定，不能替人作出决定。', artifact: 'owner-decision.md', boundary: '人工接受与最终分支集成，由 Owner 掌握。', symbol: '05', cell: 4 },
  { role: 'Deliverer', label: '交付验证', verb: '最后再问：它真的能运行吗？', body: '按任务要求验证重要里程碑，记录复现与交付证据。交付验证完成后，仍由人类决定最终集成。', artifact: 'delivery.md · 验证记录', boundary: '有审查结论，不等于已经完成交付。', symbol: '06', cell: 3 },
];
export const reviewFrames = [
  { title: '实现落在 A', text: '开发者完成代码与测试，提交成为后续审查的明确对象。', stamp: '等待独立审查', tone: 'neutral', review: '尚未形成', target: '—' },
  { title: '独立审查通过', text: 'Cleaner 检查 A，记录 CLEAN。这个结论描述的是 A，而不是未来所有代码。', stamp: 'A 审查通过', tone: 'pass', review: 'CLEAN', target: 'A' },
  { title: '代码变成 B', text: '后续修改触及业务代码，准备交付的版本已经不同于被审查的版本。', stamp: '实现已变化', tone: 'change', review: 'CLEAN @ A', target: 'A' },
  { title: '旧结论不能放行', text: 'Go 校验器检查提交关系与变更路径，阻止沿用 A 的审查结论进入下一阶段。', stamp: '需要重新审查', tone: 'blocked', review: '旧结论不适用于 B', target: 'A' },
  { title: '重新审查 B', text: '对当前实现重新检查并记录结论，才可以继续后续人工接受与交付验证。', stamp: 'B 审查通过', tone: 'pass', review: 'CLEAN', target: 'B' },
] as const;
