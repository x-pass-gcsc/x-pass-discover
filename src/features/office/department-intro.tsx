'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import type { SessionView } from '@/types/session-view';

/**
 * The card a student is greeted with on their first day in a department: what
 * the project is, how long it takes, what kind of work it is, and the senior
 * who will look after them. Everything on it is read from the scenario, so a
 * new department gets its own card without new code.
 */
export function DepartmentIntro({
  view,
  onStart,
  onClose,
}: {
  view: SessionView;
  onStart: () => void;
  onClose: () => void;
}) {
  const t = useT();
  const [preview, setPreview] = useState(false);
  const department = t(`dept.${view.department.slug}` as MessageKey);
  const mentor = view.personas.find((p) => p.organization === 'BITE') ?? null;

  const minutes = view.steps.reduce((sum, step) => sum + (step.estimatedMinutes ?? 0), 0);
  const hours = Math.max(0.5, Math.round((minutes / 60) * 2) / 2);
  const deadlineHours = Math.round(
    (new Date(view.session.deadlineAt).getTime() - new Date(view.session.startedAt).getTime()) /
      3_600_000,
  );
  const kinds = [...new Set(view.steps.map((s) => s.stepType))]
    .slice(0, 3)
    .map((type) => t(`stepType.${type}` as MessageKey));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center overflow-y-auto bg-[#0f1729]/45 p-3 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="department-intro-title"
      data-testid="department-intro"
    >
      <div className="relative w-full max-w-[920px] animate-pop overflow-hidden rounded-2xl border-2 border-[#3b6fd8] bg-surface shadow-[0_0_0_4px_rgba(59,111,216,0.18),0_30px_60px_-20px_rgba(15,23,41,0.6)]">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-lg border border-white/30 bg-[#13254d]/80 text-white hover:bg-[#13254d]"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="m5.5 5.5 9 9m0-9-9 9" />
          </svg>
        </button>

        <div className="grid md:grid-cols-[minmax(0,1fr)_330px]">
          <div>
            <div className="flex gap-4 bg-gradient-to-r from-[#13254d] to-[#1d3a78] px-6 py-5 text-white">
              <svg aria-hidden viewBox="0 0 24 24" className="mt-1 size-11 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="4.5" y="3.5" width="15" height="18" rx="2" />
                <path d="M9 3.5V2.5h6v1M8.5 17v-3M12 17v-6M15.5 17v-4.5" strokeLinecap="round" />
              </svg>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7fb2ff]">
                  {view.department.slug.replace(/-/g, ' ')} department
                </p>
                <h2 id="department-intro-title" className="mt-0.5 text-2xl font-black tracking-tight sm:text-3xl">
                  {t('intro.title', { department })}
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">{view.scenario.mission}</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="flex items-stretch">
                  <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3.5">
                    <span aria-hidden className="mt-0.5 text-xl">📋</span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold text-brand-600">{t('intro.project')}</span>
                      <span className="block text-base font-bold leading-snug text-strong">
                        {view.department.projectTitle}
                      </span>
                    </span>
                  </div>
                  <div className="relative hidden w-36 shrink-0 sm:block">
                    <Image src={view.department.coverImage} alt="" fill sizes="144px" className="object-cover" />
                  </div>
                </div>
                <dl className="divide-y divide-line border-t border-line text-[13px]">
                  <IntroRow icon="⏱" label={t('intro.duration')} value={t('intro.hours', { hours: String(hours) })} />
                  <IntroRow icon="📅" label={t('intro.deadline')} value={t('intro.deadlineValue', { hours: String(deadlineHours) })} />
                  <IntroRow icon="🗂" label={t('intro.work')} value={kinds.join(' · ')} />
                </dl>
              </div>

              {preview ? (
                <ol className="max-h-44 space-y-1 overflow-y-auto rounded-xl bg-sunken px-4 py-3 text-[12px]" data-testid="intro-preview">
                  {view.steps.map((step, index) => (
                    <li key={step.key} className="flex gap-2">
                      <span className="w-5 shrink-0 font-mono text-subtle">{index + 1}</span>
                      <span className="text-strong">{step.title}</span>
                      {step.estimatedMinutes ? (
                        <span className="ml-auto shrink-0 text-subtle">{step.estimatedMinutes}′</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPreview((p) => !p)}
                  aria-expanded={preview}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-brand-500 px-4 py-3 text-sm font-bold text-brand-600 hover:bg-brand-50"
                >
                  📄 {t('intro.preview')}
                </button>
                <button
                  type="button"
                  onClick={onStart}
                  data-testid="intro-start"
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-brand-600"
                >
                  ▶ {t('intro.start')}
                </button>
              </div>
            </div>
          </div>

          {mentor ? (
            <div className="relative hidden min-h-[360px] overflow-hidden bg-[#13254d] md:block">
              <Image src={view.department.coverImage} alt="" fill sizes="330px" className="object-cover opacity-45" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1729]/85 via-transparent to-transparent" />
              <p className="absolute left-5 right-5 top-14 rounded-2xl rounded-bl-md bg-surface px-4 py-3 text-sm font-semibold leading-relaxed text-strong shadow-float">
                {t('intro.welcome', { department })}
              </p>
              <div className="absolute inset-x-0 bottom-5 flex flex-col items-center">
                <span className="relative size-36 overflow-hidden rounded-full border-4 border-surface shadow-float">
                  {/* Portraits may be SVG, which next/image will not optimise. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mentor.portrait} alt="" className="size-full object-cover" />
                </span>
                <span className="-mt-3 rounded-lg bg-[#1d2433] px-3 py-1 text-sm font-bold text-white shadow-card">
                  {t('work.mentor')} · {mentor.name}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function IntroRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span aria-hidden className="w-5 text-center">{icon}</span>
      <dt className="w-28 shrink-0 text-muted">{label}</dt>
      <dd className="font-semibold text-strong">{value}</dd>
    </div>
  );
}
