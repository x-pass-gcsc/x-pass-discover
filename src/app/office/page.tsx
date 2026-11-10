import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { RuntimeBadges } from '@/components/branding';
import { Button } from '@/components/ui';
import { getRepository } from '@/db/repository';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { runtimeModeSummary } from '@/lib/env';
import { loadSessionView } from '@/services/scenario/session-service';
import { loadDepartmentDesk } from '@/features/departments/load-desk';
import { OfficeClient } from '@/features/office/office-client';
import { getPostSurveyAccess } from '@/services/post-survey/post-survey-service';
import type { SessionView } from '@/types/session-view';

export default async function OfficePage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; work?: string; step?: string; select?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { session: requestedSessionId, work, step, select } = await searchParams;
  const repo = getRepository();

  // Fall back to the student's most recent session so walking into the office
  // from anywhere still lands them in their own bootcamp.
  const sessions = await repo.listSessionsForUser(user.id);
  const target =
    sessions.find((s) => s.id === requestedSessionId) ??
    sessions.find((s) => s.status === 'in_progress') ??
    sessions[0] ??
    null;

  const locale = await getLocale();
  let view: SessionView | null = null;
  if (target) {
    try {
      view = await loadSessionView(target.id, user.id, locale);
    } catch {
      view = null;
    }
  }
  // The reception desk: departments are chosen and changed inside the office.
  const desk = await loadDepartmentDesk(user.id, locale);
  // Once all three departments are done, the office points at the post-survey.
  const postSurveyOpen = (await getPostSurveyAccess(user.id)).state === 'open';

  const runtime = runtimeModeSummary();
  const t = await getT();

  return (
    <AppShell
      title={t('office.title')}
      subtitle={view ? view.department.projectTitle : t('office.visitorMode')}
      backHref="/welcome"
      backLabel={t('departments.backWelcome')}
      wide
      right={
        <RuntimeBadges
          persistence={runtime.persistence}
          persistenceLabel={runtime.persistenceLabel}
          persistenceIsEphemeral={runtime.persistenceIsEphemeral}
          ai={runtime.ai}
          aiLabel={runtime.aiLabel}
          aiModeDowngraded={runtime.aiModeDowngraded}
        />
      }
    >
      {postSurveyOpen ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"
          data-testid="post-survey-callout"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-strong">{t('post.callout.title')}</p>
            <p className="mt-0.5 text-xs text-body">{t('post.callout.body')}</p>
          </div>
          <Link href="/post-survey" className="shrink-0">
            <Button size="sm">{t('post.callout.cta')}</Button>
          </Link>
        </div>
      ) : null}
      <OfficeClient
        initialView={view}
        openWork={work === '1'}
        openStepKey={step ?? null}
        desk={desk}
        openDesk={select === '1'}
        playerName={user.displayName}
      />
    </AppShell>
  );
}
