import 'server-only';
import { listLocalizedDepartments } from '@/content/departments';
import type { Locale } from '@/i18n/config';
import { getDepartmentPlan } from '@/services/departments/plan-service';
import { loadSessionView } from '@/services/scenario/session-service';
import type { User } from '@/types/runtime';

/**
 * What the senpai knows about where the student is.
 *
 * Everything here is information the student can already see on their own
 * screen: the public department cards, their own plan, and the mission and
 * instructions of the step they are on. Hidden persona facts, disclosure rules
 * and guardrail numbers are deliberately NOT read here, so the senpai cannot
 * become a shortcut around the conversations the scenario is built on.
 */

const LANGUAGE: Record<Locale, string> = {
  ja: 'Japanese',
  en: 'English',
  ko: 'Korean',
};

const PAGES: Array<[RegExp, string]> = [
  [/^\/start/, 'the X-PASS lobby / pre-survey intro'],
  [/^\/pre-survey\/result/, 'the pre-survey result page'],
  [/^\/pre-survey/, 'the pre-survey (a self-assessment questionnaire, answered 1–5)'],
  [/^\/welcome/, 'the welcome page after the pre-survey'],
  [/^\/departments/, 'the department selection page (pick two, the AI recommends a third)'],
  [/^\/office/, 'the 2.5D BITE office (walk with WASD / arrow keys, press E to talk or start work)'],
  [/^\/workspace\//, 'the work window of a bootcamp step (tasks, data room, mentor)'],
  [/^\/session\//, 'a bootcamp session overview'],
  [/^\/mypage/, 'My Page (account and progress)'],
  [/^\/post-survey/, 'the post-survey after the bootcamps'],
  [/^\/report/, 'the final career report (LIKE and SKILL FIT shown separately)'],
];

function describePage(path: string): string {
  return PAGES.find(([pattern]) => pattern.test(path))?.[1] ?? 'the home page';
}

async function describeSession(
  sessionId: string | null,
  user: User,
  locale: Locale,
): Promise<string | null> {
  if (!sessionId) return null;
  try {
    const view = await loadSessionView(sessionId, user.id, locale);
    const current = view.steps.find((s) => s.key === view.progress.currentStepKey) ?? null;
    return [
      `Department: ${view.department.name} — project "${view.department.projectTitle}"`,
      `Their role: ${view.scenario.studentRole}`,
      `Mission: ${view.scenario.mission}`,
      `Final deliverable: ${view.scenario.finalOutputTitle}`,
      `Progress: ${view.progress.completedSteps} of ${view.progress.totalSteps} steps completed`,
      current
        ? [
            `Current step: "${current.title}"`,
            current.summary ? `Step summary: ${current.summary}` : '',
            current.instructions ? `Step instructions: ${current.instructions}` : '',
            current.tasks.length
              ? `Tasks in this step: ${current.tasks.map((t) => `"${t.title}" (${t.status})`).join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  } catch {
    // Not theirs, or gone: talk without it rather than fail the question.
    return null;
  }
}

export async function buildSenpaiSystemPrompt({
  user,
  locale,
  path,
  sessionId,
}: {
  user: User;
  locale: Locale;
  path: string;
  sessionId: string | null;
}): Promise<string> {
  const departments = listLocalizedDepartments(locale)
    .map(
      (d) =>
        `- ${d.name} (${d.slug}): ${d.tagline} ${d.description} [${
          d.status === 'playable' ? 'playable now' : 'coming soon'
        }]`,
    )
    .join('\n');

  const [plan, session] = await Promise.all([
    getDepartmentPlan(user.id).catch(() => null),
    describeSession(sessionId, user, locale),
  ]);
  const planLine = plan?.confirmed
    ? `Their department plan: chose ${plan.userChosenSlugs.join(', ')}; AI recommended ${plan.aiRecommendedSlug}.`
    : 'They have not confirmed a department plan yet.';

  return `You are "AI Senpai" (AI先輩), a friendly senior colleague at BITE, a fictional food & beverage company, inside X-PASS Discover — a career-exploration web app where students "come to work" at BITE for a day, walk around a 2.5D office, try real business work in three departments, talk with AI colleagues, and finish with a career report that shows LIKE (what they enjoyed) and SKILL FIT (what they did well) as two separate things.

The student can open you from any screen, at any time, to ask anything: how to use the app, how to approach a task, what a department's work is really like, general career or job-hunting worries, or business basics (margins, negotiation, marketing funnels, interviews, and so on).

How you talk:
- Reply in ${LANGUAGE[locale]}. If the student writes in another language, follow their language.
- Warm, casual, encouraging — like a kind senior two or three years ahead. In Japanese use friendly タメ口 (〜だよ / 〜してみて), never stiff keigo.
- Keep it short: usually 2–6 sentences, or a short list. Plain text with light markdown only (**bold**, "- " bullets, "1. " lists). No headings, no tables, no code blocks.
- Ask a follow-up question when it would help the student think further.

What you must not do:
- Do not do graded work for them. When they ask for "the answer" to a task, give a way of thinking, a framework, or a hint, and let them decide. This is the same stance as the in-step mentor: "I won't tell you the answer, but I'll give you hints."
- You do NOT know BITE's internal or confidential details beyond what is written below (no hidden numbers, no what a customer or colleague will say in a meeting). Never invent BITE-specific facts, figures, or people. If asked, say you don't know and suggest where in the app to find out (the Data Room, the materials, or asking the colleague in the meeting).
- Nothing said here is scored or logged as evidence; you may tell them so if they worry.
- If a student seems to be in real distress or danger, respond with care and encourage them to talk to someone they trust or a professional support line.

Who you are talking to: ${user.displayName}.
Where they are right now: ${describePage(path)}.
${planLine}
${session ? `\nTheir current bootcamp:\n${session}\n` : ''}
BITE's departments (public information, as shown to the student):
${departments}`;
}
