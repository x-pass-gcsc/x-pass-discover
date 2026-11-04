import Link from 'next/link';
import { Button } from '@/components/ui';
import { isFromEarlierSurvey } from '@/content/pre-survey';
import { getRepository } from '@/db/repository';
import { getT } from '@/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';

/**
 * Tells a student who answered an earlier version of the pre-survey that a
 * new one is waiting. It shows on every signed-in page until they submit the
 * new questions, and never for a student who has not taken any version yet —
 * the lobby already leads them to it.
 */
export async function NewSurveyNotice() {
  const user = await getCurrentUser();
  if (!user) return null;
  const survey = await getRepository().getPreSurvey(user.id);
  if (!survey || !isFromEarlierSurvey(survey.answers)) return null;
  const t = await getT();

  return (
    <div
      role="status"
      data-testid="new-survey-notice"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-strong">{t('survey.newNotice.title')}</p>
        <p className="mt-0.5 text-xs text-body">{t('survey.newNotice.body')}</p>
      </div>
      <Link href="/pre-survey" className="shrink-0">
        <Button size="sm">{t('survey.newNotice.cta')}</Button>
      </Link>
    </div>
  );
}
