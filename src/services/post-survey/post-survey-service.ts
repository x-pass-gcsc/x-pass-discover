import 'server-only';
import {
  POST_SURVEY_VERSION,
  draftSchema,
  finalIssues,
  tidyAnswers,
  type PostSurveyAnswers,
} from '@/content/post-survey';
import { scorePreSurvey50 } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import { ScenarioRuleError } from '@/lib/errors';
import { planFrom } from '@/services/departments/plan-service';
import type { CareerPostSurvey } from '@/types/runtime';

/**
 * Who may answer the post-survey, and saving and submitting it.
 *
 * Everything is decided here from stored records — the pre-survey, the
 * confirmed 2+1 plan, each department's session status and the survey row —
 * never from anything the client says about itself.
 *
 *   locked     the pre-survey, the plan or a department's bootcamp is not done
 *   open       all three departments completed; a draft may exist
 *   submitted  final; no further change
 */
export type PostSurveyState = 'locked' | 'open' | 'submitted';

export type PostSurveyAccess = {
  state: PostSurveyState;
  preSurveyComplete: boolean;
  planConfirmed: boolean;
  /** The plan's three departments; empty until it is confirmed. */
  departmentSlugs: string[];
  completedDepartments: string[];
  pendingDepartments: string[];
  /** The completed session of each plan department, for linking to its work. */
  completedSessions: Record<string, string>;
  survey: CareerPostSurvey | null;
};

export async function getPostSurveyAccess(userId: string): Promise<PostSurveyAccess> {
  const repo = getRepository();
  const [preSurvey, selection, sessions, survey] = await Promise.all([
    repo.getPreSurvey(userId),
    repo.getDepartmentSelection(userId),
    repo.listSessionsForUser(userId),
    repo.getCareerPostSurvey(userId),
  ]);
  const preSurveyComplete = !!preSurvey && scorePreSurvey50(preSurvey.answers).complete;
  const plan = planFrom(selection);
  const departmentSlugs = plan.confirmed ? plan.departmentSlugs : [];
  const completedSessions: Record<string, string> = {};
  for (const slug of departmentSlugs) {
    const done = sessions.find((s) => s.departmentSlug === slug && s.status === 'completed');
    if (done) completedSessions[slug] = done.id;
  }
  const completedDepartments = departmentSlugs.filter((slug) => completedSessions[slug]);
  const ready =
    preSurveyComplete && plan.confirmed && completedDepartments.length === departmentSlugs.length;
  const submitted =
    survey?.status === 'submitted' && sameSlugs(survey.departmentSlugs, departmentSlugs);

  return {
    state: !ready ? 'locked' : submitted ? 'submitted' : 'open',
    preSurveyComplete,
    planConfirmed: plan.confirmed,
    departmentSlugs,
    completedDepartments,
    pendingDepartments: departmentSlugs.filter((slug) => !completedSessions[slug]),
    completedSessions,
    survey,
  };
}

const sameSlugs = (a: string[], b: string[]) =>
  a.length === b.length && a.every((slug) => b.includes(slug));

async function openAccess(userId: string): Promise<PostSurveyAccess> {
  const access = await getPostSurveyAccess(userId);
  if (access.state === 'locked') {
    throw new ScenarioRuleError(
      'The post-survey opens once all three of your departments are completed.',
      'post_survey_locked',
    );
  }
  if (access.state === 'submitted') {
    throw new ScenarioRuleError('The post-survey has already been submitted.', 'already_submitted');
  }
  return access;
}

function parseAnswers(body: unknown, planSlugs: string[]): PostSurveyAnswers {
  const parsed = draftSchema(planSlugs).safeParse(body);
  if (!parsed.success) {
    throw new ScenarioRuleError('Some answers are not valid.', 'invalid_answers', parsed.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    })));
  }
  return tidyAnswers(parsed.data);
}

/** Saves the answers so far. Nothing is required yet; every value is checked. */
export async function savePostSurveyDraft(userId: string, body: unknown): Promise<CareerPostSurvey> {
  const access = await openAccess(userId);
  const answers = parseAnswers(body, access.departmentSlugs);
  const saved = await getRepository().saveCareerPostSurveyDraft(userId, {
    surveyVersion: POST_SURVEY_VERSION,
    departmentSlugs: access.departmentSlugs,
    ...answers,
  });
  if (!saved) throw new ScenarioRuleError('The post-survey has already been submitted.', 'already_submitted');
  return saved;
}

/** Submits, once, when every required answer is there. */
export async function submitPostSurvey(userId: string, body: unknown): Promise<CareerPostSurvey> {
  const access = await openAccess(userId);
  const answers = parseAnswers(body, access.departmentSlugs);
  const issues = finalIssues(answers, access.departmentSlugs);
  if (issues.length > 0) {
    throw new ScenarioRuleError('Some required answers are missing.', 'incomplete', issues);
  }
  const saved = await getRepository().submitCareerPostSurvey(userId, {
    surveyVersion: POST_SURVEY_VERSION,
    departmentSlugs: access.departmentSlugs,
    ...answers,
  });
  if (!saved) throw new ScenarioRuleError('The post-survey has already been submitted.', 'already_submitted');
  return saved;
}
