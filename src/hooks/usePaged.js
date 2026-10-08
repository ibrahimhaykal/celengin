import { useState } from 'react';

// Client-side "load more": shows `step` items, then `step` more per click.
export function usePaged(items, step) {
  const [count, setCount] = useState(step);
  return {
    visible: items.slice(0, count),
    remaining: Math.max(0, items.length - count),
    step,
    more: () => setCount((c) => c + step),
    less: count > step ? () => setCount(step) : null,
  };
}
