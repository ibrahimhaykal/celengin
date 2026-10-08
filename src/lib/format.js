// Privacy mode: App calls setAmountsHidden() at the top of every render,
// so every rupiah() call in that render agrees.
let amountsHidden = false;
export const setAmountsHidden = (value) => {
  amountsHidden = value;
};
export const isAmountsHidden = () => amountsHidden;

const HIDDEN_KEY = 'fin-track:hide-amounts';

export const readHiddenPref = () => {
  try {
    return localStorage.getItem(HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
};

export const saveHiddenPref = (hidden) => {
  try {
    localStorage.setItem(HIDDEN_KEY, hidden ? '1' : '0');
  } catch {
    // storage unavailable (private window): the toggle still works for this session
  }
};

const idr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export const rupiah = (n) => (amountsHidden ? 'Rp ••••••' : idr.format(n || 0));

// SQLite CURRENT_TIMESTAMP is UTC without a zone ("2026-09-25 12:05:26"); ISO strings pass through.
export const toDate = (value) => {
  if (!value) return null;
  const d = new Date(/[TZ]/.test(value) ? value : `${value.replace(' ', 'T')}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const formatDate = (value, withTime = true) => {
  const d = toDate(value);
  if (!d) return value || '—';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  });
};

export const relativeTime = (value) => {
  const d = toDate(value);
  if (!d) return 'belum pernah';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  if (mins < 1440) return `${Math.round(mins / 60)} jam lalu`;
  return formatDate(value, false);
};

export const daysUntil = (date) => {
  const d = toDate(`${date}T00:00:00+07:00`);
  return d ? Math.ceil((d.getTime() - Date.now()) / 86400000) : null;
};

// Coin amounts: up to 8 decimals, Indonesian separators ("0,00018977"). Hidden like rupiah in privacy mode.
const coinFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 8 });
// Fund units are shown with 4 decimals, like Bibit does.
const unitFmt = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 });
export const coins = (n, { fund = false } = {}) => (amountsHidden ? '••••' : (fund ? unitFmt : coinFmt).format(n || 0));

// Mutual fund NAV per unit keeps its decimals ("Rp 1.495,19").
const navFmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const nav = (n) => (amountsHidden ? 'Rp ••••' : navFmt.format(n || 0));

export const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

// Today's date in WIB as YYYY-MM-DD (the ledger's day boundary).
export const todayWib = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
