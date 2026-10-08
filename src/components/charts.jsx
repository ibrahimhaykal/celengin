import { useState } from 'react';
import { pct, rupiah } from '../lib/format';

// Horizontal stacked bar with 2px surface gaps and a hover tooltip per segment.
// segments: [{ key, label, value, color }]
export function StackedBar({ segments, height = 10, label }) {
  const [hover, setHover] = useState(null);
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return <div className="h-2.5 rounded-full bg-zinc-800" />;

  let offset = 0;
  const placed = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const width = pct(s.value, total);
      const item = { ...s, width, center: offset + width / 2 };
      offset += width;
      return item;
    });
  const active = placed.find((s) => s.key === hover);

  return (
    <div className="relative" role="img" aria-label={label}>
      {active && (
        <div
          className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-xs shadow-xl"
          style={{ left: `${Math.min(88, Math.max(12, active.center))}%` }}
        >
          <p className="flex items-center gap-1.5 text-zinc-300">
            <span className="h-2 w-2 rounded-sm" style={{ background: active.color }} />
            {active.label}
          </p>
          <p className="mt-0.5 font-semibold text-zinc-50 tabular-nums">
            {rupiah(active.value)} <span className="font-normal text-zinc-400">· {active.width.toFixed(1)}%</span>
          </p>
        </div>
      )}
      <div className="flex gap-[2px] py-1.5" onMouseLeave={() => setHover(null)}>
        {placed.map((s, i) => (
          <div
            key={s.key}
            onMouseEnter={() => setHover(s.key)}
            className="-my-1.5 py-1.5 transition-opacity"
            style={{ width: `${s.width}%`, opacity: hover && hover !== s.key ? 0.35 : 1 }}
          >
            <div
              className={`${i === 0 ? 'rounded-l-full' : ''} ${i === placed.length - 1 ? 'rounded-r-full' : ''}`}
              style={{ height, background: s.color, minWidth: 3 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// items: [{ key, label, value, color, share? }]
export function Legend({ items }) {
  return (
    <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {items.map((it) => (
        <li key={it.key} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-zinc-400">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: it.color }} />
            <span className="truncate">{it.label}</span>
          </span>
          <span className="shrink-0 tabular-nums text-zinc-200">
            {rupiah(it.value)}
            {it.share != null && <span className="ml-1.5 text-xs text-zinc-500">{it.share.toFixed(0)}%</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
