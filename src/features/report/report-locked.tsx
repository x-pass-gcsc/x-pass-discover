import Link from 'next/link';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import type { DepartmentDefinition } from '@/types/scenario';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';
import { REQUIRED_DEPARTMENTS, type ReportAccess } from '@/services/report/report-access';

/**
 * The report before it opens: what is still to do, and nothing of the
 * analysis. The page that renders this computes no scores at all, so none can
 * reach the browser.
 */
export function ReportLocked({
  access,
  departments,
  sessions,
  t,
}: {
  access: ReportAccess;
  departments: DepartmentDefinition[];
  sessions: Array<{ id: string; departmentSlug: string; status: string }>;
  t: Translate;
}) {
  const nameOf = (slug: string) => departments.find((d) => d.slug === slug)?.name ?? slug;
  const steps = [
    {
      key: 'pre-survey',
      label: t('report.locked.preSurvey'),
      state: access.preSurveyComplete ? 'done' : 'todo',
    },
    {
      key: 'departments',
      label: t('report.locked.departments', {
        done: access.completedDepartments.length,
        total: REQUIRED_DEPARTMENTS,
      }),
      state: access.completedDepartments.length >= REQUIRED_DEPARTMENTS ? 'done' : 'todo',
    },
    {
      key: 'post-survey',
      label: t('report.locked.postSurvey'),
      state: access.postSurveySubmitted ? 'done' : 'unavailable',
    },
  ] as const;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]" data-testid="report-locked">
      <Card>
        <CardHeader title={t('report.locked.title')} subtitle={t('report.locked.body')} />
        <ol className="space-y-2.5 px-5 py-4">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className="flex items-center gap-3 rounded-xl border border-line bg-sunken/60 px-3 py-2.5 text-xs"
              data-report-step={step.key}
              data-report-step-state={step.state}
            >
              <span
                aria-hidden
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  step.state === 'done' ? 'bg-accent-500 text-white' : 'border border-line-strong bg-surface text-muted'
                }`}
              >
                {step.state === 'done' ? '✓' : index + 1}
              </span>
              <span className="min-w-0 flex-1 text-strong">{step.label}</span>
              <Badge tone={step.state === 'done' ? 'success' : 'muted'} className="shrink-0">
                {t(`report.locked.state.${step.state}` as MessageKey)}
              </Badge>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4">
          {access.preSurveyComplete ? null : (
            <Link href="/pre-survey">
              <Button variant="secondary">{t('report.locked.takeSurvey')}</Button>
            </Link>
          )}
          <Link href="/office">
            <Button>{t('report.locked.continue')}</Button>
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('report.bootcamps.title')} />
        <div className="px-5 py-4">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted">
              {t('report.bootcamps.empty')}{' '}
              <Link href="/office?select=1" className="text-brand-400 hover:underline">
                {t('report.bootcamps.choose')}
              </Link>
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-3">
                  <Link
                    href={`/office?session=${session.id}`}
                    className="text-xs text-strong underline-offset-4 hover:underline"
                  >
                    {nameOf(session.departmentSlug)}
                  </Link>
                  <Badge tone={session.status === 'completed' ? 'success' : 'brand'} dot>
                    {t(`sessionStatus.${session.status}` as MessageKey)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
