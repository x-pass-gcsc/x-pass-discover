'use client';

import type { ReactNode } from 'react';

/**
 * The post-survey's answer controls. Each is a native radio group, checkbox
 * group or textarea under a fieldset/legend, so keyboard and screen-reader use
 * come for free; the styling only dresses the native inputs.
 */

export function Question({
  id,
  label,
  hint,
  children,
  missing,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  missing?: boolean;
}) {
  return (
    <fieldset
      id={id}
      className={`scroll-mt-24 rounded-xl border p-4 ${missing ? 'border-warn-400/60 bg-sunken' : 'border-line bg-surface'}`}
      data-question={id}
    >
      <legend className="sr-only">{label}</legend>
      <p aria-hidden className="text-sm font-semibold leading-snug text-strong">
        {label}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

export function ScaleInput({
  name,
  value,
  onChange,
  low,
  high,
  mid,
}: {
  name: string;
  value: number | undefined;
  onChange: (value: number) => void;
  low: string;
  high: string;
  mid?: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5" role="radiogroup">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <label key={n} className="relative">
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
              aria-label={n === 1 ? `${n} — ${low}` : n === 7 ? `${n} — ${high}` : n === 4 && mid ? `${n} — ${mid}` : String(n)}
            />
            <span className="grid h-10 cursor-pointer place-items-center rounded-lg border border-line-strong bg-surface text-sm font-semibold text-strong transition-colors hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400">
              {n}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-3 gap-2 text-[10px] text-muted">
        <span>{low}</span>
        <span className="text-center">{mid ?? ''}</span>
        <span className="text-right">{high}</span>
      </div>
    </div>
  );
}

export function ChoiceInput({
  name,
  options,
  value,
  onChange,
  max,
  exclusive = [],
}: {
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  /** At most this many; null for any number. */
  max: number | null;
  /** Options that stand alone: picking one clears the rest, and vice versa. */
  exclusive?: string[];
}) {
  const current = value ?? [];
  function toggle(option: string) {
    if (current.includes(option)) return onChange(current.filter((v) => v !== option));
    if (exclusive.includes(option)) return onChange([option]);
    const rest = current.filter((v) => !exclusive.includes(v));
    if (max !== null && rest.length >= max) return;
    onChange([...rest, option]);
  }
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {options.map((option) => {
        const checked = current.includes(option.value);
        const full = max !== null && !checked && !exclusive.includes(option.value) &&
          current.filter((v) => !exclusive.includes(v)).length >= max;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
              checked ? 'border-brand-500 bg-brand-50 text-strong' : 'border-line text-body'
            } ${full ? 'opacity-50' : ''}`}
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={checked}
              disabled={full}
              onChange={() => toggle(option.value)}
              className="mt-0.5 accent-brand-600"
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function SingleInput({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: Array<{ value: string; label: string }>;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-1.5" role="radiogroup">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
            value === option.value ? 'border-brand-500 bg-brand-50 text-strong' : 'border-line text-body'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="accent-brand-600"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function TextInput({
  label,
  value,
  onChange,
  maxLength,
  rows = 2,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
}) {
  return (
    <label className="mt-2 block">
      <span className="sr-only">{label}</span>
      <textarea
        rows={rows}
        maxLength={maxLength}
        placeholder={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-line-strong bg-surface px-3 py-2 text-xs text-strong outline-none placeholder:text-subtle focus:border-brand-500"
      />
    </label>
  );
}
