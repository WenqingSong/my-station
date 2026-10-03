import { useLayoutEffect, type RefObject } from 'react';

// Both temporary overlays share the same keyboard and background contract.
export function useModalFocus(rootRef: RefObject<HTMLDivElement>, active: boolean, dismiss: () => void) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const background = Array.from(document.querySelectorAll<HTMLElement>('.site-header, main, .skip-link'));
    const original = background.map(element => element.inert);
    background.forEach(element => { element.inert = true; });
    const controls = () => Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]'));
    (root.querySelector<HTMLElement>('[data-initial-focus]') || controls()[0])?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); dismiss(); }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !root.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      background.forEach((element, index) => { element.inert = original[index]; });
      const target = previous?.isConnected && previous !== document.body && !previous.closest('.opening')
        ? previous : document.querySelector<HTMLElement>('.brand');
      target?.focus({ preventScroll: true });
    };
  }, [active, dismiss, rootRef]);
}
