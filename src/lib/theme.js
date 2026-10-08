import {
  Banknote,
  Bike,
  Briefcase,
  Car,
  Coins,
  CreditCard,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  House,
  Landmark,
  Laptop,
  Lock,
  Plane,
  Smartphone,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import CelenganAyam from '../components/CelenganAyam';

// Categorical slots as CSS variables (index.css defines validated light and dark steps). Fixed order, never cycled.
export const SERIES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--series-${n})`);
export const OTHER = 'var(--color-zinc-600)';

export const MILESTONE_COLOR = {
  Emergency: 'var(--series-8)',
  Career: 'var(--series-1)',
  Asset: 'var(--series-4)',
  Gear: 'var(--series-7)',
  Family: 'var(--series-3)',
  'Life Goal': 'var(--series-5)',
};

// Live-priced wallets: asset is a CoinGecko id (crypto) or "fund:<Pasardana id>" (reksa dana).
export const isFundAsset = (asset) => /^fund:\d+$/.test(String(asset || ''));

// Coin symbols for crypto wallets (keys are the server's CoinGecko ids).
export const CRYPTO_SYMBOL = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  binancecoin: 'BNB',
  ripple: 'XRP',
  dogecoin: 'DOGE',
  tether: 'USDT',
};

// Icons a wallet can pick. Keys are stored in the DB, so never rename one.
export const WALLET_ICONS = {
  Wallet: { icon: Wallet, label: 'Dompet' },
  Landmark: { icon: Landmark, label: 'Bank' },
  // Key kept as 'PiggyBank' (stored in the DB); drawn as Celengin's chicken piggy bank.
  PiggyBank: { icon: CelenganAyam, label: 'Celengan' },
  CreditCard: { icon: CreditCard, label: 'Kartu' },
  Banknote: { icon: Banknote, label: 'Tunai' },
  Coins: { icon: Coins, label: 'Receh' },
  Smartphone: { icon: Smartphone, label: 'E-Wallet' },
  TrendingUp: { icon: TrendingUp, label: 'Investasi' },
  Lock: { icon: Lock, label: 'Dikunci' },
  Ticket: { icon: Ticket, label: 'Event' },
  Bike: { icon: Bike, label: 'Motor' },
  Car: { icon: Car, label: 'Mobil' },
  House: { icon: House, label: 'Rumah' },
  Laptop: { icon: Laptop, label: 'Gadget' },
  Gamepad2: { icon: Gamepad2, label: 'Game' },
  Plane: { icon: Plane, label: 'Liburan' },
  GraduationCap: { icon: GraduationCap, label: 'Pendidikan' },
  Gift: { icon: Gift, label: 'Hadiah' },
  Heart: { icon: Heart, label: 'Nikah' },
  Briefcase: { icon: Briefcase, label: 'Kerja' },
};

// Chosen icon first; older wallets without one get a guess from their name.
export function walletIcon(w) {
  if (WALLET_ICONS[w.icon]) return WALLET_ICONS[w.icon].icon;
  const text = `${w.id} ${w.name} ${w.category}`.toLowerCase();
  if (/bibit|darurat|rdpu|reksa|saving|tabung/.test(text)) return CelenganAyam;
  if (/deposito|bank|jago|bca/.test(text)) return Landmark;
  if (/lock|event|tiket/.test(text)) return Lock;
  if (/cash|living|pegangan/.test(text)) return Wallet;
  return CreditCard;
}
