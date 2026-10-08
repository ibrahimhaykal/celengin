import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Activity, GripVertical, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { usePaged } from '../hooks/usePaged';
import { coins, formatDate, nav, pct, relativeTime } from '../lib/format';
import { CRYPTO_SYMBOL, isFundAsset, walletIcon } from '../lib/theme';
import { EditableAmount, EmptyState, GhostButton, IconButton, LoadMore } from './ui';

// Never start a drag from a form field (e.g. typing a new balance) or anything marked data-no-dnd.
const fromFormField = (e) => Boolean(e.target.closest?.('input, textarea, select, [data-no-dnd]'));
class CardPointerSensor extends PointerSensor {
  static activators = [{ eventName: 'onPointerDown', handler: ({ nativeEvent: e }) => e.isPrimary && e.button === 0 && !fromFormField(e) }];
}
class CardTouchSensor extends TouchSensor {
  static activators = [{ eventName: 'onTouchStart', handler: ({ nativeEvent: e }) => !fromFormField(e) }];
}
// Keyboard lift (Space/Enter) only when the card itself has focus: Enter in the balance field saves it,
// and Enter on a card button presses that button.
class CardKeyboardSensor extends KeyboardSensor {
  static activators = [
    {
      eventName: 'onKeyDown',
      handler: (event, options, context) =>
        event.nativeEvent.target === event.currentTarget &&
        KeyboardSensor.activators[0].handler(event, options, context),
    },
  ];
}

// Lands with a slight overshoot, like setting a card back down.
const dropAnimation = {
  duration: 280,
  easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
};

export default function WalletGrid({
  wallets,
  total,
  walletColor,
  flashIds,
  onAdd,
  onUpdate,
  onDelete,
  onPickIcon,
  onCrypto,
  onReorder,
}) {
  // 6 fits the 2 / 3 / 6 column layouts without a half-empty row.
  const page = usePaged(wallets, 6);
  const [activeId, setActiveId] = useState(null);
  const sensors = useSensors(
    // A 6px move before lifting keeps plain clicks on the card's buttons working.
    useSensor(CardPointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold briefly so scrolling the page still works.
    useSensor(CardTouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(CardKeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const active = wallets.find((w) => w.id === activeId);
  const cardProps = (w) => ({
    w,
    color: walletColor[w.id],
    share: pct(w.balance, total),
    flash: flashIds.includes(w.id),
    onUpdate,
    onDelete,
    onPickIcon,
    onCrypto,
  });

  const onDragEnd = ({ active: a, over }) => {
    setActiveId(null);
    if (!over || a.id === over.id) return;
    const ids = wallets.map((w) => w.id);
    onReorder(arrayMove(ids, ids.indexOf(a.id), ids.indexOf(over.id)));
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-zinc-100">
          Wallet
          {wallets.length > 1 && <span className="text-xs font-normal text-zinc-600">tahan & geser buat atur urutan</span>}
        </h2>
        <GhostButton onClick={onAdd}>
          <Plus size={14} /> Wallet baru
        </GhostButton>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active: a }) => setActiveId(a.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <SortableContext items={page.visible.map((w) => w.id)} strategy={rectSortingStrategy}>
          {/* On wide screens the cards stretch to fill the row, however many wallets there are (up to a page of 6). */}
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[repeat(auto-fit,minmax(15rem,1fr))]">
            {page.visible.map((w) => (
              <SortableWallet key={w.id} {...cardProps(w)} />
            ))}
            {wallets.length === 0 && <EmptyState icon={Wallet} text="Belum ada wallet. Tambahin satu, yuk." />}
            <div className="col-span-full empty:hidden">
              <LoadMore remaining={page.remaining} step={page.step} onMore={page.more} onLess={page.less} />
            </div>
          </div>
        </SortableContext>
        {/* The lifted card that follows the pointer. */}
        <DragOverlay dropAnimation={dropAnimation}>{active ? <WalletCard {...cardProps(active)} lifted /> : null}</DragOverlay>
      </DndContext>
    </>
  );
}

// Grid slot: the other cards slide aside smoothly; while its own card is lifted it shows as an empty dashed slot.
function SortableWallet(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.w.id,
    transition: { duration: 260, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 ${isDragging ? 'border-2 border-dashed border-sky-500/40 bg-sky-500/[0.04]' : ''}`}
    >
      <WalletCard {...props} placeholder={isDragging} />
    </div>
  );
}

function WalletCard({ w, color, share, flash, lifted, placeholder, onUpdate, onDelete, onPickIcon, onCrypto }) {
  const Icon = walletIcon(w);
  const fund = isFundAsset(w.asset); // reksa dana: units x NAV (daily), else crypto units x price
  const symbol = w.asset && (fund ? 'unit' : CRYPTO_SYMBOL[w.asset] || w.asset.toUpperCase());
  // The lifted card must be opaque (it floats over other content), so it gets its own solid background.
  const state = lifted
    ? 'animate-card-lift cursor-grabbing border-sky-400/40 bg-zinc-900 shadow-[0_28px_60px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(56,189,248,0.25)]'
    : `cursor-grab bg-zinc-900/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-zinc-900 ${flash ? 'border-emerald-500/60 ring-4 ring-emerald-500/10' : 'border-white/[0.06]'}`;
  return (
    <div
      className={`group relative flex h-full flex-col rounded-2xl border p-5 transition-[transform,box-shadow,border-color,background-color,opacity] duration-300 select-none ${state} ${placeholder ? 'opacity-0' : ''}`}
    >
      <GripVertical
        size={14}
        aria-hidden
        className="absolute top-1/2 left-1.5 -translate-y-1/2 text-zinc-700 opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div className="mb-6 flex items-start justify-between">
        <button
          onClick={() => onPickIcon(w)}
          title="Ganti ikon"
          aria-label={`Ganti ikon ${w.name}`}
          className="group/icon relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-300 ring-1 ring-white/[0.06] transition-all hover:bg-white/[0.1] hover:text-white hover:ring-white/[0.16]"
        >
          <Icon size={17} />
          <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-zinc-200 opacity-0 ring-2 ring-zinc-900 transition-opacity group-hover/icon:opacity-100">
            <Pencil size={8} />
          </span>
        </button>
        <div className="flex items-center gap-0.5">
          <IconButton
            onClick={() => onCrypto(w)}
            title={w.asset ? 'Atur harga live' : 'Harga live: crypto atau reksa dana'}
            className={w.asset ? 'text-amber-400/80' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}
          >
            <Activity size={14} />
          </IconButton>
          <IconButton
            onClick={() => onDelete(w)}
            title="Hapus wallet"
            danger
            className="opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>
      <p className="flex items-center gap-2 text-sm font-medium text-zinc-200">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
        {w.name}
      </p>
      <p className="mb-3 truncate pl-4 text-xs text-zinc-500">{w.category || '—'}</p>
      <EditableAmount
        value={w.balance}
        onSave={(v) => onUpdate(w.id, v)}
        className="text-2xl font-semibold tracking-tight text-zinc-50"
      />
      {w.asset && (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400">
          <span className="tabular-nums">
            {coins(w.units, { fund })} {symbol}
            {fund && w.price > 0 && <> · NAB {nav(w.price)}</>}
          </span>
          {w.price_change != null && (
            <span
              title={fund ? 'Perubahan NAB harian' : 'Perubahan harga 24 jam'}
              className={`inline-flex items-center gap-0.5 rounded px-1 py-px font-medium tabular-nums ${w.price_change >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
            >
              {w.price_change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {w.price_change >= 0 ? '+' : ''}
              {w.price_change.toFixed(fund ? 3 : 2)}%
            </span>
          )}
        </p>
      )}
      <div className="mt-auto pt-5">
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${share}%`, background: color }} />
        </div>
        <p className="mt-2 flex justify-between text-[11px] text-zinc-500">
          <span>{share.toFixed(1)}% dari total</span>
          <span title={fund ? 'Tanggal NAB terbaru (diumumkan tiap hari bursa)' : w.asset ? 'Harga terakhir diambil' : 'Saldo terakhir diubah'}>
            {fund ? `NAB ${formatDate(w.price_at, false)}` : w.asset ? `harga ${relativeTime(w.price_at)}` : relativeTime(w.updated_at)}
          </span>
        </p>
      </div>
    </div>
  );
}
