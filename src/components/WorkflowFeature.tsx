import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './workflow-feature.css';
import workflowSnapshot from '../../content/agent-workflow/snapshot.json';

export const workflowDocsPath = '/projects/agent-workflow/';

function EvidenceDrawing({ disabled }: { disabled: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = root.current;
    if (!host || disabled) return;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ paused: true });
      timeline.fromTo('.wf-draw', { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 1.25, stagger: .25, ease: 'power2.inOut' }, 0);
      timeline.fromTo('.wf-evidence-node', { opacity: .25, y: 8 },
        { opacity: 1, y: 0, duration: .7, stagger: .16, ease: 'power3.out' }, .35);
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !document.hidden) timeline.play();
        else timeline.pause();
      }, { threshold: .25 });
      const visibility = () => {
        if (document.hidden) timeline.pause();
        else if (host.getBoundingClientRect().top < innerHeight && host.getBoundingClientRect().bottom > 0) timeline.play();
      };
      observer.observe(host);
      document.addEventListener('visibilitychange', visibility);
      return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
    }, host);
    return () => context.revert();
  }, [disabled]);

  return <div className="wf-board" ref={root}>
    <div className="wf-board-bar"><span className="framework-mark" aria-hidden="true" /><span>COMMIT-BOUND EVIDENCE</span><span>FIG. 01</span></div>
    <svg className="wf-evidence-drawing" viewBox="0 0 640 450" role="img" aria-labelledby="wf-drawing-title wf-drawing-desc">
      <title id="wf-drawing-title">审查绑定提交的机制示意</title>
      <desc id="wf-drawing-desc">审查通过的对象是实现提交 C1。后续业务代码形成 C2 后，Go Gate 拒绝沿用 C1 的审查结论。图中 C1 与 C2 为示意，不是实时运行数据。</desc>
      <g className="wf-grid-lines"><path d="M0 32H640M0 96H640M0 160H640M0 224H640M0 288H640M0 352H640M0 416H640M32 0V450M96 0V450M160 0V450M224 0V450M288 0V450M352 0V450M416 0V450M480 0V450M544 0V450M608 0V450" /></g>
      <path className="wf-path-base" d="M76 74V356" />
      <path className="wf-draw wf-path-ink" pathLength="1" d="M76 74V220" />
      <path className="wf-draw wf-path-branch" pathLength="1" d="M76 74V126H342Q362 126 362 144" />
      <path className="wf-draw wf-path-change" pathLength="1" d="M76 220V414H252Q278 414 278 388" />
      <path className="wf-proof-link" d="M418 252V308" strokeDasharray="4 6" />
      <g className="wf-evidence-node">
        <circle className="wf-commit-halo" cx="76" cy="74" r="18" /><circle className="wf-commit" cx="76" cy="74" r="6" />
        <text x="104" y="47" className="wf-svg-label">IMPLEMENTATION</text>
        <text x="104" y="83" className="wf-svg-title">C₁</text>
        <text x="104" y="111" className="wf-svg-muted">实现快照</text>
      </g>
      <g className="wf-evidence-node">
        <circle className="wf-neutral-commit" cx="76" cy="220" r="5" />
        <text x="104" y="214" className="wf-svg-label">METADATA</text>
        <text x="104" y="240" className="wf-svg-muted">记录审查结论</text>
      </g>
      <g className="wf-evidence-node wf-review-card">
        <rect x="278" y="144" width="298" height="108" rx="5" />
        <text x="302" y="172" className="wf-svg-label">REVIEW / TARGET C₁</text>
        <text x="302" y="219" className="wf-svg-verdict">CLEAN</text>
        <path className="wf-check" d="m530 201 8 8 15-18" />
      </g>
      <g className="wf-evidence-node">
        <circle className="wf-change-halo" cx="76" cy="356" r="18" /><circle className="wf-change-commit" cx="76" cy="356" r="6" />
        <text x="104" y="327" className="wf-svg-label">CODE CHANGED</text>
        <text x="104" y="365" className="wf-svg-title">C₂</text>
        <text x="104" y="395" className="wf-svg-muted">业务代码变更</text>
      </g>
      <g className="wf-evidence-node wf-gate-card">
        <rect x="278" y="308" width="298" height="96" rx="5" />
        <text x="302" y="338" className="wf-svg-label">GO GATE / REVIEW TAIL</text>
        <text x="302" y="372" className="wf-svg-reject">RE-REVIEW REQUIRED</text>
        <circle cx="552" cy="335" r="4" />
      </g>
    </svg>
    <div className="wf-board-foot"><span>CLEAN @ C₁ <b>≠</b> HEAD @ C₂</span><span>机制示意 / 非实时状态</span></div>
  </div>;
}

export default function WorkflowFeature({ disabled, compact }: { disabled: boolean; compact: boolean }) {
  return <article className="work-scene scene-backend workflow-feature" id="work-backend" aria-labelledby="title-backend">
    <div className="scene-inner">
      <div className="scene-topline"><span>01 / SELECTED WORK</span><span>DEVELOPER TOOLING · v{workflowSnapshot.version}</span></div>
      <div className="wf-feature-layout">
        <div className="scene-copy wf-feature-copy">
          <p className="wf-kicker"><span /> Git evidence. Independent review.</p>
          <h3 id="title-backend" aria-label="Agent Workflow"><span className="scene-title-mask"><span className="scene-title-line">Agent</span></span><span className="scene-title-mask"><span className="scene-title-line">Workflow<span className="wf-title-dot">.</span></span></span></h3>
          <p className="scene-subtitle">基于 Git 证据的多 Agent 工程协作框架</p>
          <div className="wf-introduction"><h4>审查绑定提交。<br />交接读取任务。</h4><p>Contract、Review 与 Delivery 绑定不可变提交，Go 校验器检查证据是否仍然有效。独立会话从 Task 和 Git 重建上下文，最终接受与集成由 Owner 决定。</p></div>
          <div className="wf-entry-links"><a className="wf-docs-entry" href={workflowDocsPath}>阅读技术文档 <span aria-hidden="true">↗</span></a><a className="wf-source-entry" href="https://cnb.cool/framework-station/agent-workflow" target="_blank" rel="noopener noreferrer">项目源码 <span aria-hidden="true">↗</span></a></div>
          <p className="wf-reading-note">9 篇文档 · 设计约束、实现与验证边界</p>
        </div>
        <div className="scene-art wf-feature-art">
          <div className="scene-art-crop"><div className="scene-art-parallax"><EvidenceDrawing disabled={disabled || compact} /></div></div>
          <div className="wf-art-caption"><span>一次审查的适用范围，由提交与后续 Diff 决定。</span><span>SNAPSHOT / {workflowSnapshot.sha.slice(0, 7)}</span></div>
        </div>
      </div>
      <div className="wf-design-notes">
        <div><span>01 / EVIDENCE</span><h4>结论有明确的对象</h4><p>后续变更超出当前任务的元数据白名单，旧 CLEAN 失效；Owner Acceptance 与 Delivery 也绑定同一 Review Target。</p></div>
        <div><span>02 / HANDOFF</span><h4>事实留在仓库</h4><p>角色名与 Task 目录启动新会话。四字段交接只负责定位，失败原因先写入对应 Artifact，再交给下一角色。</p></div>
        <div><span>03 / BOUNDARY</span><h4>校验与决策分开</h4><p>五个只读 Gate 检查 Git 和状态事实；不自动调度模型，不认证会话身份，也不替人执行合并。</p></div>
      </div>
      <div className="wf-feature-footer"><span>Go / Git / Python · 源码分发</span><a href="#work-delivery">下一个项目 · SurgeCart <span aria-hidden="true">↓</span></a></div>
    </div>
  </article>;
}
