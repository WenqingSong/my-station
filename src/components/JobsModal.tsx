import { useCallback, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useModalFocus } from '../useModalFocus';
import './jobs-modal.css';

type JobsModalProps = {
  onClose: () => void;
  disabled: boolean;
};

export default function JobsModal({ onClose, disabled }: JobsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const exitTimeline = useRef<gsap.core.Timeline | null>(null);
  const closingRef = useRef(false);
  const reduced = disabled;

  const finishClose = useCallback(() => {
    document.documentElement.classList.remove('jobs-modal-open');
    onClose();
  }, [onClose]);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog || reduced) {
      finishClose();
      return;
    }
    exitTimeline.current = gsap.timeline({ onComplete: finishClose })
      .to(dialog, { opacity: 0, y: 14, duration: .24, ease: 'power2.in' })
      .to(overlay, { opacity: 0, duration: .2, ease: 'power2.in' }, '-=.1');
  }, [finishClose, reduced]);

  useModalFocus(dialogRef, true, requestClose);

  useEffect(() => {
    document.documentElement.classList.add('jobs-modal-open');
    const overlay = overlayRef.current;
    const dialog = dialogRef.current;
    if (!overlay || !dialog) return undefined;
    if (reduced) {
      gsap.set([overlay, dialog], { opacity: 1, y: 0, scale: 1 });
      return undefined;
    }
    const items = dialog.querySelectorAll('.jobs-modal-item');
    const timeline = gsap.timeline();
    timeline
      .fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: .32, ease: 'power3.out' })
      .fromTo(dialog,
        { opacity: 0, y: 22, scale: .985 },
        { opacity: 1, y: 0, scale: 1, duration: .42, ease: 'power3.out' }, '-=.14')
      .fromTo(items,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: .3, stagger: .05, ease: 'power3.out' }, '-=.26');
    return () => { timeline.kill(); };
  }, [reduced]);

  useEffect(() => () => {
    exitTimeline.current?.kill();
    document.documentElement.classList.remove('jobs-modal-open');
  }, []);

  return (
    <div className="jobs-modal-overlay" ref={overlayRef} onClick={requestClose} data-lenis-prevent>
      <div
        className="jobs-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="jobs-modal-title"
        aria-describedby="jobs-modal-desc"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="jobs-modal-item jobs-modal-eyebrow">Project redirect</p>
        <h2 className="jobs-modal-item jobs-modal-title" id="jobs-modal-title">前往 Offer 捕手？</h2>
        <p className="jobs-modal-item jobs-modal-desc" id="jobs-modal-desc">
          你正在通过我的项目入口访问 Offer 捕手。这是一个面向学生求职场景的岗位智能匹配项目，用于展示我的后端开发与 AI 工程实践。是否继续查看项目？
        </p>
        <div className="jobs-modal-item jobs-modal-actions">
          <button type="button" className="jobs-modal-btn secondary" onClick={requestClose}>留在个人主页</button>
          <button
            type="button"
            className="jobs-modal-btn primary"
            data-initial-focus
            onClick={() => { window.location.href = '/offer/'; }}
          >
            查看 Offer 捕手 <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
