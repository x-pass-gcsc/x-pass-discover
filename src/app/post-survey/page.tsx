import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Button, Card } from '@/components/ui';
import { listLocalizedDepartments } from '@/content/departments';
import type { PostSurveyAnswers } from '@/content/post-survey';
import { getRepository } from '@/db/repository';
import { PostSurveyForm, type SurveyDepartment } from '@/features/post-survey/post-survey-form';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getPostSurveyAccess } from '@/services/post-survey/post-survey-service';

/**
 * The post-survey. Which of its three states the student sees is decided here
 * on the server from their records — never from a flag in the address:
 *
 *   locked     what is still to do, and the way back to the office
 *   open       the form, with any saved draft restored
 *   submitted  done, and the way to the report
 */
export default async function PostSurveyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const [access, t, locale] = await Promise.all([getPostSurveyAccess(user.id), getT(), getLocale()]);
  const departments = listLocalizedDepartments(locale);
  const nameOf = (slug: string) => departments.find((d) => d.slug === slug)?.name ?? slug;

  const shell = (children: React.ReactNode) => (
    <AppShell title={t('post.title')} subtitle={t('post.subtitle')} backHref="/office" backLabel={t('office.title')}>
      {children}
    </AppShell>
  );

  if (access.state === 'locked') {
    return shell(
      <Card className="mx-auto max-w-2xl p-6" data-testid="post-locked">
        <h2 className="text-lg font-bold text-strong">{t('post.locked.title')}</h2>
        <p className="mt-2 text-sm text-body">
          {!access.preSurveyComplete
            ? t('post.locked.preSurvey')
            : !access.planConfirmed
              ? t('post.locked.plan')
              : t('post.locked.body')}
        </p>
        {access.departmentSlugs.length ? (
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {access.departmentSlugs.map((slug) => {
              const done = access.completedDepartments.includes(slug);
              return (
                <li key={slug} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm" data-post-department={slug} data-post-department-state={done ? 'completed' : 'pending'}>
                  <span className="text-strong">{nameOf(slug)}</span>
                  <Badge tone={done ? 'success' : 'muted'}>{done ? t('post.locked.completed') : t('post.locked.pending')}</Badge>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-5 flex justify-end">
          <Link href={access.preSurveyComplete ? '/office?select=1' : '/pre-survey'}>
            <Button>{access.preSurveyComplete ? t('post.locked.office') : t('plan.surveyLink')}</Button>
          </Link>
        </div>
      </Card>,
    );
  }

  if (access.state === 'submitted') {
    return shell(
      <Card className="mx-auto max-w-2xl p-6" data-testid="post-done">
        <h2 className="text-lg font-bold text-strong">{t('post.done.title')}</h2>
        <p className="mt-2 text-sm text-body">{t('post.done.body')}</p>
        <div className="mt-5 flex justify-end">
          <Link href="/report">
            <Button>{t('post.done.report')}</Button>
          </Link>
        </div>
      </Card>,
    );
  }

  // Open: the form, the plan's departments with their own work, any draft.
  const repo = getRepository();
  const surveyDepartments: SurveyDepartment[] = await Promise.all(
    access.departmentSlugs.map(async (slug) => {
      const department = departments.find((d) => d.slug === slug);
      const sessionId = access.completedSessions[slug];
      const submissions = await repo.listSubmissions(sessionId);
      return {
        slug,
        name: department?.name ?? slug,
        projectTitle: department?.projectTitle ?? '',
        finalOutput: department?.finalOutput ?? '',
        accentColor: department?.accentColor ?? '#2563eb',
        sessionId,
        submissionTitle: submissions.at(-1)?.title ?? null,
      };
    }),
  );
  const draft = access.survey;
  const initialAnswers: PostSurveyAnswers = {
    departmentAnswers: (draft?.departmentAnswers ?? {}) as PostSurveyAnswers['departmentAnswers'],
    comparisonAnswers: (draft?.comparisonAnswers ?? {}) as PostSurveyAnswers['comparisonAnswers'],
    experienceAnswers: (draft?.experienceAnswers ?? {}) as PostSurveyAnswers['experienceAnswers'],
  };

  return shell(
    <PostSurveyForm
      departments={surveyDepartments}
      allDepartments={departments.map((d) => ({ slug: d.slug, name: d.name }))}
      initialAnswers={initialAnswers}
    />,
  );
}
