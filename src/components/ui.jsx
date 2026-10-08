import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react';
import { AlertCircle, Check, ChevronDown, ChevronUp, ChevronsUpDown, Pencil, RefreshCw, Target, X } from 'lucide-react';
import { isAmountsHidden, rupiah } from '../lib/format';
import { WALLET_ICONS } from '../lib/theme';

export function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-white/[0.06] bg-zinc-900/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
      <div>
        <h2 className="text-[15px] font-semibold text-zinc-100">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function GhostButton({ onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ onClick, title, danger, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-md p-1.5 text-zinc-500 transition-colors ${danger ? 'hover:bg-rose-500/10 hover:text-rose-400' : 'hover:bg-white/[0.06] hover:text-zinc-200'} ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ icon: Icon = Target, text }) {
  return (
    <p className="col-span-full flex items-center gap-2 py-6 text-sm text-zinc-500">
      <Icon size={15} /> {text}
    </p>
  );
}

const idrDigits = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

// Rupiah amount field: type plain digits, see "Rp 1.500.000" as you go. `value` / onChange use a digit
// string ('' when empty) so parents can Number() it. The caret stays after the same digit when dots are added.
export function MoneyInput({ value, onChange, className = '', inputClassName = '', prefix = true, ...rest }) {
  const ref = useRef(null);
  const caretDigits = useRef(null); // digits left of the caret at the last keystroke
  const digits = String(value ?? '').replace(/\D/g, '');
  const display = digits === '' ? '' : idrDigits.format(Number(digits));

  useLayoutEffect(() => {
    const el = ref.current;
    if (caretDigits.current == null || !el || document.activeElement !== el) return;
    let seen = 0;
    let pos = 0;
    while (pos < display.length && seen < caretDigits.current) {
      if (/\d/.test(display[pos])) seen++;
      pos++;
    }
    el.setSelectionRange(pos, pos);
    caretDigits.current = null;
  }, [display]);

  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-zinc-500">Rp</span>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          caretDigits.current = raw.slice(0, e.target.selectionStart ?? raw.length).replace(/\D/g, '').length;
          onChange(raw.replace(/\D/g, '').replace(/^0+(?=\d)/, ''));
        }}
        className={`${inputClassName} ${prefix ? 'pl-9' : ''} tabular-nums`}
        {...rest}
      />
    </div>
  );
}

// Click to edit; Enter/blur saves, Escape cancels.
// Keys and pointer presses are kept inside the field so a draggable parent card never reacts to them.
export function EditableAmount({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Editing would reveal the real number, so it is disabled while amounts are hidden.
  if (isAmountsHidden()) return <span className={`tabular-nums ${className}`}>{rupiah(value)}</span>;

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
        title="Klik buat ubah"
        className={`group/edit inline-flex items-center gap-2 rounded-md text-left tabular-nums transition-colors hover:text-white ${className}`}
      >
        {rupiah(value)}
        <Pencil size={13} className="text-zinc-600 opacity-0 transition-opacity group-hover/edit:opacity-100" />
      </button>
    );
  }

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (draft !== '' && Number.isFinite(n) && n !== value) onSave(n);
  };

  return (
    <MoneyInput
      autoFocus
      value={draft}
      onChange={setDraft}
      onBlur={commit}
      onFocus={(e) => e.target.select()}
      onKeyDown={(e) => {
        e.stopPropagation(); // Enter / Space must not pick up the draggable card
        if (e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === 'Escape') setEditing(false);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className="w-full"
      inputClassName="w-full rounded-lg border border-zinc-600 bg-zinc-950 py-1 pr-2.5 text-base text-zinc-100 outline-none focus:border-sky-500"
    />
  );
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-md'}`}
      >
        <header className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
          <IconButton onClick={onClose} title="Tutup">
            <X size={16} />
          </IconButton>
        </header>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// `remaining` = known count left (client lists); `hasMore` = server lists where the total is unknown.
export function LoadMore({ remaining = 0, hasMore, step, onMore, onLess, loading, className = '' }) {
  const cls = `flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-white/[0.16] hover:bg-white/[0.03] hover:text-zinc-100 disabled:opacity-60 ${className}`;
  if (remaining > 0 || hasMore) {
    return (
      <button onClick={onMore} disabled={loading} className={cls}>
        {loading ? <RefreshCw size={13} className="animate-spin" /> : <ChevronDown size={14} />}
        {remaining > 0 ? (
          <>
            Lihat {Math.min(step, remaining)} lagi <span className="text-zinc-600">· sisa {remaining}</span>
          </>
        ) : (
          'Lihat lebih banyak'
        )}
      </button>
    );
  }
  if (onLess) {
    return (
      <button onClick={onLess} className={cls}>
        <ChevronUp size={14} /> Ringkas lagi
      </button>
    );
  }
  return null;
}

export function IconPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Pilih ikon" className="grid grid-cols-5 gap-2">
      {Object.entries(WALLET_ICONS).map(([key, { icon: Icon, label }]) => {
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            title={label}
            onClick={() => onChange(key)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[10px] transition-all ${selected ? 'border-sky-500/60 bg-sky-500/10 text-sky-300' : 'border-white/[0.06] text-zinc-400 hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-zinc-100'}`}
          >
            <Icon size={18} />
            <span className="w-full truncate">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition-colors focus:border-sky-500';

// Dropdown panel shared by Select and SuggestInput: matches the trigger's width, shows about 10 rows, scrolls the rest.
// It renders in a portal, so z-50 keeps it above modals (z-40).
const panelCls =
  'z-50 max-h-[364px] [--anchor-max-height:364px] w-[var(--button-width)] min-w-[var(--input-width)] overflow-y-auto rounded-xl border border-white/[0.08] bg-zinc-900 p-1 shadow-2xl outline-none [--anchor-gap:4px] empty:invisible';
const optionCls =
  'group flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-300 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[focus]:bg-white/[0.06] data-[focus]:text-zinc-100';

// Standard dropdown. options: [{ value, label, disabled? }]. `className` styles the trigger.
export function Select({ value, onChange, options, placeholder = 'Pilih…', className = '', title }) {
  const selected = options.find((o) => o.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      <ListboxButton
        title={title}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 text-left text-sm text-zinc-100 outline-none transition-colors data-[focus]:border-sky-500 data-[open]:border-sky-500 ${className}`}
      >
        <span className={`truncate ${selected ? '' : 'text-zinc-600'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown size={14} className="shrink-0 text-zinc-500" />
      </ListboxButton>
      <ListboxOptions anchor="bottom start" transition className={`${panelCls} transition duration-100 ease-out data-[closed]:opacity-0`}>
        {options.map((o) => (
          <ListboxOption key={o.value} value={o.value} disabled={o.disabled} className={optionCls}>
            <Check size={14} className="shrink-0 text-sky-400 invisible group-data-[selected]:visible" />
            <span className="truncate">{o.label}</span>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}

// Free-text input with suggestions (e.g. categories): type anything, or pick one of `options` (strings).
export function SuggestInput({ value, onChange, options, placeholder, required, autoFocus }) {
  const needle = value.trim().toLowerCase();
  const matches = options.filter((o) => o.toLowerCase() !== needle && o.toLowerCase().includes(needle));
  return (
    <Combobox value={value} onChange={(v) => v !== null && onChange(v)} immediate>
      <ComboboxInput
        displayValue={(v) => v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
        autoComplete="off"
        className={inputCls}
      />
      <ComboboxOptions anchor="bottom start" className={panelCls}>
        {matches.map((o) => (
          <ComboboxOption key={o} value={o} className={optionCls}>
            <span className="truncate">{o}</span>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}

// Generic create form. `fields`: [{ name, label, type, placeholder, required, options, defaultValue }].
// type 'icon' renders the IconPicker. onSubmit may throw; the error is shown inline.
export function CreateForm({ fields, submitLabel, onSubmit }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map((f) =>
        f.type === 'icon' ? (
          <div key={f.name}>
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{f.label}</span>
            <IconPicker value={values[f.name]} onChange={(v) => set(f.name, v)} />
          </div>
        ) : (
          <label key={f.name} className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">{f.label}</span>
            {f.type === 'money' ? (
              <MoneyInput
                value={values[f.name]}
                onChange={(v) => set(f.name, v)}
                placeholder={f.placeholder || '0'}
                required={f.required}
                inputClassName={inputCls}
              />
            ) : f.options ? (
              <SuggestInput
                value={values[f.name]}
                onChange={(v) => set(f.name, v)}
                options={f.options}
                placeholder={f.placeholder}
                required={f.required}
              />
            ) : (
              <input
                type={f.type || 'text'}
                min={f.type === 'number' ? 0 : undefined}
                value={values[f.name]}
                onChange={(e) => set(f.name, e.target.value)}
                placeholder={f.placeholder}
                required={f.required}
                className={inputCls}
              />
            )}
          </label>
        )
      )}
      {error && (
        <p className="flex items-center gap-2 text-sm text-rose-400">
          <AlertCircle size={15} /> {error}
        </p>
      )}
      <button
        disabled={saving}
        className="w-full rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:opacity-60"
      >
        {saving ? 'Nyimpen…' : submitLabel}
      </button>
    </form>
  );
}
