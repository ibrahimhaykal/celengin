import { CalendarClock, CheckCircle2, Circle, Link2, PartyPopper, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePaged } from '../hooks/usePaged';
import { daysUntil, formatDate, pct, rupiah } from '../lib/format';
import { MILESTONE_COLOR } from '../lib/theme';
import { Card, CardHeader, EditableAmount, EmptyState, GhostButton, IconButton, LoadMore } from './ui';

export default function MilestoneRoadmap({ milestones, onAdd, onUpdate, onEdit, onDelete }) {
  const page = usePaged(milestones, 4);
  const done = milestones.filter((m) => m.current_amount >= m.target_amount).length;

  // Group the visible page by deadline year for the timeline.
  const byYear = page.visible.reduce((acc, m) => {
    const year = m.deadline?.slice(0, 4) || 'Tanpa deadline';
    (acc[year] ||= []).push(m);
    return acc;
  }, {});

  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title="Target Impian"
        subtitle={`${done} dari ${milestones.length} target udah kecapai`}
        action={
          <GhostButton onClick={onAdd}>
            <Plus size={14} /> Target
          </GhostButton>
        }
      />
      <div className="px-6 pb-6">
        {Object.entries(byYear).map(([year, items]) => (
          <div key={year} className="relative border-l border-white/[0.08] pb-2 pl-6 last:pb-0">
            <span className="absolute top-0.5 -left-[5px] h-2.5 w-2.5 rounded-full border-2 border-zinc-950 bg-zinc-500" />
            <p className="mb-3 text-xs font-semibold tracking-wider text-zinc-500">{year}</p>
            <div className="space-y-3 pb-4">
              {items.map((m) => (
                <MilestoneItem key={m.id} m={m} onUpdate={onUpdate} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </div>
        ))}
        {milestones.length === 0 && <EmptyState text="Belum ada target. Mau nabung buat apa?" />}
        <LoadMore
          remaining={page.remaining}
          step={page.step}
          onMore={page.more}
          onLess={page.less}
          className="mt-2"
        />
      </div>
    </Card>
  );
}

function MilestoneItem({ m, onUpdate, onEdit, onDelete }) {
  const progress = Math.min(100, pct(m.current_amount, m.target_amount));
  const isFlag = m.target_amount === 1 && !m.track_category; // yes/no milestone (e.g. debt fully paid)
  const tracked = Boolean(m.track_category); // progress fills itself from spending in that category
  const done = progress >= 100;
  const days = m.deadline ? daysUntil(m.deadline) : null;
  const color = MILESTONE_COLOR[m.category] || 'var(--color-zinc-400)';

  return (
    <div className="group rounded-xl border border-white/[0.06] bg-zinc-950/40 p-4 transition-colors hover:border-white/[0.12]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium text-zinc-100">
            {done && <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />}
            <span className="truncate">{m.title}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
            {m.category && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {m.category}
              </span>
            )}
            {m.deadline && (
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={12} />
                {formatDate(m.deadline, false)}
                {!done && days != null && (
                  <span className={days < 0 ? 'text-rose-400' : days <= 30 ? 'text-amber-400' : ''}>
                    · {days < 0 ? `udah lewat ${-days} hari` : days === 0 ? 'hari ini!' : days <= 30 ? `${days} hari lagi, gas dikit!` : `${days} hari lagi`}
                  </span>
                )}
              </span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-sm font-semibold tabular-nums text-zinc-300">{progress.toFixed(0)}%</span>
          <IconButton
            onClick={() => onEdit(m)}
            title="Atur target"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Pencil size={14} />
          </IconButton>
          <IconButton
            onClick={() => onDelete(m)}
            title="Hapus target"
            danger
            className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
      {m.notes && <p className="mt-2 text-xs leading-relaxed text-zinc-400">{m.notes}</p>}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: color }} />
      </div>
      <div className="mt-2.5 text-sm">
        {isFlag ? (
          <button
            onClick={() => onUpdate(m.id, done ? 0 : 1)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${done ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' : 'text-zinc-400 ring-white/10 hover:bg-white/[0.05] hover:text-zinc-200'}`}
          >
            {done ? <PartyPopper size={14} /> : <Circle size={14} />}
            {done ? 'Lunas! Keren' : 'Tandai lunas'}
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-1.5 text-zinc-500">
            {tracked ? (
              <span className="font-medium tabular-nums text-zinc-200">{rupiah(m.current_amount)}</span>
            ) : (
              <EditableAmount value={m.current_amount} onSave={(v) => onUpdate(m.id, v)} className="font-medium text-zinc-200" />
            )}
            <span>/ {rupiah(m.target_amount)}</span>
            {tracked && (
              <span
                className="ml-1 inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-0.5 text-[11px] text-sky-300"
                title="Progres keisi sendiri dari pengeluaran berkategori ini"
              >
                <Link2 size={11} /> otomatis dari "{m.track_category}" sejak {formatDate(m.track_since, false)}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
