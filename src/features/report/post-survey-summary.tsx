import { Card, CardHeader } from '@/components/ui';
import type { ComparisonAnswers, DepartmentAnswers } from '@/content/post-survey';
import type { MessageKey } from '@/i18n/messages/en';
import type { Translate } from '@/i18n/translate';
import type { CareerPostSurvey } from '@/types/runtime';

const SHOWN = ['a1', 'a2', 'a3', 'a4'] as const;

/**
 * What the student said after the work, as they said it: interest, wanting to
 * do it again, a felt fit and understanding of the job (1–7, per department),
 * the order they want to explore next, and their confidence in a career
 * choice. Nothing here is added to Pre-LIKE or SKILL FIT, and no before/after
 * change is computed — the questions and scales differ. Part C (the X-PASS
 * experience) is not shown: it is about the service, not the student.
 */
export function PostSurveySummary({
  survey,
  nameOf,
  t,
}: {
  survey: CareerPostSurvey;
  nameOf: (slug: string) => string;
  t: Translate;
}) {
  const perDepartment = survey.departmentAnswers as Record<string, DepartmentAnswers>;
  const comparison = survey.comparisonAnswers as ComparisonAnswers;
  return (
    <Card data-testid="post-survey-summary">
      <CardHeader title={t('report.post.title')} subtitle={t('report.post.subtitle')} />
      <div className="overflow-x-auto px-5 py-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted">
              <th className="pb-2 pr-3 font-medium">{t('common.department')}</th>
              {SHOWN.map((key) => (
                <th key={key} className="pb-2 pr-3 text-right font-medium">
                  {t(`report.post.${key}` as MessageKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {survey.departmentSlugs.map((slug) => (
              <tr key={slug} data-post-summary={slug}>
                <td className="py-2 pr-3 text-strong">{nameOf(slug)}</td>
                {SHOWN.map((key) => {
                  const value = perDepartment[slug]?.[key];
                  return (
                    <td key={key} className="py-2 pr-3 text-right font-mono text-strong" data-post-value={key}>
                      {value === undefined ? '—' : t('report.post.value', { value })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted">{t('report.post.b1')}</dt>
            <dd className="mt-1 text-strong" data-testid="post-summary-b1">
              {comparison.b1Mode === 'ranked'
                ? (comparison.b1Order ?? []).filter(Boolean).map((slug, i) => `${i + 1}. ${nameOf(slug)}`).join('  ')
                : comparison.b1Mode === 'none'
                  ? t('report.post.b1.none')
                  : t('report.post.b1.undecided')}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-medium uppercase tracking-wider text-muted">{t('report.post.b5')}</dt>
            <dd className="mt-1 font-mono text-strong" data-testid="post-summary-b5">
              {comparison.b5 === undefined ? '—' : t('report.post.value', { value: comparison.b5 })}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-[10px] leading-relaxed text-subtle">{t('report.post.note')}</p>
      </div>
    </Card>
  );
}
