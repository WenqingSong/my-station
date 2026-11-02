import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { workEvidence } from './work-evidence';
import './selected-work.css';
import WorkflowFeature from './WorkflowFeature';

type Project = {
  id: string; index: string; title: string; subtitle: string; category: string;
  label: string; heading: ReactNode; description: string; focus: string; stack: string;
};

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === 'delivery') return <div className="delivery-system">
    <div className="delivery-orbit orbit-one" /><div className="delivery-orbit orbit-two" />
    <div className="delivery-route"><span>ADMIT</span><i /><span>QUEUE</span><i /><span>COMMIT</span></div>
    <div className="delivery-slip slip-back"><span>02 / MYSQL QUEUE</span><strong>Queued.</strong><i /><i /><i /></div>
    <div className="delivery-slip slip-front"><span>01 / REDIS LUA</span><strong>Accepted.<br />Not sold.</strong><div className="slip-divider" /><p>准入 ≠ 下单成功</p><div className="slip-bars" /></div>
    <span className="visual-coordinate">A → B → C</span>
  </div>;
  return <div className="matching-system">
    <div className="match-orbit" /><div className="match-links"><i /><i /><i /><i /><i /></div>
    <div className="match-document document-a"><span>01 / RESUME</span><strong>Skills.<br />Projects.<br />Experience.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-document document-b"><span>02 / JOB</span><strong>Role.<br />Skills.<br />Requirements.</strong><div className="document-lines"><i /><i /><i /><i /></div></div>
    <div className="match-core">×</div><span className="visual-coordinate">FAST / DEEP ANALYSIS</span>
  </div>;
}

function WorkScene({ project, previousProject, nextProject }: { project: Project; previousProject?: Project; nextProject?: Project }) {
  const evidence = workEvidence[project.id];
  const [expanded, setExpanded] = useState(false);
  const words = project.title === 'AI × Recruitment' ? ['AI ×', 'Recruitment'] : project.title.split(' ');
  return <article className={`work-scene scene-${project.id}`} id={`work-${project.id}`} aria-labelledby={`title-${project.id}`}>
    <div className="scene-inner">
      <div className="scene-topline"><span>{project.index} / SELECTED WORK</span><span>{project.category}</span></div>
      <div className="scene-layout">
        <div className="scene-copy">
          <span className="scene-number" aria-hidden="true">{project.index}</span>
          <h3 id={`title-${project.id}`} aria-label={project.title}><span className="scene-title-follow">{words.map(word => <span className="scene-title-mask" key={word}><span className="scene-title-line" aria-hidden="true">{word}</span></span>)}</span></h3>
          <p className="scene-subtitle">{project.subtitle}</p>
          <div className="scene-editorial"><h4>{project.heading}</h4><p>{evidence.problem}</p></div>
          <a className="work-repository" href={evidence.repo} target="_blank" rel="noopener noreferrer" aria-label={`查看 ${project.title} 源码，新窗口打开`}>查看项目源码 <span aria-hidden="true">↗</span></a>
        </div>
        <div className={`scene-art ${expanded ? 'is-expanded' : ''}`}>
          <div className="scene-art-crop"><div className="scene-art-parallax"><div className="scene-art-tilt" aria-hidden="true"><ProjectVisual kind={project.id} /></div></div></div>
          <div className="scene-art-caption"><span>{project.label} / 链路示意，非运行数据</span><button type="button" data-cursor="action" aria-label={`${project.subtitle}：${expanded ? '收拢' : '展开'}主视觉`} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><span>{expanded ? '收拢视图' : '探索结构'}</span><i aria-hidden="true">{expanded ? '−' : '+'}</i></button></div>
        </div>
      </div>
      <div className="work-evidence">
        <div><h4><span>01 /</span> 关键决策</h4><p>{evidence.decision}</p></div>
        <div><h4><span>02 /</span> 实现依据</h4><p>{evidence.evidence}</p><div className="work-evidence-links">{evidence.links.map(link => <a href={link.url} key={link.url} target="_blank" rel="noopener noreferrer" aria-label={`${project.title}：${link.label}，新窗口打开`}>{link.label}<span aria-hidden="true">↗</span></a>)}</div></div>
      </div>
      <div className="scene-bottomline"><div><span>SCOPE / 当前边界</span><p>{evidence.boundary}</p></div><div><span>TECHNOLOGY / 技术方向</span><p>{project.stack}</p></div></div>
      <nav className="work-project-pagination" aria-label={`${project.title} 项目导航`}>
        {previousProject && <a href={`#work-${previousProject.id}`} className="work-project-previous"><span aria-hidden="true">←</span><div><small>上一个项目</small><strong>{previousProject.title}</strong></div></a>}
        <a className="work-project-next" href={nextProject ? `#work-${nextProject.id}` : '#skills'} aria-label={nextProject ? `下一个项目：${nextProject.title}` : '继续阅读技术能力'}><div><small>{nextProject ? '继续探索' : '继续阅读'}</small><strong>{nextProject ? nextProject.title : '技术能力与经历'}</strong></div><span aria-hidden="true">→</span></a>
      </nav>
    </div>
  </article>;
}

export default function SelectedWork({ projects, compact, disabled }: { projects: Project[]; compact: boolean; disabled: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root || disabled || !('IntersectionObserver' in window)) return;
    // Content always remains visible. Only artwork plays an entrance once;
    // no scroll-derived transforms, sticky positions, or cross-project layers.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('work-art-entered');
        observer.unobserve(entry.target);
      }
    }, { threshold: .12 });
    const visuals = Array.from(root.querySelectorAll('.scene-delivery .scene-art-crop, .scene-matching .scene-art-crop'));
    visuals.forEach(visual => observer.observe(visual));
    return () => { observer.disconnect(); visuals.forEach(visual => visual.classList.remove('work-art-entered')); };
  }, [disabled]);
  return <section className={`selected-work work-linear ${disabled ? 'work-still' : ''}`} id="work" ref={rootRef} aria-labelledby="work-heading">
    <span id="intro" className="work-legacy-anchor" aria-hidden="true" />
    <div className="work-prologue section-shell"><p className="eyebrow">SELECTED WORK / 01—03</p><h2 id="work-heading">Selected projects<span>.</span></h2><div><p>从 Agent 的工程协作，到交易一致性，<br />再到自己的求职工具。记录实现，也记录约束。</p><span>SCROLL TO EXPLORE ↓</span></div></div>
    <div className="work-scenes">{projects.map((project, index) => <Fragment key={project.id}><div className="work-flow-marker" aria-hidden="true" />{project.id === 'backend' ? <WorkflowFeature disabled={disabled} compact={compact} /> : <WorkScene project={project} previousProject={projects[index - 1]} nextProject={projects[index + 1]} />}</Fragment>)}</div>
    <div className="work-context section-shell"><p>这些项目由我主导方案、推进与验收，使用 AI Agent 协作开发。链接指向具体版本的实现与测试源码，不代表生产环境验证。</p><p><span>团队经历 / 2026.07—08</span>在杭州智航星辰人工智能科技有限公司做 Go 后端实习，参与企业课程平台开发，跟进 AI 客服系统的问题定位、修复和联调。</p></div>
  </section>;
}
