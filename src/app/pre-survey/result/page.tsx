import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import { DEPARTMENTS, listLocalizedDepartments } from '@/content/departments';
import { preLikeSource } from '@/content/pre-survey';
import { PS50_RUBRIC_VERSION, scorePreSurvey50, type RoleSlug } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import { PreLikeAreas } from '@/features/survey/pre-like-areas';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getReportAccess } from '@/services/report/report-access';

/**
 * The pre-survey's result. It is not shown when the survey is submitted: like
 * the rest of the report, it opens only once `getReportAccess` says so, and
 * until then this address sends the student to the (locked) report. When it
 * opens, it shows the Pre-LIKE index of each job with its three areas, and the
 * jobs worth exploring first (the rubric's top three, ties included). It is a self-reported preference,
 * so it is worded as directions to try, never as what the student is good at.
 * Only a complete 50-answer survey has a result; anything else goes back to it.
 */
export default async function PreSurveyResultPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  // Withheld until the final report opens; the report page says what is left.
  if (!(await getReportAccess(user.id)).unlocked) redirect('/report');
  const answers = (await getRepository().getPreSurvey(user.id))?.answers;
  if (preLikeSource(answers) !== 'ps50-v1' || !answers) redirect('/pre-survey');
  const score = scorePreSurvey50(answers);
  if (!score.complete) redirect('/pre-survey');

  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const localized = listLocalizedDepartments(locale);
  const jobs = DEPARTMENTS.filter((d) => d.slug in score.roles)
    .map((department) => ({
      department,
      name: localized.find((d) => d.slug === department.slug)?.name ?? department.name,
      role: score.roles[department.slug as RoleSlug],
    }))
    .sort((a, b) => (b.role.index0to100 ?? 0) - (a.role.index0to100 ?? 0));
  const recommended = jobs.filter((job) => score.explorationCandidates.includes(job.department.slug as RoleSlug));

  return (
    <AppShell title={t('result.title')} subtitle={t('result.subtitle')} backHref="/office" backLabel={t('office.title')}>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card data-testid="survey-result-recommended">
          <CardHeader title={t('result.recommendedTitle')} subtitle={t('result.recommendedBody')} />
          <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
            {recommended.map(({ department, name, role }) => {
              const playable = department.status === 'playable';
              return (
                <div
                  key={department.slug}
                  className="flex flex-col rounded-xl border border-line bg-sunken/60 p-4"
                  data-recommended={department.slug}
                >
                  <div className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: department.accentColor }}
                    />
                    <span className="min-w-0 flex-1 text-sm font-semibold text-strong">{name}</span>
                    <span className="font-mono text-2xl font-bold leading-none text-strong">{role.index0to100}</span>
                  </div>
                  <div className="mt-3">
                    <PreLikeAreas role={role} name={name} t={t} />
                  </div>
                  <div className="mt-auto pt-3">
                    {playable ? (
                      <Link href="/office?select=1">
                        <Button size="sm" className="w-full">
                          {t('result.tryInOffice')}
                        </Button>
                      </Link>
                    ) : (
                      <p className="flex items-center gap-2 text-[11px] text-muted">
                        <Badge tone="muted">{t('chooser.comingSoon')}</Badge>
                        {t('result.comingSoonBody')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {score.similarTopScores ? (
            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">{t('report.preLike.similar')}</p>
          ) : null}
        </Card>

        <Card data-testid="survey-result-all">
          <CardHeader title={t('result.allTitle')} subtitle={t('result.allBody')} />
          <ol className="space-y-2.5 px-5 py-4">
            {jobs.map(({ department, name, role }) => (
              <li
                key={department.slug}
                className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.4fr)_32px] items-center gap-3 text-xs"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-strong">{name}</span>
                  {score.explorationCandidates.includes(department.slug as RoleSlug) ? (
                    <Badge tone="brand" className="shrink-0">
                      {t('report.preLike.candidate')}
                    </Badge>
                  ) : null}
                </span>
                <span
                  className="h-2 overflow-hidden rounded-full bg-sunken"
                  role="img"
                  aria-label={`${name} Pre-LIKE ${role.index0to100} / 100`}
                >
                  <span
                    className="block h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.max(role.index0to100 ?? 0, 2)}%` }}
                  />
                </span>
                <span className="text-right font-mono text-strong">{role.index0to100}</span>
              </li>
            ))}
          </ol>
          <p className="border-t border-line px-5 py-3 text-[10px] leading-relaxed text-subtle">
            {t('report.preLike.subtitle')} {t('report.preLike.disclaimer', { version: PS50_RUBRIC_VERSION })}
          </p>
        </Card>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Link href="/report">
          <Button variant="secondary">{t('result.viewReport')}</Button>
        </Link>
        <Link href="/office" data-testid="result-continue">
          <Button>{t('result.continue')} →</Button>
        </Link>
      </div>
    </AppShell>
  );
}
