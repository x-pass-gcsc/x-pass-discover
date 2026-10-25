import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { getRepository } from '@/db/repository';
import { PasswordForm } from '@/features/account/password-form';
import { ProfileForm } from '@/features/account/profile-form';
import { getLocale, getT } from '@/i18n/server';
import { isMessageKey } from '@/i18n/translate';
import { getCurrentUser, hasPassword } from '@/lib/auth/session';
import type { SessionStatus } from '@/types/runtime';

const STATUS_TONE: Record<SessionStatus, 'muted' | 'brand' | 'success' | 'warn'> = {
  not_started: 'muted',
  in_progress: 'brand',
  completed: 'success',
  expired: 'warn',
};

/**
 * My Page: the account (display name, email), its password, and the
 * bootcamps it has started. An account without a password lands here straight
 * from sign-in, and the password card says why it matters.
 */
export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [t, locale, passwordSet, sessions] = await Promise.all([
    getT(),
    getLocale(),
    hasPassword(user.id),
    getRepository().listSessionsForUser(user.id),
  ]);
  const date = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
  const departmentName = (slug: string) => {
    const key = `dept.${slug}`;
    return isMessageKey(key) ? t(key) : slug;
  };

  return (
    <AppShell title={t('mypage.title')} subtitle={t('mypage.subtitle')}>
      <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('mypage.profile.title')} />
          <div className="space-y-4 px-5 py-4">
            <div>
              <p className="text-xs font-medium text-strong">{t('auth.email')}</p>
              <p className="mt-1 text-sm text-body" data-testid="mypage-email">
                {user.email}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {t('mypage.profile.emailNote')}
                <br />
                {t('mypage.profile.memberSince', { date: date.format(new Date(user.createdAt)) })}
              </p>
            </div>
            <ProfileForm initialDisplayName={user.displayName} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t('mypage.password.title')}
            subtitle={
              passwordSet ? t('mypage.password.changeLead') : t('mypage.password.unsetLead')
            }
            right={
              <Badge tone={passwordSet ? 'success' : 'warn'} dot data-testid="password-badge">
                {passwordSet ? t('mypage.password.set') : t('mypage.password.unset')}
              </Badge>
            }
          />
          <div className="px-5 py-4">
            <PasswordForm hasPassword={passwordSet} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t('mypage.bootcamps.title')}
            right={
              <Link
                href="/report"
                className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                {t('mypage.bootcamps.report')}
              </Link>
            }
          />
          <div className="px-5 py-4">
            {sessions.length === 0 ? (
              <EmptyState>
                <p>{t('mypage.bootcamps.empty')}</p>
                <Link
                  href="/departments"
                  className="mt-2 inline-block font-medium text-brand-600 underline-offset-2 hover:underline"
                >
                  {t('mypage.bootcamps.choose')}
                </Link>
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line" data-testid="mypage-bootcamps">
                {sessions.map((session) => (
                  <li key={session.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-strong">
                        {departmentName(session.departmentSlug)}
                      </p>
                      <p className="text-[11px] text-muted">
                        {t('mypage.bootcamps.started', {
                          date: date.format(new Date(session.startedAt)),
                        })}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONE[session.status]} dot>
                      {t(`sessionStatus.${session.status}`)}
                    </Badge>
                    <Link
                      href={`/office?session=${session.id}`}
                      className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11px] text-body transition-colors hover:border-line-strong hover:bg-sunken hover:text-strong"
                    >
                      {t('mypage.bootcamps.open')}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
