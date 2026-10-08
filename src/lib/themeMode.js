import { useEffect, useState } from 'react';

// Theme choice: 'system' (follow Windows), 'light' or 'dark'. Stored per device; the inline script in
// index.html reads the same key before first paint.
const KEY = 'celengin:theme';
const MODES = ['system', 'light', 'dark'];
const systemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const readPref = () => {
  try {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
};

const apply = (pref) => {
  const root = document.documentElement;
  const next = pref === 'dark' || (pref === 'system' && systemDark()) ? 'dark' : 'light';
  if (root.dataset.theme === next) return;
  // Switch in one frame: without this every element's own color transition fades separately.
  root.classList.add('theme-switching');
  root.dataset.theme = next;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
};

export function useThemeMode() {
  const [mode, setMode] = useState(readPref);

  useEffect(() => {
    apply(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {
      // storage unavailable: the choice lasts for this session only
    }
    if (mode !== 'system') return;
    // Following Windows: react when the OS switches between light and dark.
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return [mode, setMode];
}
