import { useState } from 'react';
import { AlertCircle, CalendarClock, Plus, Sparkles, Trash2 } from 'lucide-react';
import { pct, rupiah } from '../lib/format';
import { StackedBar } from './charts';
import { Card, CardHeader, EditableAmount, EmptyState, GhostButton, IconButton } from './ui';

// Neutral steps for spending categories (wallets already own the categorical hues on this page).
const CATEGORY_SHADES = [200, 400, 500, 600, 700].map((n) => `var(--color-zinc-${n})`);
const MAX_CATEGORIES = CATEGORY_SHADES.length;

// Default "Real" tab: this month's actual spending by category from the ledger.
// "Rencana" tab: the editable salary plan (plan_items), which only applies from planStart.
export default function CashflowCard({ actual, plan, planStart, planActive, planActions }) {
  const [tab, setTab] = useState('real');

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Cashflow"
        subtitle={tab === 'real' ? 'Bulan ini duitmu larinya ke mana aja' : `Rencananya masuk ${rupiah(plan.income)} / bulan`}
        action={
          <div className="flex rounded-lg bg-white/[0.04] p-0.5 text-[11px]">
            {[
              ['real', 'Real'],
              ['plan', 'Rencana'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors ${tab === key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />
      <div className="px-6 pb-6">
        {tab === 'real' ? <RealView actual={actual} /> : <PlanView {...{ plan, planStart, planActive, planActions }} />}
      </div>
    </Card>
  );
}

function RealView({ actual }) {
  const rows = actual.byCategory || [];
  const top = rows.slice(0, MAX_CATEGORIES - 1);
  const rest = rows.slice(MAX_CATEGORIES - 1);
  const segments = [
    ...top.map((r, i) => ({ key: r.category || '_none', label: r.category || 'Tanpa kategori', value: r.total, n: r.n, color: CATEGORY_SHADES[i] })),
    ...(rest.length
      ? [{ key: '_rest', label: 'Lainnya', value: rest.reduce((s, r) => s + r.total, 0), n: rest.reduce((s, r) => s + r.n, 0), color: CATEGORY_SHADES[MAX_CATEGORIES - 1] }]
      : []),
  ];

  if (!segments.length) return <EmptyState icon={Sparkles} text="Bulan ini belum ada pengeluaran. Irit banget, mantap!" />;

  return (
    <>
      <StackedBar segments={segments} height={12} label="Pengeluaran bulan ini per kategori" />
      <div className="mt-5 space-y-2.5">
        {segments.map((c) => (
          <div key={c.key} className="flex items-center justify-between text-sm">
            <span className="flex min-w-0 items-center gap-2 text-zinc-400">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
              <span className="truncate">{c.label}</span>
              <span className="text-xs text-zinc-600">{c.n}×</span>
            </span>
            <span className="tabular-nums text-zinc-200">
              {rupiah(c.value)}
              <span className="ml-1.5 inline-block w-8 text-right text-xs text-zinc-500">{pct(c.value, actual.expense).toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-between border-t border-white/[0.06] pt-3 text-sm">
        <span className="text-zinc-500">Total keluar</span>
        <span className="font-semibold tabular-nums text-rose-400">{rupiah(actual.expense)}</span>
      </div>
    </>
  );
}

// Editable plan: income lines, fixed expense lines, then the computed flexible total and savings.
function PlanView({ plan, planStart, planActive, planActions }) {
  const { onAdd, onUpdate, onRename, onDelete, onPlanStart } = planActions;
  const colorOf = Object.fromEntries(plan.cashflow.map((c) => [c.key, c.color]));

  return (
    <>
      <label
        className={`mb-4 flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-xs ${planActive ? 'bg-white/[0.03] text-zinc-400' : 'bg-amber-500/10 text-amber-300'}`}
      >
        <CalendarClock size={13} />
        {planActive ? 'Rencana jalan sejak' : 'Rencana mulai jalan'}
        <input
          type="date"
          value={planStart}
          onChange={(e) => e.target.value && onPlanStart(e.target.value)}
          className="rounded-md border border-white/[0.08] bg-zinc-950 px-2 py-0.5 text-xs text-zinc-100 outline-none focus:border-sky-500"
        />
      </label>

      <StackedBar segments={plan.cashflow} height={12} label="Rencana alokasi pemasukan bulanan" />

      <PlanSection title="Pemasukan" onAdd={() => onAdd('income')}>
        {plan.planIncome.map((p) => (
          <PlanRow key={p.id} item={p} tone="text-emerald-400" onUpdate={onUpdate} onRename={onRename} onDelete={onDelete} />
        ))}
      </PlanSection>

      <PlanSection title="Pengeluaran tetap" onAdd={() => onAdd('expense')}>
        {plan.planExpense.map((p) => (
          <PlanRow
            key={p.id}
            item={p}
            color={colorOf[`p${p.id}`]}
            share={pct(p.amount, plan.income)}
            onUpdate={onUpdate}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </PlanSection>

      <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3 text-sm">
        <ComputedRow label="Budget Bulanan" hint="dari card Budget Bulanan" value={plan.totalFlexible} color={colorOf.flex} share={pct(plan.totalFlexible, plan.income)} />
        <ComputedRow
          label="Tabungan"
          hint="sisa"
          value={plan.netSavings}
          color={colorOf.save}
          share={pct(Math.max(0, plan.netSavings), plan.income)}
          strong
        />
      </div>

      {plan.netSavings < 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          <AlertCircle size={14} /> Waduh, rencana keluarnya lebih gede {rupiah(-plan.netSavings)} dari masuknya
        </p>
      )}
    </>
  );
}

function PlanSection({ title, onAdd, children }) {
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">{title}</p>
        <GhostButton onClick={onAdd} className="-mr-2 py-1">
          <Plus size={13} /> Tambah
        </GhostButton>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function PlanRow({ item, color, share, tone, onUpdate, onRename, onDelete }) {
  return (
    <div className="group -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white/[0.03]">
      <span className="flex min-w-0 items-center gap-2">
        {color ? (
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
        ) : (
          <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-emerald-500/60" />
        )}
        <button
          onClick={() => onRename(item)}
          title={item.note || 'Klik buat ganti nama'}
          className="truncate text-left text-zinc-300 transition-colors hover:text-white hover:underline"
        >
          {item.name}
        </button>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <EditableAmount value={item.amount} onSave={(v) => onUpdate(item.id, { amount: v })} className={`text-sm ${tone || 'text-zinc-200'}`} />
        {share != null && <span className="inline-block w-8 text-right text-xs text-zinc-500">{share.toFixed(0)}%</span>}
        <IconButton onClick={() => onDelete(item)} title="Hapus pos" danger className="opacity-0 group-hover:opacity-100 focus:opacity-100">
          <Trash2 size={13} />
        </IconButton>
      </span>
    </div>
  );
}

function ComputedRow({ label, hint, value, color, share, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-zinc-400">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
        {label}
        <span className="text-[11px] text-zinc-600">{hint}</span>
      </span>
      <span className="tabular-nums">
        <span className={strong ? `font-semibold ${value >= 0 ? 'text-emerald-400' : 'text-rose-400'}` : 'text-zinc-200'}>{rupiah(value)}</span>
        <span className="ml-1.5 inline-block w-8 text-right text-xs text-zinc-500">{share.toFixed(0)}%</span>
        <span className="inline-block w-7" />
      </span>
    </div>
  );
}
