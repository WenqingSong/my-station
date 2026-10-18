// References point to inspected revisions, not a claim that tests were run here.
export const workEvidence: Record<string, {
  repo: string; problem: string; decision: string; evidence: string; boundary: string;
  links: { label: string; url: string }[];
}> = {
  delivery: {
    repo: 'https://cnb.cool/framework-station/my-shop',
    problem: '请求超时后再点一次，库存不能再扣一次。秒杀请求进了队列，也不能被当成已经下单成功。',
    decision: 'Redis Lua 做准入，MySQL 请求表承接排队。订单、库存和请求状态在同一个事务中落定；失败后重试、对账，不把缓存当成交易结果。',
    evidence: '设计文档说明准入、落单与恢复的边界。恢复测试包含活动结束后的收敛、孤立标记修复，以及死信请求重新排队与审计。',
    boundary: '个人后端项目。普通订单使用 Mock 支付，不接真实支付；排队使用 MySQL 请求表，不是外部 MQ。',
    links: [
      { label: '秒杀设计', url: 'https://cnb.cool/framework-station/my-shop/-/blob/15bcc4be24fd00dc7811db5e549d7ad60e1519c7/docs/design/flash-sale.md' },
      { label: '恢复测试源码', url: 'https://cnb.cool/framework-station/my-shop/-/blob/15bcc4be24fd00dc7811db5e549d7ad60e1519c7/internal/logic/flashsale/recovery_test.go' }
    ]
  },
  backend: {
    repo: 'https://cnb.cool/framework-station/agent-workflow',
    problem: '上一个会话说“已审查”，下一个会话却拿到了改过的代码。任务文件、代码提交和审查结论，需要能互相对得上。',
    decision: '把交接与审查绑定到具体 Git Commit，用 Go 校验器检查。代码变了，旧的审查结论不能自动沿用；最终是否合并，仍由人决定。',
    evidence: '流程文档记录角色与交接约定，Git 集成测试检查提交变化后审查结论是否仍然有效。',
    boundary: '开发协作流程与校验工具，不是自动运行 Agent 的调度平台。',
    links: [
      { label: '协作流程设计', url: 'https://cnb.cool/framework-station/agent-workflow/-/blob/7727e0a64f47bc33b6f042f27421e1889224e7f3/docs/design/agent-workflow.md' },
      { label: 'Git 集成测试源码', url: 'https://cnb.cool/framework-station/agent-workflow/-/blob/7727e0a64f47bc33b6f042f27421e1889224e7f3/.agent/engine/internal/workflow/git_integration_test.go' }
    ]
  },
  matching: {
    repo: 'https://cnb.cool/framework-station/hr-station',
    problem: '这个工具来自我自己的求职需求。简历与岗位交给模型分析，但返回的 JSON 不一定完整，也不一定符合页面约定。',
    decision: '区分 Fast 与 Deep 分析。模型输出先解析、再做 Schema 校验；失败时修复一次，仍不合约定就返回回退信号，由业务流程处理。',
    evidence: '输出处理实现与测试放在一起，可以对照查看校验、单次修复和 fallback_required 的分支。',
    boundary: '做过公网部署，本页先提供源码入口。结构校验通过，不代表分析结论一定正确。',
    links: [
      { label: '输出处理实现', url: 'https://cnb.cool/framework-station/hr-station/-/blob/35bb3d07c98f40855b808afdc93e932cb8a65f73/server/internal/agent/pipeline/pipeline.go' },
      { label: 'Pipeline 测试源码', url: 'https://cnb.cool/framework-station/hr-station/-/blob/35bb3d07c98f40855b808afdc93e932cb8a65f73/server/internal/agent/pipeline/pipeline_test.go' }
    ]
  }
};
