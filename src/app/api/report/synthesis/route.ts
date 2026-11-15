import { listLocalizedDepartments } from '@/content/departments';
import { getLocale, getT } from '@/i18n/server';
import { withUser } from '@/lib/api';
import { ScenarioRuleError } from '@/lib/errors';
import { loadFinalReportInput } from '@/services/report/final-report';
import { generateSynthesis } from '@/services/report/synthesis';

/**
 * The final report's overall summary, written by Claude (and stored) when it
 * can be, else by the rules. Only once the report is open.
 */
export async function POST() {
  return withUser(async (user) => {
    const input = await loadFinalReportInput(user.id);
    if (!input) throw new ScenarioRuleError('Your report is not open yet.', 'report_locked');
    const [locale, t] = await Promise.all([getLocale(), getT()]);
    const localized = listLocalizedDepartments(locale);
    const nameOf = (slug: string) => localized.find((d) => d.slug === slug)?.name ?? slug;
    return { synthesis: await generateSynthesis(user.id, input, locale, t, nameOf) };
  });
}
