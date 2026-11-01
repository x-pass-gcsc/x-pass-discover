'use client';

import { useT } from '@/i18n/client';
import type { StepView } from '@/types/session-view';

/**
 * "Today's work": the bootcamp's steps as a checklist with a progress bar.
 * It is also how the student moves between steps, so each row carries the
 * same `data-step-*` hooks the step rail used to.
 */
export function TodayTasks({
  steps,
  activeStepKey,
  onSelect,
}: {
  steps: StepView[];
  activeStepKey: string;
  onSelect: (stepKey: string) => void;
}) {
  const t = useT();
  const done = steps.filter((s) => s.status === 'completed').length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const firstLocked = steps.find((s) => !s.unlocked)?.key;

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <h3 className="flex items-center gap-2 bg-[#1d2a4a] px-4 py-2.5 text-sm font-bold text-white">
        <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-warn-400" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="4" width="14" height="13" rx="2" />
          <path d="M3 8h14M7 2.5v3M13 2.5v3M7.5 12l1.8 1.8L13 10.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('work.todayTasks')}
      </h3>
      <nav aria-label={t('work.todayTasks')} className="max-h-[260px] overflow-y-auto px-2 py-1.5">
        {steps.map((step) => {
          const complete = step.status === 'completed';
          const locked = !step.unlocked;
          const active = step.key === activeStepKey;
          return (
            <button
              key={step.key}
              type="button"
              disabled={locked}
              data-step-key={step.key}
              data-step-status={step.status}
              data-step-unlocked={step.unlocked ? 'true' : 'false'}
              aria-current={active ? 'step' : undefined}
              title={locked ? (step.lockedReason ?? undefined) : undefined}
              onClick={() => onSelect(step.key)}
              className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                active ? 'bg-brand-50 ring-1 ring-brand-300' : locked ? 'cursor-not-allowed' : 'hover:bg-sunken'
              }`}
            >
              <span
                aria-hidden
                className={`mt-px grid size-[18px] shrink-0 place-items-center rounded border-2 text-[10px] font-bold ${
                  complete
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : active
                      ? 'border-brand-500 bg-surface'
                      : 'border-line-strong bg-surface'
                }`}
              >
                {complete ? '✓' : ''}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[13px] leading-snug ${
                    complete ? 'text-muted' : locked ? 'text-subtle' : 'font-medium text-strong'
                  }`}
                >
                  {step.title}
                </span>
                {locked && step.lockedReason ? (
                  // Only the next sealed step explains itself on screen; the rest
                  // keep the reason for assistive tech and the tooltip.
                  <span
                    className={
                      step.key === firstLocked
                        ? 'mt-0.5 block text-[10px] leading-snug text-subtle'
                        : 'sr-only'
                    }
                  >
                    {step.lockedReason}
                  </span>
                ) : null}
              </span>
              {locked ? <span aria-hidden className="text-[10px] text-subtle">🔒</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-line px-4 py-3">
        <p className="flex items-baseline justify-between text-xs text-body">
          <span>{t('work.progress')}</span>
          <span className="font-mono text-sm font-bold text-strong">
            {done}/{steps.length}
          </span>
        </p>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-brand-500"
            style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)' }}
          />
        </div>
      </div>
    </section>
  );
}
