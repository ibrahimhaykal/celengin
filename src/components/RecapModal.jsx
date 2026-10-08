import { useEffect, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, CircleDashed, Flame, RefreshCw, SkipForward, TrendingDown, TrendingUp } from 'lucide-react';
import { request } from '../lib/api';
import { notify } from '../lib/alerts';
import { pct, rupiah, todayWib } from '../lib/format';
import CelenganAyam from './CelenganAyam';
import { Modal, Select } from './ui';

export const monthName = (ym, withYear = true) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('id-ID', { month: 'long', ...(withYear && { year: 'numeric' }), timeZone: 'UTC' });

const shortDate = (date) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' });

const RUN_STYLE = {
  done: { icon: CheckCircle2, cls: 'text-emerald-400', label: 'beres' },
  skipped: { icon: SkipForward, cls: 'text-zinc-500', label: 'dilewatin' },
  pending: { icon: CircleDashed, cls: 'text-amber-400', label: 'belum kecatat' },
};

function Stat({ label, value, icon: Icon, tone, sub }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Icon size={13} className={tone} /> {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-100">{rupiah(value)}</p>
      {sub && <p className="text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

// Monthly recap: totals, how spending compares with the month before (per day, so a partial month is fair),
// where the money went against each budget, the biggest expense and how the schedules went.
export default function RecapModal({ initialMonth, onClose }) {
  const [month, setMonth] = useState(initialMonth || null);
  const [r, setR] = useState(null);

  useEffect(() => {
    let cancelled = false;
    request(`/recap${month ? `?month=${month}` : ''}`)
      .then((d) => {
        if (cancelled) return;
        setR(d);
        if (!month) setMonth(d.month);
      })
      .catch((e) => notify(false, e.message));
    return () => {
      cancelled = true;
    };
  }, [month]);

  if (!r || r.month !== month) {
    return (
      <Modal title="Rekap bulanan" onClose={onClose} wide>
        <p className="flex items-center gap-2 py-10 text-sm text-zinc-400">
          <RefreshCw size={15} className="animate-spin" /> Bentar, lagi ngitung…
        </p>
      </Modal>
    );
  }

  const name = monthName(r.month, false);
  const budgetOf = Object.fromEntries(r.budgets.map((b) => [b.name.trim().toLowerCase(), b]));
  const over = r.budgets.filter((b) => b.spent > b.amount);
  // Per-day numbers leave out scheduled payments (they are not day-to-day spending).
  const perDay = r.daily / r.days;
  const prevPerDay = r.prev ? r.prev.daily / r.prev.days : null;
  const change = prevPerDay ? ((perDay - prevPerDay) / prevPerDay) * 100 : null;
  const months = [...new Set([r.month, ...r.months])].sort().reverse();

  const headline = !r.count
    ? `${name} masih kosong, belum ada transaksi.`
    : r.net >= 0
      ? `Mantap, ${name}${r.current ? ' sejauh ini' : ''} kamu nyisihin ${rupiah(r.net)}`
      : `${name}${r.current ? ' sejauh ini' : ''} tekor ${rupiah(-r.net)}. Bulan depan pasti bisa!`;

  return (
    <Modal title="Rekap bulanan" onClose={onClose} wide>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-base font-semibold text-zinc-100">{headline}</p>
          <div className="w-60">
            <Select
              value={r.month}
              onChange={setMonth}
              className="py-2"
              options={months.map((m) => ({ value: m, label: monthName(m) + (m === todayWib().slice(0, 7) ? ' (berjalan)' : '') }))}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Pemasukan" value={r.income} icon={ArrowUpRight} tone="text-emerald-400" />
          <Stat
            label="Pengeluaran"
            value={r.expense}
            icon={ArrowDownLeft}
            tone="text-rose-400"
            sub={`harian ${rupiah(Math.round(perDay))} / hari di luar rutin · ${r.days} hari`}
          />
          <Stat
            label={r.net >= 0 ? 'Disisihin' : 'Tekor'}
            value={Math.abs(r.net)}
            icon={CelenganAyam}
            tone={r.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            sub={r.income > 0 && r.net >= 0 ? `savings rate ${pct(r.net, r.income).toFixed(0)}%` : null}
          />
        </div>

        {change !== null && Math.abs(change) >= 1 && (
          <p
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${change < 0 ? 'bg-emerald-500/[0.06] text-emerald-300 ring-emerald-500/20' : 'bg-rose-500/[0.06] text-rose-300 ring-rose-500/20'}`}
          >
            {change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
            {change < 0
              ? `Pengeluaran harian lebih hemat ${Math.abs(change).toFixed(0)}% dibanding ${monthName(r.prev.month, false)}. Keren!`
              : `Pengeluaran harian naik ${change.toFixed(0)}% dari ${monthName(r.prev.month, false)}. Pelan-pelan ya.`}
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <h4 className="mb-3 text-xs font-semibold tracking-wider text-zinc-500">DUITNYA KE MANA AJA</h4>
            <ul className="space-y-3">
              {r.byCategory.slice(0, 8).map((c) => {
                const budget = c.category && budgetOf[c.category.trim().toLowerCase()];
                const isOver = budget && c.total > budget.amount;
                return (
                  <li key={c.category || '-'}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={`truncate ${c.category ? 'text-zinc-200' : 'text-amber-400/90'}`}>
                        {c.category || 'Tanpa kategori'}
                        <span className="ml-1.5 text-xs text-zinc-500">{c.n}x</span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        <span className={isOver ? 'font-semibold text-rose-400' : 'text-zinc-200'}>{rupiah(c.total)}</span>
                        {budget && <span className="text-xs text-zinc-500"> / {rupiah(budget.amount)}</span>}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${isOver ? 'bg-rose-400' : 'bg-zinc-400'}`}
                        style={{ width: `${Math.min(100, pct(c.total, r.expense))}%` }}
                      />
                    </div>
                  </li>
                );
              })}
              {r.byCategory.length === 0 && <li className="text-sm text-zinc-500">Belum ada pengeluaran.</li>}
            </ul>
          </section>

          <section className="space-y-5">
            {over.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500">BUDGET YANG JEBOL</h4>
                <ul className="space-y-1.5">
                  {over.map((b) => (
                    <li key={b.name} className="flex justify-between gap-3 text-sm">
                      <span className="truncate text-zinc-300">{b.name}</span>
                      <span className="shrink-0 tabular-nums text-rose-400">+{rupiah(b.spent - b.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {r.biggest && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500">PENGELUARAN TERBESAR</h4>
                <p className="flex items-start gap-2 text-sm">
                  <Flame size={15} className="mt-0.5 shrink-0 text-amber-400" />
                  <span className="min-w-0">
                    <span className="block truncate text-zinc-200" title={r.biggest.description}>
                      {r.biggest.category || r.biggest.description}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {rupiah(r.biggest.amount)} · {shortDate(r.biggest.date)}
                    </span>
                  </span>
                </p>
              </div>
            )}
            {r.recurring.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-semibold tracking-wider text-zinc-500">RUTIN BULANAN</h4>
                <ul className="space-y-1.5">
                  {r.recurring.map((x) => {
                    const s = RUN_STYLE[x.status];
                    return (
                      <li key={x.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-1.5 text-zinc-300">
                          <s.icon size={14} className={`shrink-0 ${s.cls}`} />
                          <span className="truncate">{x.name}</span>
                        </span>
                        <span className={`shrink-0 text-xs ${s.cls}`}>{s.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Transfer antar wallet sendiri nggak diitung. Budget dibandingin pakai nominal budget yang sekarang.
            </p>
          </section>
        </div>
      </div>
    </Modal>
  );
}

const SEEN_KEY = 'celengin:recap-seen';
export const recapSeen = (month) => {
  try {
    return localStorage.getItem(SEEN_KEY) === month;
  } catch {
    return false;
  }
};
export const markRecapSeen = (month) => {
  try {
    localStorage.setItem(SEEN_KEY, month);
  } catch {
    // storage blocked: the banner just shows again next time
  }
};

// First week of a month: "Rekap September udah jadi". Gone once opened or dismissed.
export function RecapBanner({ month, onOpen, onDismiss }) {
  return (
    <section className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/[0.06] px-5 py-3.5">
      <CelenganAyam size={18} className="shrink-0 text-sky-400" />
      <p className="min-w-0 flex-1 text-sm text-zinc-200">
        Rekap {monthName(month, false)} udah jadi. Yuk intip, bulan kemarin duitnya ke mana aja.
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpen}
          className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-white"
        >
          Lihat rekap
        </button>
        <button onClick={onDismiss} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100">
          Nanti aja
        </button>
      </div>
    </section>
  );
}
