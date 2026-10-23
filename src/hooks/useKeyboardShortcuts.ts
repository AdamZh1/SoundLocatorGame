import { useEffect, useRef } from 'react';

// Keys are KeyboardEvent.key values (' ' for Space, 'Enter', 'n', ...); letters match either case.
export type ShortcutBindings = Partial<Record<string, () => void>>;

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const useKeyboardShortcuts = (bindings: ShortcutBindings, enabled: boolean) => {
  // Latest bindings in a ref so the listener is attached once, not on every render
  const bindingsRef = useRef(bindings);
  useEffect(() => {
    bindingsRef.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = bindingsRef.current[key];
      if (!handler) return;
      e.preventDefault(); // stops Space from scrolling or re-clicking a focused button
      handler();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
};
