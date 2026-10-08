import { useEffect } from 'react';
import { rupiah } from '../lib/format';

const KEY = 'celengin:budget-alerts';
const LEVELS = [100, 80]; // highest first

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
};
const write = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // storage blocked: alerts may repeat, nothing else breaks
  }
};

// Windows notification when a budget passes 80% and again past 100%, once per level per budget per month.
// Runs whenever dashboard data changes (Cek mutasi, a manual entry, the 1-minute refresh).
// Remembers what was already announced in localStorage: { month, sent: { [budget]: level } }.
export function useBudgetAlerts(expenses, spent, month) {
  useEffect(() => {
    if (!month || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const state = read();
    const sent = state.month === month ? { ...state.sent } : {};
    let changed = state.month !== month;

    for (const b of expenses) {
      if (!(b.amount > 0)) continue;
      const used = spent[b.name.trim().toLowerCase()] || 0;
      const level = LEVELS.find((l) => (used / b.amount) * 100 >= l);
      if (!level || (sent[b.name] || 0) >= level) continue;
      sent[b.name] = level;
      changed = true;
      const body =
        level >= 100
          ? `Udah kepake ${rupiah(used)} dari ${rupiah(b.amount)}. Lewat ${rupiah(used - b.amount)}, rem dikit ya.`
          : `Udah ${Math.round((used / b.amount) * 100)}%, sisa ${rupiah(b.amount - used)} buat bulan ini.`;
      new Notification(level >= 100 ? `Budget ${b.name} jebol` : `Budget ${b.name} hampir abis`, { body, tag: `budget-${b.name}` });
    }
    if (changed) write({ month, sent });
  }, [expenses, spent, month]);
}
