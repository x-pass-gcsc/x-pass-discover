import { likeForDepartment, preLikeSource } from '@/content/pre-survey';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { getRepository } from '@/db/repository';
import { DEPARTMENTS, listLocalizedDepartments } from '@/content/departments';
import { PS50_RUBRIC_VERSION, scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { PreLikeAreas } from '@/features/survey/pre-like-areas';
import type { MessageKey } from '@/i18n/messages/en';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Career report.
 *
 * LIKE and SKILL FIT are two separate columns that are never combined into a
 * single "career fit" number. LIKE is one measure across departments, so it is
 * drawn as a single-hue bar — identity is carried by the row label, not by the
 * colour, and every bar is directly labelled so the value never depends on
 * reading the colour. SKILL FIT reads `NE` (Not Enough Evidence) until the
 * evaluation pipeline exists.
 *
 * LIKE comes from the pre-survey. The 50-item survey is scored by the PS50
 * rubric as a 0–100 Pre-LIKE index with three areas per job, shown only once
 * all 50 answers are in. A record from an earlier survey keeps its old 20–100
 * values, labelled as such and never mixed with the new index.
 */
export default async function ReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const repo = getRepository();
  const [preSurvey, sessions] = await Promise.all([
    repo.getPreSurvey(user.id),
    repo.listSessionsForUser(user.id),
  ]);

  const completedSlugs = new Set(
    sessions.filter((s) => s.status === 'completed').map((s) => s.departmentSlug),
  );

  const answers = preSurvey?.answers;
  const source = preLikeSource(answers);
  const ps50 = source === 'ps50-v1' && answers ? scorePreSurvey50(answers) : null;
  const candidates = new Set<string>(ps50?.complete ? ps50.explorationCandidates : []);
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const localized = listLocalizedDepartments(locale);
  const nameOf = (slug: string) => localized.find((d) => d.slug === slug)?.name ?? slug;

  const rows = DEPARTMENTS.map((department) => {
    const like = likeForDepartment(answers, department.slug);
    return { department, like, completed: completedSlugs.has(department.slug) };
  });

  const hasLike = rows.some((row) => row.like !== null);

  return (
    <AppShell
      title={t('report.title')}
      subtitle={t('report.subtitle')}
      backHref="/office"
      backLabel={t('office.title')}
    >
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title={t('report.likeFit.title')}
            subtitle={t('report.likeFit.subtitle')}
          />

          <div className="px-5 py-4">
            <div className="grid grid-cols-[minmax(110px,1fr)_minmax(140px,2fr)_84px] gap-x-4 pb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted">
              <span>{t('common.department')}</span>
              <span>
                LIKE
                <span className="ml-1.5 font-normal normal-case text-subtle" data-testid="like-scale">
                  {t('report.likeNote')} ·{' '}
                  {source === 'legacy' ? t('report.preLike.scaleLegacy') : t('report.preLike.scaleNew')}
                </span>
              </span>
              <span className="text-right">
                SKILL FIT
                <span className="block font-normal normal-case text-subtle">
                  {t('report.fitNote')}
                </span>
              </span>
            </div>

            <div className="divide-y divide-line">
              {rows.map(({ department, like, completed }) => (
                <div
                  key={department.slug}
                  className="grid grid-cols-[minmax(110px,1fr)_minmax(140px,2fr)_84px] items-center gap-x-4 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: department.accentColor }}
                    />
                    <span className="truncate text-xs text-strong">
                      {nameOf(department.slug)}
                    </span>
                    {completed ? (
                      <Badge tone="success" className="shrink-0">
                        {t('report.done')}
                      </Badge>
                    ) : null}
                    {candidates.has(department.slug) ? (
                      <Badge tone="brand" className="shrink-0" data-testid="explore-candidate">
                        {t('report.preLike.candidate')}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 flex-1 overflow-hidden rounded-full bg-sunken"
                      role="img"
                      aria-label={
                        like === null
                          ? t('report.likeAriaNone', { department: nameOf(department.slug) })
                          : t('report.likeAria', { department: nameOf(department.slug), value: like })
                      }
                    >
                      {like !== null ? (
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.max(like, 2)}%` }}
                        />
                      ) : null}
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-xs text-strong">
                      {like ?? '—'}
                    </span>
                  </div>

                  <div className="text-right">
                    <Badge tone="muted" title={t('report.ne.title')}>
                      NE
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {ps50 && !ps50.complete ? (
              <p className="mt-3 rounded-lg border border-warn-400/40 bg-sunken px-3 py-2 text-[11px] text-body" data-testid="pre-like-incomplete">
                {t('report.preLike.incomplete', { done: ps50.completedQuestions })}{' '}
                <Link href="/pre-survey" className="text-brand-400 hover:underline">
                  {t('report.surveyLink')}
                </Link>
              </p>
            ) : null}

            {source === 'legacy' ? (
              <p className="mt-3 rounded-lg border border-line bg-sunken px-3 py-2 text-[11px] text-muted" data-testid="pre-like-legacy">
                {t('report.preLike.legacyNote')}
              </p>
            ) : null}

            {ps50?.complete ? (
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {t('report.preLike.candidatesNote')}
                {ps50.similarTopScores ? <> {t('report.preLike.similar')}</> : null}
              </p>
            ) : null}

            {!hasLike && !ps50 ? (
              <p className="mt-3 rounded-lg border border-line bg-sunken px-3 py-2 text-[11px] text-muted">
                {t('report.noLike.before')}
                <Link href="/pre-survey" className="text-brand-400 hover:underline">
                  {t('report.surveyLink')}
                </Link>
                {t('report.noLike.after')}
              </p>
            ) : null}
          </div>

          <div className="border-t border-line px-5 py-4">
            <p className="text-[11px] leading-relaxed text-muted">
              <strong className="text-strong">{t('report.ne.lead')}</strong> {t('report.ne.body')}
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          {ps50?.complete ? (
            <Card data-testid="pre-like-breakdown">
              <CardHeader title={t('report.preLike.title')} subtitle={t('report.preLike.subtitle')} />
              <div className="space-y-4 px-5 py-4">
                {DEPARTMENTS.map((department) => {
                  const role = ps50.roles[department.slug as keyof typeof ps50.roles];
                  const name = nameOf(department.slug);
                  if (!role) return null;
                  return (
                    <div key={department.slug} data-department-breakdown={department.slug}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-strong">{name}</span>
                        {department.status !== 'playable' ? (
                          <Badge tone="muted" className="shrink-0">
                            {t('chooser.comingSoon')}
                          </Badge>
                        ) : null}
                        <span className="ml-auto font-mono text-xs text-strong">{role.index0to100}</span>
                      </div>
                      <div className="mt-1.5">
                        <PreLikeAreas role={role} name={name} t={t} />
                      </div>
                    </div>
                  );
                })}
                <p className="text-[10px] leading-relaxed text-subtle">
                  {t('report.preLike.disclaimer', { version: PS50_RUBRIC_VERSION })}
                </p>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title={t('report.howTo.title')} />
            <div className="space-y-3 px-5 py-4 text-xs leading-relaxed text-body">
              <p className="rounded-lg border border-line bg-sunken px-3 py-2 text-muted line-through">
                {t('report.howTo.wrong')}
              </p>
              <p>{t('report.howTo.p1')}</p>
              <p className="text-muted">{t('report.howTo.p2')}</p>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('report.bootcamps.title')} />
            <div className="px-5 py-4">
              {sessions.length === 0 ? (
                <EmptyState icon="🧭">
                  {t('report.bootcamps.empty')}{' '}
                  <Link href="/office?select=1" className="text-brand-400 hover:underline">
                    {t('report.bootcamps.choose')}
                  </Link>
                </EmptyState>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((session) => (
                    <li key={session.id} className="flex items-center justify-between gap-3">
                      <Link
                        href={`/office?session=${session.id}`}
                        className="text-xs text-strong underline-offset-4 transition-colors hover:text-strong hover:underline"
                      >
                        {nameOf(session.departmentSlug)}
                      </Link>
                      <Badge
                        tone={session.status === 'completed' ? 'success' : 'brand'}
                        dot
                      >
                        {t(`sessionStatus.${session.status}` as MessageKey)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <p className="px-1 text-[11px] leading-relaxed text-subtle">
            {t('report.footer')}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
