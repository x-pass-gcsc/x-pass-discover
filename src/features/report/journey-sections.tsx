import type { ReactNode } from 'react';
import { Badge, Card, CardHeader } from '@/components/ui';
import type { ComparisonAnswers, DepartmentAnswers } from '@/content/post-survey';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';
import type { DepartmentPlan } from '@/services/departments/plan-service';
import type { DepartmentBehavior } from '@/services/report/behavior-analysis';
import type { CareerPostSurvey } from '@/types/runtime';

type ConfirmedPlan = Extract<DepartmentPlan, { confirmed: true }>;

/** A numbered part of the report: 1 before, 2 during, 3 after. */
export function ReportStage({
  number,
  title,
  subtitle,
  id,
  children,
}: {
  number: string;
  title: string;
  subtitle: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4" aria-labelledby={`stage-${id}`} data-report-stage={id}>
      <div className="flex items-end gap-3 border-b border-line pb-2">
        <span className="font-mono text-2xl font-black leading-none text-brand-600">{number}</span>
        <div>
          <h2 id={`stage-${id}`} className="text-base font-bold text-strong">
            {title}
          </h2>
          <p className="text-[11px] text-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function howBadge(plan: ConfirmedPlan, slug: string, t: Translate) {
  if (slug === plan.aiRecommendedSlug) return <Badge tone="brand">{t('plan.aiBadge')}</Badge>;
  return <Badge tone="neutral">{t('plan.myChoice', { n: plan.userChosenSlugs.indexOf(slug) + 1 })}</Badge>;
}

/**
 * The comparison at a glance: for each department of the plan, where it
 * stood before (Pre-LIKE order), what the student did in it, and where it
 * stands after (their own ranking and interest). Columns are read side by
 * side, never added up.
 */
export function JourneyTable({
  plan,
  preLike,
  behavior,
  postSurvey,
  nameOf,
  t,
}: {
  plan: ConfirmedPlan;
  preLike: Record<string, number | null>;
  behavior: DepartmentBehavior[];
  postSurvey: CareerPostSurvey;
  nameOf: (slug: string) => string;
  t: Translate;
}) {
  const preOrder = [...plan.departmentSlugs].sort((a, b) => (preLike[b] ?? -1) - (preLike[a] ?? -1));
  const comparison = postSurvey.comparisonAnswers as ComparisonAnswers;
  const postOrder = comparison.b1Mode === 'ranked' ? (comparison.b1Order ?? []).filter(Boolean) : [];
  const answers = postSurvey.departmentAnswers as Record<string, DepartmentAnswers>;
  return (
    <Card data-testid="report-journey">
      <CardHeader title={t('report.journey.title')} subtitle={t('report.journey.subtitle')} />
      <div className="overflow-x-auto px-5 py-4">
        <table className="w-full min-w-[560px] text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2 pr-3 font-medium">{t('common.department')}</th>
              <th className="pb-2 pr-3 font-medium">{t('report.journey.before')}</th>
              <th className="pb-2 pr-3 font-medium">{t('report.journey.during')}</th>
              <th className="pb-2 font-medium">{t('report.journey.after')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {plan.departmentSlugs.map((slug) => {
              const b = behavior.find((x) => x.departmentSlug === slug);
              const post = answers[slug] ?? {};
              const postRank = postOrder.indexOf(slug);
              return (
                <tr key={slug} data-journey-row={slug}>
                  <td className="py-2.5 pr-3">
                    <div className="font-semibold text-strong">{nameOf(slug)}</div>
                    <div className="mt-1">{howBadge(plan, slug, t)}</div>
                  </td>
                  <td className="py-2.5 pr-3 text-body">
                    {t('report.journey.preRank', { rank: preOrder.indexOf(slug) + 1, total: preOrder.length })}
                    <div className="font-mono text-[11px] text-muted">
                      Pre-LIKE {preLike[slug] ?? '—'}
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-body">
                    {b ? (
                      <>
                        {t('report.journey.duringFacts', { questions: b.questions, resources: b.resourcesOpened })}
                        {b.revisions ? (
                          <div className="text-[11px] text-muted">
                            {t('report.journey.revisions', { count: b.revisions })}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 text-body">
                    {postRank >= 0
                      ? t('report.journey.postRank', { rank: postRank + 1, total: postOrder.length })
                      : t('report.journey.postUnranked')}
                    <div className="font-mono text-[11px] text-muted">
                      {t('report.journey.postInterest', { value: post.a1 ?? '—' })}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-[10px] leading-relaxed text-subtle">{t('report.journey.note')}</p>
      </div>
    </Card>
  );
}

/** Before: the plan the student made, and the recommendation they took. */
export function PlanBeforeCard({
  plan,
  nameOf,
  t,
}: {
  plan: ConfirmedPlan;
  nameOf: (slug: string) => string;
  t: Translate;
}) {
  return (
    <Card data-testid="report-plan">
      <CardHeader
        title={t('report.plan.title', { count: plan.size })}
        subtitle={plan.size === 3 ? t('report.plan.subtitle3') : t('report.plan.subtitle2')}
      />
      <ul className="space-y-2.5 px-5 py-4">
        {plan.departmentSlugs.map((slug) => (
          <li key={slug} className="rounded-xl border border-line bg-sunken/60 px-3 py-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-strong">{nameOf(slug)}</span>
              <span className="ml-auto">{howBadge(plan, slug, t)}</span>
            </div>
            {slug === plan.aiRecommendedSlug && plan.recommendationReason ? (
              <p className="mt-1.5 leading-relaxed text-body" data-testid="report-plan-reason">
                <span className="font-semibold text-strong">{t('plan.reasonTitle')}</span>{' '}
                {plan.recommendationReason}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

const fmtMinutes = (minutes: number, t: Translate) =>
  minutes >= 60
    ? t('report.behavior.hours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 })
    : t('report.behavior.minutes', { minutes });

/**
 * During: what the student did in each bootcamp — facts from the log, and
 * notes on how they worked, each traceable to those facts. No score.
 */
export function BehaviorCard({
  behavior,
  plan,
  nameOf,
  t,
}: {
  behavior: DepartmentBehavior[];
  plan: ConfirmedPlan;
  nameOf: (slug: string) => string;
  t: Translate;
}) {
  return (
    <Card data-testid="report-behavior">
      <CardHeader title={t('report.behavior.title')} subtitle={t('report.behavior.subtitle')} />
      <div className="grid gap-4 px-5 py-4 md:grid-cols-2 xl:grid-cols-3">
        {behavior.map((b) => {
          const facts: Array<[MessageKey, string | number]> = [
            ['report.behavior.steps', `${b.stepsCompleted}/${b.stepsTotal}`],
            ['report.behavior.elapsed', b.elapsedMinutes === null ? '—' : fmtMinutes(b.elapsedMinutes, t)],
            ['report.behavior.resources', b.resourcesOpened],
            ['report.behavior.questions', b.questions],
            ['report.behavior.followUps', b.followUps],
            ['report.behavior.facts', b.factsUncovered],
            ['report.behavior.revisions', b.revisions],
          ];
          return (
            <div
              key={b.departmentSlug}
              className="rounded-xl border border-line bg-sunken/50 px-4 py-3"
              data-behavior-department={b.departmentSlug}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-strong">{nameOf(b.departmentSlug)}</span>
                <span className="ml-auto">{howBadge(plan, b.departmentSlug, t)}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                {facts.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-2 border-b border-line/60 pb-1">
                    <dt className="text-muted">{t(label)}</dt>
                    <dd className="font-mono text-strong">{value}</dd>
                  </div>
                ))}
              </dl>
              {b.observations.length ? (
                <ul className="mt-3 space-y-1.5" data-testid="behavior-observations">
                  {b.observations.map((key) => (
                    <li key={key} className="flex gap-2 text-[11px] leading-relaxed text-body" data-observation={key}>
                      <span aria-hidden className="text-brand-600">●</span>
                      {t(`report.behavior.obs.${key}` as MessageKey)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[11px] text-muted">{t('report.behavior.obs.none')}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="border-t border-line px-5 py-3 text-[10px] leading-relaxed text-subtle">
        {t('report.behavior.note')}
      </p>
    </Card>
  );
}
