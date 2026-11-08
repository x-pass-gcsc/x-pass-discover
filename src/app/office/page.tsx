import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { RuntimeBadges } from '@/components/branding';
import { getRepository } from '@/db/repository';
import { getLocale, getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { runtimeModeSummary } from '@/lib/env';
import { loadSessionView } from '@/services/scenario/session-service';
import { loadDepartmentDesk } from '@/features/departments/load-desk';
import { OfficeClient } from '@/features/office/office-client';
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
