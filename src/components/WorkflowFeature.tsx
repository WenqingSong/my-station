import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import './workflow-feature.css';
import BrandImage from './BrandImage';
import { collaboration, reviewFrames } from './workflow-story';
import { principles, workflowSource } from './workflow-principles';

export const workflowDocsPath = '/projects/agent-workflow/';
const sourceRepo = 'https://cnb.cool/framework-station/agent-workflow';
const chapters = ['协作过程', '设计思想', '版本与审查'];

function usePlayback(count: number, disabled: boolean, duration: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    let intersecting = false;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); }, { threshold: .2 });
    observer.observe(host);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  const running = playing && visible && !disabled;
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setStep(value => (value + 1) % count), duration);
    return () => clearTimeout(timer);
  }, [step, running, count, duration]);
  return { ref, step, running, playing, select(index: number) { setStep(index); setPlaying(false); }, toggle() { setPlaying(value => !value); } };
}

function Playback({ playing, disabled, onToggle, label }: { playing: boolean; disabled: boolean; onToggle: () => void; label: string }) {
  return <button className="wf-play" type="button" disabled={disabled} onClick={onToggle} aria-label={`${playing ? '暂停' : '播放'}${label}`} aria-pressed={playing && !disabled}><span aria-hidden="true">{playing && !disabled ? 'Ⅱ' : '▷'}</span>{disabled ? '手动浏览' : playing ? '暂停' : '播放'}</button>;
}
function EntryLinks() {
  return <div className="wf-entry-links"><a className="wf-docs-entry" href={workflowDocsPath}>阅读技术文档 <span aria-hidden="true">↗</span></a><a className="wf-source-entry" href={sourceRepo} target="_blank" rel="noopener noreferrer">查看代码仓库 <span aria-hidden="true">↗</span></a></div>;
}
function RoleIcon({ index }: { index: number }) {
  const shapes = [<><rect x="5" y="4" width="14" height="17" rx="3" /><path d="M9 9h6m-6 4h6m-6 4h3" /></>, <><path d="m5 18 1-5L17 2l5 5L11 18l-6 1m9-14 5 5M4 23h18" /></>, <><path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" /></>, <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6m-14-11 2 2 4-4" /></>, <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM8 12l3 3 5-6" /></>, <><path d="m3 12 18-9-9 18-2-7-7-2Zm7 2L21 3" /></>];
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[index]}</svg>;
}
const routes = ['', 'M150 85H500', 'M500 85H850', 'M850 85Q970 85 970 190T850 295', 'M850 295H500', 'M500 295H150'];
function Collaboration({ disabled }: { disabled: boolean }) {
  const player = usePlayback(collaboration.length, disabled, 5800);
  const current = collaboration[player.step];
  return <div className="wf-collaboration" ref={player.ref} data-running={player.running}>
    <div className="wf-panel-heading"><div><span className="wf-overline">AGENT COLLABORATION</span><h4>同一项任务，各自独立判断。</h4></div><Playback playing={player.playing} disabled={disabled} onToggle={player.toggle} label="协作流程" /></div>
    <div className="scene-art wf-flow-art"><div className="scene-art-crop"><div className="wf-flow-map" aria-label="六角色协作流程">
      <svg className="wf-flow-lines" viewBox="0 0 1000 380" preserveAspectRatio="none" aria-hidden="true"><path className="wf-flow-track" d="M150 85H850Q970 85 970 190T850 295H150" /><path className="wf-flow-completed" pathLength="1" strokeDasharray={`${player.step / 5} 1`} d="M150 85H850Q970 85 970 190T850 295H150" />{player.step > 0 && !disabled && player.running && <circle className="wf-task-packet" key={player.step} r="4"><animateMotion path={routes[player.step]} dur="1.4s" fill="freeze" /></circle>}</svg>
      {collaboration.map((role, index) => <button key={role.role} type="button" className={`wf-role${player.step === index ? ' is-current' : ''}${player.step > index ? ' is-complete' : ''}`} style={{ gridColumn: role.cell % 3 + 1, gridRow: Math.floor(role.cell / 3) + 1, '--role-index': index } as CSSProperties} onClick={() => player.select(index)} aria-pressed={player.step === index} aria-controls="wf-role-detail" aria-label={`${role.label}：${role.role}`}><span className="wf-role-symbol"><RoleIcon index={index} /><i aria-hidden="true">{player.step > index ? '✓' : role.symbol}</i></span><b>{role.label}</b><small>{role.role}</small><span className="wf-role-status">{player.step === index ? '正在交接' : player.step > index ? '已交接' : '等待接续'}</span></button>)}
      <div className="wf-shared-task"><span className="framework-mark" aria-hidden="true" /><span>一个任务，一份可追溯的上下文。</span></div>
    </div></div></div>
    <div className="wf-role-detail" id="wf-role-detail" role="region" aria-label="当前角色职责"><div className="wf-role-detail-copy" key={player.step}><span className="wf-overline">{current.symbol} / {current.role}</span><h5>{current.verb}</h5><p>{current.body}</p></div><div className="wf-artifact" key={current.role}><span>交给下一位的依据</span><code>{current.artifact}</code><p>{current.boundary}</p></div></div>
    <p className="wf-panel-note">COMPLEX 路线示意 · 点击角色可暂停探索。简单任务可省去独立设计审批；结构交付由 Architect 产出，经 OwnerGate 验证，不经过 Cleaner。</p>
  </div>;
}

function DesignThinking() {
  const [author, setAuthor] = useState(0);
  const [selected, setSelected] = useState(0);
  const person = principles[author];
  const idea = person.ideas[selected];
  const source = 'source' in idea ? idea.source : 'https://openai.com/index/harness-engineering/';
  const sourceLabel = 'sourceLabel' in idea ? idea.sourceLabel : 'Harness engineering';
  return <div className="wf-thinking">
    <div className="wf-panel-heading"><div><span className="wf-overline">THE THINKING BEHIND IT</span><h4>工程经验，成为协作的约束。</h4></div></div>
    <div className="wf-author-switch" role="group" aria-label="选择思想来源">{principles.map((item, index) => <button type="button" key={item.name} onClick={() => { setAuthor(index); setSelected(0); }} aria-pressed={author === index}>{item.short}<span>{index === 0 ? '软件工程' : 'Agent 工程'}</span></button>)}</div>
    <div className="wf-philosophy-layout">
      <figure className={`wf-person wf-person-${author}`} key={person.name}><div className="wf-person-image"><BrandImage src={person.image} alt={person.imageAlt} width={author === 0 ? 960 : 256} height={author === 0 ? 756 : 256} loading="eager" /></div><figcaption><span className="wf-overline">{person.category}</span><h5>{person.name}</h5><p>{person.intro}</p><a href={source} target="_blank" rel="noopener noreferrer">阅读参考原文 <span aria-hidden="true">↗</span></a></figcaption></figure>
      <div className="wf-principle-detail"><div className="wf-idea-tabs" role="group" aria-label="选择设计原则">{person.ideas.map((item, index) => <button type="button" key={item.label} onClick={() => setSelected(index)} aria-pressed={selected === index}>{item.label}</button>)}</div><div className="wf-idea-copy" key={`${author}-${selected}`}><h5>{idea.title}</h5><p className="wf-reference"><span>我参考的原则</span>{idea.reference}</p><p className="wf-application"><span>在这个项目里，我的取舍</span>{idea.application}</p><div className="wf-principle-diagram" aria-label="设计关系">{idea.diagram.map((item, index) => <span key={item}>{index > 0 && <i aria-hidden="true">→</i>}<b>{item}</b></span>)}</div><div className="wf-implementation"><p>{idea.implementation}</p><a href={`${workflowSource}${idea.file}#L${idea.line}`} target="_blank" rel="noopener noreferrer">查看实现依据 <span aria-hidden="true">↗</span><code>{idea.file.split('/').pop()}</code></a></div><a className="wf-article-source" href={source} target="_blank" rel="noopener noreferrer">参考：{sourceLabel} ↗</a></div></div>
    </div>
    <p className="wf-panel-note">设计参考，不代表作者或机构参与或背书。角色写入范围属于协议约束，校验器不验证 Agent 身份，也不提供操作系统层的权限隔离。</p>
  </div>;
}
function CommitReview({ disabled }: { disabled: boolean }) {
  const player = usePlayback(reviewFrames.length, disabled, 5200);
  const frame = reviewFrames[player.step];
  return <div className="wf-review-demo" ref={player.ref} data-tone={frame.tone} data-running={player.running}>
    <div className="wf-panel-heading"><div><span className="wf-overline">COMMIT-BOUND REVIEW</span><h4>代码变了，审查就要跟上。</h4></div><Playback playing={player.playing} disabled={disabled} onToggle={player.toggle} label="审查流程" /></div>
    <div className="wf-review-layout"><div className="wf-version-stage"><div className="wf-version-rail"><div className="wf-version is-visible"><span>最初的实现</span><strong>A</strong><small>commit A</small><i /></div><span className={`wf-commit-progress${player.step >= 2 ? ' has-change' : ''}`} /><div className={`wf-version wf-version-next${player.step >= 2 ? ' is-visible' : ''}`}><span>新的业务版本</span><strong>B</strong><small>commit B</small><i /></div></div><div className={`wf-review-binding bind-${frame.target === 'B' ? 'new' : 'old'}`}><svg viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true"><path d={frame.target === 'B' ? 'M450 0V25Q450 35 438 35H312Q300 35 300 47V70' : 'M150 0V25Q150 35 162 35H288Q300 35 300 47V70'} /></svg><span>审查绑定 / {frame.target}</span></div><div className="wf-verdict" key={player.step}><span>INDEPENDENT REVIEW</span><strong>{frame.review}</strong><span className="wf-verdict-stamp"><i />{frame.stamp}</span></div></div><div className="wf-review-caption"><div key={player.step} className="wf-review-copy"><span className="wf-overline">{String(player.step + 1).padStart(2, '0')} / 05</span><h5>{frame.title}</h5><p>{frame.text}</p></div><div className="wf-review-navigation" aria-label="审查演示步骤">{reviewFrames.map((item, index) => <button key={item.title} type="button" aria-label={`查看步骤 ${index + 1}：${item.title}`} aria-pressed={player.step === index} onClick={() => player.select(index)}><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div></div></div>
    <div className="wf-review-note"><strong>一次通过，有它的适用范围。</strong><p>当前任务白名单内的审查元数据提交可以保留绑定；业务代码或测试变化需要重新审查。A / B 为示意版本名。校验器检查绑定关系，不能代替代码正确性的判断。</p></div>
  </div>;
}

export default function WorkflowFeature({ disabled }: { disabled: boolean; compact: boolean }) {
  const [chapter, setChapter] = useState(0);
  const [shown, setShown] = useState(0);
  const [changing, setChanging] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chapter === shown) { setChanging(false); return; }
    if (disabled) { setShown(chapter); setChanging(false); return; }
    setChanging(true);
    const timer = window.setTimeout(() => { setShown(chapter); setChanging(false); }, 180);
    return () => clearTimeout(timer);
  }, [chapter, shown, disabled]);
  function keyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % chapters.length;
    else if (event.key === 'ArrowLeft') next = (index + chapters.length - 1) % chapters.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = chapters.length - 1;
    else return;
    event.preventDefault(); setChapter(next);
    tabsRef.current?.querySelectorAll('button')[next]?.focus();
  }
  return <article className="work-scene scene-backend workflow-feature" id="work-backend" aria-labelledby="title-backend">
    <div className="scene-inner"><div className="wf-masthead"><span><span className="framework-mark" aria-hidden="true" />AGENT WORKFLOW</span><span>01 / SELECTED WORK</span></div>
      <header className="wf-hero"><p className="wf-project-name">Agent Workflow</p><p className="wf-kicker">Software Engineering × AI Agent Engineering</p><h3 id="title-backend" aria-label="Agent Workflow"><span className="scene-title-mask"><span className="scene-title-line">AI 会写代码。</span></span><span className="scene-title-mask"><span className="scene-title-line wf-title-secondary">协作，需要工程。</span></span></h3><p className="wf-lead">让多个 AI 像一支软件工程团队一样协作。<br />分工、交接、独立审查，让每一次交付都有据可查。</p><EntryLinks /></header>
      <div className="wf-experience"><div className="wf-experience-bar"><span>深入 Agent Workflow</span><div className="wf-chapters" ref={tabsRef} role="tablist" aria-label="探索 Agent Workflow"><i className="wf-tab-indicator" style={{ '--tab': chapter } as CSSProperties} aria-hidden="true" />{chapters.map((label, index) => <button key={label} type="button" role="tab" id={`wf-tab-${index}`} aria-controls="wf-experience-panel" aria-selected={chapter === index} tabIndex={chapter === index ? 0 : -1} onClick={() => setChapter(index)} onKeyDown={event => keyboard(event, index)}>{label}</button>)}</div></div><div className={`wf-experience-panel${changing ? ' is-changing' : ''}`} id="wf-experience-panel" role="tabpanel" aria-labelledby={`wf-tab-${shown}`} aria-busy={changing}><div className="wf-chapter-content" key={shown}>{shown === 0 ? <Collaboration disabled={disabled} /> : shown === 1 ? <DesignThinking /> : <CommitReview disabled={disabled} />}</div></div></div>
      <footer className="wf-footer"><div><span>Go 校验器 · Git 版本证据 · 独立会话</span><p>v3.4.0 · 源码核对至 239450d · 演示不运行 Agent</p></div><a href="#work-delivery">下一个项目 · SurgeCart <span aria-hidden="true">↗</span></a></footer>
      <p className="wf-credits">思想参考与实现说明可在「设计思想」中切换阅读。<a href="https://commons.wikimedia.org/wiki/File:Robert_C._Martin_surrounded_by_computers.jpg" target="_blank" rel="noopener noreferrer">人物摄影：Angelacleancoder</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>（显示裁切与灰度）。OpenAI 标志归 OpenAI 所有。</p>
    </div>
  </article>;
}
