'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import { Cover } from '@/components/media';
import { useToast } from '@/components/toast';
import { useT } from '@/i18n/client';
import type { MessageKey } from '@/i18n/messages/en';
import type { DepartmentPlan } from '@/services/departments/plan-service';
import type { DepartmentDefinition } from '@/types/scenario';

export type SessionSummary = {
  id: string;
  departmentSlug: string;
  status: string;
  /** Steps finished and steps in the scenario, where the caller has them. */
  completedSteps?: number;
  totalSteps?: number;
};

const GLYPHS: Record<string, string> = {
  marketing: '◆',
  sales: '▲',
  'product-management': '●',
  strategy: '◇',
  'human-resources': '■',
};

type Step = 'choose' | 'recommend' | 'confirm';

type CardOptions = {
  badge?: ReactNode;
  footer?: ReactNode;
  onSelect?: () => void;
  selected?: boolean;
  role?: string;
};

/**
 * The reception desk's department chooser: the "two chosen + one recommended"
 * plan.
 *
 *   A. the student chooses exactly two departments;
 *   B. one of the other three is recommended for them (by the server, from
 *      their pre-survey — the slug only, never the scores behind it);
 *   C. they review the three and confirm.
 *
 * Until they confirm, they can change their two and the recommendation is
 * worked out again. Once confirmed, the desk shows their three departments to
 * start or resume. A bootcamp started before the plan existed can always be
 * resumed. Whether a department can be played comes from its own status, so a
 * scenario added later opens here with no change to this component.
 */
export function DepartmentChooser({
  departments,
  plan,
  preSurveyComplete,
  sessions,
  currentSessionId = null,
  onOpenSession,
}: {
  departments: DepartmentDefinition[];
  plan: DepartmentPlan;
  preSurveyComplete: boolean;
  sessions: SessionSummary[];
  currentSessionId?: string | null;
  onOpenSession?: (sessionId: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [chosen, setChosen] = useState<string[]>([]);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('choose');
  const [busy, setBusy] = useState<string | null>(null);

  const bySlug = (slug: string) => departments.find((d) => d.slug === slug);
  const sessionFor = (slug: string) => sessions.find((s) => s.departmentSlug === slug) ?? null;
  const openSession = (sessionId: string) =>
    onOpenSession ? onOpenSession(sessionId) : router.push(`/office?session=${sessionId}`);

  async function startBootcamp(slug: string) {
    setBusy(slug);
    try {
      const existing = sessionFor(slug);
      if (existing) {
        openSession(existing.id);
        setBusy(null);
        return;
      }
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ departmentSlug: slug }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('chooser.startFailed'));
      openSession(data.session.id);
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('chooser.startFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
      setBusy(null);
    }
  }

  function toggle(slug: string) {
    setRecommended(null);
    setChosen((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 2) {
        toast.push({ tone: 'warn', title: t('plan.limitTitle'), description: t('plan.limitBody') });
        return prev;
      }
      return [...prev, slug];
    });
  }

  async function fetchRecommendation() {
    setBusy('recommend');
    try {
      const response = await fetch('/api/departments/recommendation', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userChosenSlugs: chosen }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? t('plan.recommendFailed'));
      setRecommended(data.aiRecommendedSlug);
      setStep('recommend');
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('plan.recommendFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  async function confirmPlan() {
    if (!recommended) return;
    setBusy('confirm');
    try {
      const response = await fetch('/api/departments/selection', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userChosenSlugs: chosen, aiRecommendedSlug: recommended }),
      });
      const data = await response.json();
      if (!response.ok) {
        // The answers behind it changed: show the new recommendation first.
        if (data.code === 'recommendation_mismatch') await fetchRecommendation();
        throw new Error(data.error ?? t('plan.confirmFailed'));
      }
      toast.push({ tone: 'success', title: t('plan.confirmed') });
      router.refresh();
    } catch (cause) {
      toast.push({
        tone: 'danger',
        title: t('plan.confirmFailed'),
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  /** Start / resume / continue for one department, or why it cannot start. */
  function action(department: DepartmentDefinition, { canStart }: { canStart: boolean }) {
    const session = sessionFor(department.slug);
    const current = !!session && session.id === currentSessionId;
    const hasProgress = session?.totalSteps !== undefined && session.completedSteps !== undefined;
    if (session) {
      return (
        <div className="flex items-center gap-2">
          <Button onClick={() => startBootcamp(department.slug)} loading={busy === department.slug} className="flex-1">
            {current ? t('desk.continueHere') : t('chooser.resume')}
          </Button>
          <span className="flex shrink-0 flex-col items-end gap-0.5">
            <Badge tone={session.status === 'completed' ? 'success' : 'brand'} dot>
              {t(`sessionStatus.${session.status}` as MessageKey)}
            </Badge>
            {hasProgress ? (
              <span className="text-[10px] tabular-nums text-muted">
                {t('desk.progress', { done: session.completedSteps!, total: session.totalSteps! })}
              </span>
            ) : null}
          </span>
        </div>
      );
    }
    if (department.status !== 'playable') {
      return <span className="text-[11px] text-subtle">{t('plan.comingSoonCard')}</span>;
    }
    if (!canStart) return null;
    return (
      <Button onClick={() => startBootcamp(department.slug)} loading={busy === department.slug} className="w-full">
        {t('chooser.start')}
      </Button>
    );
  }

  function card(department: DepartmentDefinition, options: CardOptions) {
    const playable = department.status === 'playable';
    const session = sessionFor(department.slug);
    const current = !!session && session.id === currentSessionId;
    const body = (
      <>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-8 place-items-center rounded-xl text-sm"
              style={{ color: department.accentColor, backgroundColor: `${department.accentColor}1f` }}
              aria-hidden
            >
              {GLYPHS[department.slug] ?? '◆'}
            </span>
            <div>
              <div className="text-sm font-semibold" style={{ color: department.accentColor }}>
                {department.name}
              </div>
              <div className="text-[11px] text-muted">{department.tagline}</div>
            </div>
          </div>
          {options.onSelect ? (
            <span
              className={`grid size-5 shrink-0 place-items-center rounded-md border text-[10px] transition-all duration-150 ${
                options.selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-line-strong text-transparent'
              }`}
              aria-hidden
            >
              ✓
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm font-medium text-strong">{department.projectTitle}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{department.description}</p>
      </>
    );
    return (
      <Card
        key={department.slug}
        data-department-slug={department.slug}
        data-department-status={department.status}
        data-department-session={session?.status ?? 'none'}
        data-department-current={current ? 'true' : undefined}
        data-plan-role={options.role}
        accent={department.accentColor}
        className={`flex flex-col transition-shadow duration-200 ${
          options.selected ? 'border-brand-500/60 shadow-lg shadow-brand-600/10' : ''
        }`}
      >
        <Cover
          src={department.coverImage}
          alt=""
          className="h-20 border-b border-line"
          overlay={
            <span className="absolute right-3 top-3 flex gap-1.5">
              {options.badge}
              {current ? <Badge tone="brand">{t('desk.current')}</Badge> : null}
              {playable ? (
                <Badge tone="success" dot>
                  {t('chooser.playable')}
                </Badge>
              ) : (
                <Badge tone="muted">{t('chooser.comingSoon')}</Badge>
              )}
            </span>
          }
        />
        {options.onSelect ? (
          <button
            type="button"
            onClick={options.onSelect}
            aria-pressed={!!options.selected}
            className="flex flex-1 cursor-pointer flex-col p-4 text-left"
          >
            {body}
          </button>
        ) : (
          <div className="flex flex-1 flex-col p-4">{body}</div>
        )}
        {options.footer ? <div className="border-t border-line px-4 py-3">{options.footer}</div> : null}
      </Card>
    );
  }

  // ------------------------------------------------------------ confirmed

  if (plan.confirmed) {
    const others = departments.filter((d) => !plan.departmentSlugs.includes(d.slug));
    return (
      <div className="space-y-5" data-testid="department-plan" data-plan-state="confirmed">
        <div className="rounded-2xl border border-line bg-sunken px-4 py-3">
          <p className="text-sm font-semibold text-strong">{t('plan.confirmedTitle')}</p>
          <p className="mt-0.5 text-[11px] text-muted">{t('plan.confirmedBody')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plan.departmentSlugs.map((slug, index) => {
            const department = bySlug(slug);
            if (!department) return null;
            const ai = slug === plan.aiRecommendedSlug;
            return card(department, {
              role: ai ? 'recommended' : 'chosen',
              badge: ai ? (
                <Badge tone="brand">{t('plan.aiBadge')}</Badge>
              ) : (
                <Badge tone="neutral">{t('plan.myChoice', { n: index + 1 })}</Badge>
              ),
              footer: action(department, { canStart: true }),
            });
          })}
        </div>
        {others.length ? (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{t('plan.others')}</h3>
            <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface">
              {others.map((department) => {
                const session = sessionFor(department.slug);
                return (
                  <li
                    key={department.slug}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                    data-department-slug={department.slug}
                    data-department-status={department.status}
                    data-department-session={session?.status ?? 'none'}
                    data-plan-role="outside"
                  >
                    <span className="font-medium" style={{ color: department.accentColor }}>
                      {department.name}
                    </span>
                    {session ? (
                      // A bootcamp from before the plan carries on.
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startBootcamp(department.slug)}
                        loading={busy === department.slug}
                      >
                        {t('chooser.resume')}
                      </Button>
                    ) : (
                      <span className="text-subtle">{t('plan.notInPlan')}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }

  // ---------------------------------------------------------- not confirmed

  const steps: Array<[Step, MessageKey]> = [
    ['choose', 'plan.step.choose'],
    ['recommend', 'plan.step.recommend'],
    ['confirm', 'plan.step.confirm'],
  ];
  const recommendedDepartment = recommended ? bySlug(recommended) : undefined;
  const three = [...chosen, ...(recommended ? [recommended] : [])];
  const notPlayable = three
    .map(bySlug)
    .filter((d): d is DepartmentDefinition => !!d && d.status !== 'playable');

  return (
    <div className="space-y-5" data-testid="department-plan" data-plan-state={step}>
      <ol className="flex flex-wrap items-center gap-2" aria-label={t('plan.stepsLabel')}>
        {steps.map(([key, label], index) => {
          const active = key === step;
          return (
            <li
              key={key}
              aria-current={active ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-muted'
              }`}
            >
              <span aria-hidden className="font-mono">
                {String.fromCharCode(65 + index)}
              </span>
              {t(label)}
            </li>
          );
        })}
      </ol>

      {!preSurveyComplete ? (
        <p
          className="rounded-xl border border-warn-400/40 bg-sunken px-4 py-3 text-xs text-body"
          data-testid="plan-survey-first"
        >
          {t('plan.surveyFirst')}{' '}
          <Link href="/pre-survey" className="font-semibold text-brand-400 hover:underline">
            {t('plan.surveyLink')}
          </Link>
        </p>
      ) : null}

      {step === 'choose' ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-sunken px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1" aria-hidden>
                {[0, 1].map((index) => (
                  <span
                    key={index}
                    className={`h-1.5 w-7 rounded-full ${index < chosen.length ? 'bg-brand-500' : 'bg-line-strong'}`}
                  />
                ))}
              </div>
              <p className="text-[11px] text-muted">
                <span className="font-semibold text-strong" data-testid="plan-count">
                  {t('plan.count', { count: chosen.length })}
                </span>{' '}
                · {t('plan.chooseHint')}
              </p>
            </div>
            <Button
              size="sm"
              onClick={fetchRecommendation}
              loading={busy === 'recommend'}
              disabled={chosen.length !== 2 || !preSurveyComplete}
              data-testid="plan-see-recommendation"
            >
              {t('plan.seeRecommendation')}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const index = chosen.indexOf(department.slug);
              return card(department, {
                onSelect: () => toggle(department.slug),
                selected: index >= 0,
                badge: index >= 0 ? <Badge tone="neutral">{t('plan.myChoice', { n: index + 1 })}</Badge> : null,
                // Bootcamps from before the plan stay resumable.
                footer: sessionFor(department.slug) ? action(department, { canStart: false }) : null,
              });
            })}
          </div>
        </>
      ) : null}

      {step === 'recommend' && recommendedDepartment ? (
        <div className="space-y-4" data-testid="plan-recommendation" data-recommended={recommendedDepartment.slug}>
          <div className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
            <p className="text-sm font-semibold text-strong">{t('plan.recommendTitle')}</p>
            <p className="mt-0.5 text-xs text-body">{t('plan.recommendBody')}</p>
          </div>
          <div className="max-w-md">
            {card(recommendedDepartment, {
              role: 'recommended',
              badge: <Badge tone="brand">{t('plan.aiBadge')}</Badge>,
            })}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep('choose')}>
              {t('plan.back')}
            </Button>
            <Button onClick={() => setStep('confirm')} data-testid="plan-review">
              {t('plan.next')}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'confirm' && recommended ? (
        <div className="space-y-4" data-testid="plan-review-three">
          <div className="rounded-2xl border border-line bg-sunken px-4 py-3">
            <p className="text-sm font-semibold text-strong">{t('plan.confirmTitle')}</p>
            <p className="mt-0.5 text-xs text-muted">{t('plan.confirmBody')}</p>
          </div>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {three.map((slug, index) => {
              const department = bySlug(slug);
              if (!department) return null;
              const ai = slug === recommended;
              return (
                <li
                  key={slug}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm"
                  data-plan-row={ai ? 'recommended' : 'chosen'}
                  data-department-slug={slug}
                >
                  <span className="w-36 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {ai ? t('plan.aiBadge') : t('plan.myChoice', { n: index + 1 })}
                  </span>
                  <span className="min-w-0 flex-1 font-semibold" style={{ color: department.accentColor }}>
                    {department.name}
                  </span>
                  {department.status === 'playable' ? (
                    <Badge tone="success" dot>
                      {t('chooser.playable')}
                    </Badge>
                  ) : (
                    <Badge tone="muted">{t('chooser.comingSoon')}</Badge>
                  )}
                </li>
              );
            })}
          </ul>
          {notPlayable.length ? (
            <p
              className="rounded-xl border border-warn-400/40 bg-sunken px-4 py-3 text-xs text-body"
              data-testid="plan-coming-soon-note"
            >
              {t('plan.comingSoonNote', { names: notPlayable.map((d) => d.name).join(', ') })}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setRecommended(null);
                setStep('choose');
              }}
            >
              {t('plan.back')}
            </Button>
            <Button onClick={confirmPlan} loading={busy === 'confirm'} data-testid="plan-confirm">
              {t('plan.confirm')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
