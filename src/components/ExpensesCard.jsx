import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { usePaged } from '../hooks/usePaged';
import { pct, rupiah } from '../lib/format';
import { Card, CardHeader, EditableAmount, EmptyState, GhostButton, IconButton, LoadMore } from './ui';

// Monthly budget per category next to what was really spent this month (ledger rows with that category).
// The budget amount is edited in place; clicking the name renames it.
export default function ExpensesCard({ expenses, total, spentByCategory, onAdd, onUpdate, onRename, onDelete }) {
  const page = usePaged(expenses, 5);
  const spentOf = (name) => spentByCategory[name.trim().toLowerCase()] || 0;
  const totalSpent = expenses.reduce((s, x) => s + spentOf(x.name), 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Budget Bulanan"
        subtitle={`Kepake ${rupiah(totalSpent)} dari ${rupiah(total)} bulan ini`}
        action={
          <GhostButton onClick={onAdd}>
            <Plus size={14} /> Kategori
          </GhostButton>
        }
      />
      <ul className="px-3 pb-4">
        {page.visible.map((x) => {
          const spent = spentOf(x.name);
          const used = pct(spent, x.amount);
          const over = spent > x.amount;
          const near = !over && x.amount > 0 && used >= 80;
          return (
            <li
              key={x.id}
              className="group grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              <div className="min-w-0">
                <button
                  onClick={() => onRename(x)}
                  title="Klik buat ganti nama"
                  className="block max-w-full truncate text-left text-sm text-zinc-200 transition-colors hover:text-white hover:underline"
                >
                  {x.name}
                </button>
                {over && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-rose-300">
                    <AlertTriangle size={11} /> Udah lewat budget, rem dikit ya
                  </p>
                )}
                {near && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-300">
                    <AlertTriangle size={11} /> Hampir abis, sisa {rupiah(x.amount - spent)}
                  </p>
                )}
                <div className="mt-1.5 h-1 max-w-[200px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-rose-400' : near ? 'bg-amber-400' : 'bg-zinc-400'}`}
                    style={{ width: `${Math.min(100, used)}%` }}
                  />
                </div>
              </div>
              <span className="text-right text-sm tabular-nums">
                <span className={over ? 'font-semibold text-rose-400' : 'text-zinc-200'}>{rupiah(spent)}</span>
                <span className="flex items-center justify-end gap-1 text-[11px] text-zinc-500">
                  /
                  <EditableAmount value={x.amount} onSave={(v) => onUpdate(x.id, { amount: v })} className="text-[11px] text-zinc-400" />
                </span>
              </span>
              <IconButton
                onClick={() => onDelete(x)}
                title="Hapus budget"
                danger
                className="opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 size={14} />
              </IconButton>
            </li>
          );
        })}
        {expenses.length === 0 && <EmptyState text="Belum ada budget. Yuk bikin satu." />}
      </ul>
      <div className="px-6 pb-5 empty:hidden">
        <LoadMore remaining={page.remaining} step={page.step} onMore={page.more} onLess={page.less} />
      </div>
    </Card>
  );
}
