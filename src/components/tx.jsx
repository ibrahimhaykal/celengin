import { ArrowDownLeft, ArrowUpRight, Repeat } from 'lucide-react';
import { rupiah } from '../lib/format';

// Gmail sync transaction types: green = income, red = expense, blue = internal transfer (net zero).
const TX_STYLE = {
  INCOME: { icon: ArrowUpRight, sign: '+', label: 'Income', cls: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  EXPENSE: { icon: ArrowDownLeft, sign: '−', label: 'Expense', cls: 'bg-rose-500/10 text-rose-400 ring-rose-500/20' },
  TRANSFER: { icon: Repeat, sign: '', label: 'Transfer', cls: 'bg-sky-500/10 text-sky-400 ring-sky-500/20' },
};

export function TxAmount({ type, amount, muted }) {
  const s = TX_STYLE[type] || TX_STYLE.EXPENSE;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset ${muted ? 'bg-zinc-800 text-zinc-500 ring-zinc-700 line-through' : s.cls}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {s.sign && `${s.sign} `}
      {rupiah(amount)}
    </span>
  );
}

export function TxTypeLabel({ type }) {
  const s = TX_STYLE[type] || TX_STYLE.EXPENSE;
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${s.cls}`}>{s.label}</span>;
}
