import type { Locale } from '@/i18n/config';

/**
 * The pre-survey, one question per screen.
 *
 * This is the only place questions live: add, remove or reorder entries here
 * and the survey screen, its progress counter and the saved answers follow.
 * Each answer is stored under its `key`, so keys must be unique and should
 * not change once students have answered them.
 *
 * Every piece of text is written once per language. English is required; a
 * language left out falls back to English.
 *
 * The question set is the X-PASS pre-survey (X-PASS_Pre-survey_50.csv): ten
 * 1–5 statements for each of the five departments, one per competency of that
 * job. `measures` records which department and competency a statement belongs
 * to, so a rubric can be attached later without changing the questions or the
 * stored answers.
 */
export type Localized = { en: string } & Partial<Record<Exclude<Locale, 'en'>, string>>;

export const localize = (text: Localized, locale: Locale): string => text[locale] ?? text.en;

/** What a scale question measures: one competency of one department's job. */
export type Measures = {
  /** Department slug, as in `departments.ts`. */
  department: string;
  competency: string;
  /** The job description the competency was taken from, where there is one. */
  source?: string;
};

export type PreSurveyQuestion =
  | {
      key: string;
      kind: 'scale';
      prompt: Localized;
      /** Words under the two ends of the 1–5 scale; the defaults are "Not at all" / "Very much". */
      low?: Localized;
      high?: Localized;
      measures?: Measures;
    }
  | {
      key: string;
      kind: 'text';
      prompt: Localized;
      placeholder?: Localized;
      /** Optional text questions can be left blank. */
      optional?: boolean;
    };

/**
 * Keys of the 75-statement competency inventory this set replaced
 * (`MKT_01`…`PM_15`), by department. Their answers stay in saved surveys and
 * are never read as answers to the current statements, whose keys differ; they
 * only keep LIKE for a student who answered that version and not this one.
 */
const RETIRED_KEY_PREFIXES: Record<string, string> = {
  marketing: 'MKT_',
  strategy: 'STR_',
  sales: 'SAL_',
  'human-resources': 'HR_',
  'product-management': 'PM_',
};

const meanAsLike = (scores: number[]) =>
  Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length / 5) * 100);

/**
 * LIKE for one department, 0–100, from a student's saved answers.
 *
 * Until the rubric arrives this is the plain mean of the department's answered
 * statements, on the same 1–5 → 20–100 scale as before. Answers to an earlier
 * version of the survey (the competency inventory, or before it a single
 * `interest_<slug>` rating) are read only when the student answered nothing
 * for the department in this one. Null when there is nothing to read.
 */
export function likeForDepartment(
  answers: Record<string, unknown> | undefined,
  department: string,
): number | null {
  if (!answers) return null;
  const scores = PRE_SURVEY_QUESTIONS.filter(
    (question) => question.kind === 'scale' && question.measures?.department === department,
  )
    .map((question) => answers[question.key])
    .filter((value): value is number => typeof value === 'number');
  if (scores.length > 0) return meanAsLike(scores);

  const prefix = RETIRED_KEY_PREFIXES[department];
  const retired = prefix
    ? Object.entries(answers)
        .filter(([key]) => new RegExp(`^${prefix}\\d{2}$`).test(key))
        .map(([, value]) => value)
        .filter((value): value is number => typeof value === 'number')
    : [];
  if (retired.length > 0) return meanAsLike(retired);

  const legacy = answers[`interest_${department}`];
  return typeof legacy === 'number' ? Math.round((legacy / 5) * 100) : null;
}

// Imported from X-PASS_Pre-survey_50.csv (No., Department, Skill / Competency,
// English question): the key is `PS50_` + No., in CSV order. The CSV has
// English only, so Japanese and Korean show the English text.
export const PRE_SURVEY_QUESTIONS: PreSurveyQuestion[] = [
  {
    key: 'PS50_01',
    kind: 'scale',
    prompt: { en: 'I am curious about why different people are attracted to different things.' },
    measures: { department: 'marketing', competency: 'Customer understanding' },
  },
  {
    key: 'PS50_02',
    kind: 'scale',
    prompt: { en: 'I enjoy finding fresh ways to make an ordinary idea more interesting to others.' },
    measures: { department: 'marketing', competency: 'Creative thinking' },
  },
  {
    key: 'PS50_03',
    kind: 'scale',
    prompt: { en: 'When sharing something, I think about what would make it interesting to the people receiving it.' },
    measures: { department: 'marketing', competency: 'Audience awareness' },
  },
  {
    key: 'PS50_04',
    kind: 'scale',
    prompt: { en: 'When something becomes popular, I find myself wondering what might have contributed to its popularity.' },
    measures: { department: 'marketing', competency: 'Analytical thinking' },
  },
  {
    key: 'PS50_05',
    kind: 'scale',
    prompt: { en: 'I enjoy explaining the value of something in a way that helps others understand its appeal.' },
    measures: { department: 'marketing', competency: 'Persuasive communication' },
  },
  {
    key: 'PS50_06',
    kind: 'scale',
    prompt: { en: 'I like finding interesting ways to present information rather than simply listing facts.' },
    measures: { department: 'marketing', competency: 'Storytelling and content creation' },
  },
  {
    key: 'PS50_07',
    kind: 'scale',
    prompt: { en: 'I find it interesting that the same message can create different impressions depending on how it is presented.' },
    measures: { department: 'marketing', competency: 'Understanding perceptions' },
  },
  {
    key: 'PS50_08',
    kind: 'scale',
    prompt: { en: 'After trying something new, I often reflect on what worked well and what could be improved.' },
    measures: { department: 'marketing', competency: 'Results evaluation' },
  },
  {
    key: 'PS50_09',
    kind: 'scale',
    prompt: { en: 'I enjoy trying different approaches to see which one works better.' },
    measures: { department: 'marketing', competency: 'Experimentation' },
  },
  {
    key: 'PS50_10',
    kind: 'scale',
    prompt: { en: 'I enjoy exchanging ideas with others and building on their suggestions.' },
    measures: { department: 'marketing', competency: 'Collaboration and brainstorming' },
  },
  {
    key: 'PS50_11',
    kind: 'scale',
    prompt: { en: 'When making a decision, I like to consider how it might affect other things in the future.' },
    measures: { department: 'strategy', competency: 'Strategic thinking' },
  },
  {
    key: 'PS50_12',
    kind: 'scale',
    prompt: { en: 'When a problem feels complicated, I try to break it down into smaller parts to understand it better.' },
    measures: { department: 'strategy', competency: 'Problem structuring' },
  },
  {
    key: 'PS50_13',
    kind: 'scale',
    prompt: { en: 'When I hear an explanation, I naturally wonder what evidence supports it.' },
    measures: { department: 'strategy', competency: 'Critical thinking' },
  },
  {
    key: 'PS50_14',
    kind: 'scale',
    prompt: { en: 'When the same problem occurs repeatedly, I try to identify what is causing it.' },
    measures: { department: 'strategy', competency: 'Root-cause analysis' },
  },
  {
    key: 'PS50_15',
    kind: 'scale',
    prompt: { en: 'When faced with several options, I like comparing their advantages and disadvantages before choosing one.' },
    measures: { department: 'strategy', competency: 'Evaluating alternatives' },
  },
  {
    key: 'PS50_16',
    kind: 'scale',
    prompt: { en: 'I feel more confident in a decision when I can support it with facts rather than assumptions.' },
    measures: { department: 'strategy', competency: 'Evidence-based judgment' },
  },
  {
    key: 'PS50_17',
    kind: 'scale',
    prompt: { en: 'When one part of a system changes, I tend to consider how the other parts might be affected.' },
    measures: { department: 'strategy', competency: 'Systems thinking' },
  },
  {
    key: 'PS50_18',
    kind: 'scale',
    prompt: { en: 'When time or resources are limited, I try to determine where they would be most useful.' },
    measures: { department: 'strategy', competency: 'Resource allocation' },
  },
  {
    key: 'PS50_19',
    kind: 'scale',
    prompt: { en: 'When several tasks compete for attention, I try to identify which ones are most important to the overall goal.' },
    measures: { department: 'strategy', competency: 'Prioritization and project coordination' },
  },
  {
    key: 'PS50_20',
    kind: 'scale',
    prompt: { en: 'Before committing to a plan, I sometimes consider what could go wrong and how I might respond.' },
    measures: { department: 'strategy', competency: 'Scenario thinking and risk awareness' },
  },
  {
    key: 'PS50_21',
    kind: 'scale',
    prompt: { en: 'I enjoy explaining my point of view in a way that helps others see why it might be worth considering.' },
    measures: { department: 'sales', competency: 'Persuasion and influence' },
  },
  {
    key: 'PS50_22',
    kind: 'scale',
    prompt: { en: 'I enjoy getting to know people and finding common ground with them.' },
    measures: { department: 'sales', competency: 'Relationship building' },
  },
  {
    key: 'PS50_23',
    kind: 'scale',
    prompt: { en: 'When someone explains what they want, I try to understand what matters most to them.' },
    measures: { department: 'sales', competency: 'Active listening' },
  },
  {
    key: 'PS50_24',
    kind: 'scale',
    prompt: { en: 'When someone describes a difficulty, I naturally think about what kind of help would be most useful to them.' },
    measures: { department: 'sales', competency: 'Needs identification' },
  },
  {
    key: 'PS50_25',
    kind: 'scale',
    prompt: { en: 'When someone disagrees with my suggestion, I try to understand their concerns before responding.' },
    measures: { department: 'sales', competency: 'Objection handling' },
  },
  {
    key: 'PS50_26',
    kind: 'scale',
    prompt: { en: 'When two people want different things, I enjoy looking for an arrangement that works for both sides.' },
    measures: { department: 'sales', competency: 'Negotiation and compromise' },
  },
  {
    key: 'PS50_27',
    kind: 'scale',
    prompt: { en: 'When an attempt does not work out, I am willing to try again using a different approach.' },
    measures: { department: 'sales', competency: 'Resilience and persistence' },
  },
  {
    key: 'PS50_28',
    kind: 'scale',
    prompt: { en: 'I am comfortable starting conversations with people I have not interacted with before.' },
    measures: { department: 'sales', competency: 'Initiative and outreach' },
  },
  {
    key: 'PS50_29',
    kind: 'scale',
    prompt: { en: 'During conversations, I sometimes notice opportunities to connect someone\'s needs with something that could help them.' },
    measures: { department: 'sales', competency: 'Opportunity recognition' },
  },
  {
    key: 'PS50_30',
    kind: 'scale',
    prompt: { en: 'I naturally adjust how I explain something depending on who I am talking to.' },
    measures: { department: 'sales', competency: 'Clear and adaptive communication' },
  },
  {
    key: 'PS50_31',
    kind: 'scale',
    prompt: { en: 'I often try to understand why people react differently to the same situation.' },
    measures: { department: 'human-resources', competency: 'Interpersonal understanding' },
  },
  {
    key: 'PS50_32',
    kind: 'scale',
    prompt: { en: 'When someone is upset, I try to understand what might be bothering them before responding.' },
    measures: { department: 'human-resources', competency: 'Empathy and perspective-taking' },
  },
  {
    key: 'PS50_33',
    kind: 'scale',
    prompt: { en: 'When people disagree, I look for ways to help them understand each other\'s perspectives.' },
    measures: { department: 'human-resources', competency: 'Conflict resolution' },
  },
  {
    key: 'PS50_34',
    kind: 'scale',
    prompt: { en: 'During conversations, I pay attention to what people mean, even when they do not express it directly.' },
    measures: { department: 'human-resources', competency: 'Active listening' },
  },
  {
    key: 'PS50_35',
    kind: 'scale',
    prompt: { en: 'When deciding between different viewpoints, I try to consider everyone\'s circumstances rather than favoring one person.' },
    measures: { department: 'human-resources', competency: 'Fairness and impartiality' },
  },
  {
    key: 'PS50_36',
    kind: 'scale',
    prompt: { en: 'When someone shares something personal with me, I think carefully about what should remain private.' },
    measures: { department: 'human-resources', competency: 'Ethical judgment and discretion' },
  },
  {
    key: 'PS50_37',
    kind: 'scale',
    prompt: { en: 'When someone struggles with a task, I enjoy helping them find a way to improve.' },
    measures: { department: 'human-resources', competency: 'Coaching and development' },
  },
  {
    key: 'PS50_38',
    kind: 'scale',
    prompt: { en: 'When organizing an activity involving several people, I try to make sure everyone knows their responsibilities.' },
    measures: { department: 'human-resources', competency: 'Coordination and planning' },
  },
  {
    key: 'PS50_39',
    kind: 'scale',
    prompt: { en: 'I notice when the atmosphere in a group changes, even if nobody openly mentions it.' },
    measures: { department: 'human-resources', competency: 'Group dynamics and morale' },
  },
  {
    key: 'PS50_40',
    kind: 'scale',
    prompt: { en: 'I recognize that people may need different kinds of support to achieve the same goal.' },
    measures: { department: 'human-resources', competency: 'Adaptability to individual needs' },
  },
  {
    key: 'PS50_41',
    kind: 'scale',
    prompt: { en: 'I tend to notice small inconveniences that people around me have learned to live with.' },
    measures: { department: 'product-management', competency: 'Opportunity recognition' },
  },
  {
    key: 'PS50_42',
    kind: 'scale',
    prompt: { en: 'When someone has difficulty with something, I often wonder what would make the experience easier for them.' },
    measures: { department: 'product-management', competency: 'Customer understanding' },
  },
  {
    key: 'PS50_43',
    kind: 'scale',
    prompt: { en: 'When faced with several possible explanations, I prefer to look for clues before settling on one.' },
    measures: { department: 'product-management', competency: 'Analytical thinking' },
  },
  {
    key: 'PS50_44',
    kind: 'scale',
    prompt: { en: 'Before committing to a decision, I often consider how it might affect things later.' },
    measures: { department: 'product-management', competency: 'Strategic thinking' },
  },
  {
    key: 'PS50_45',
    kind: 'scale',
    prompt: { en: 'When I have several things to do, I find it useful to identify which one would make the biggest difference.' },
    measures: { department: 'product-management', competency: 'Prioritization' },
  },
  {
    key: 'PS50_46',
    kind: 'scale',
    prompt: { en: 'When considering an opportunity, I tend to think about whether the expected benefits justify the effort involved.' },
    measures: { department: 'product-management', competency: 'Business judgment' },
  },
  {
    key: 'PS50_47',
    kind: 'scale',
    prompt: { en: 'I feel more comfortable with a large task when I can break it into smaller steps.' },
    measures: { department: 'product-management', competency: 'Planning and organization' },
  },
  {
    key: 'PS50_48',
    kind: 'scale',
    prompt: { en: 'When a plan stops working as expected, I am willing to reconsider my original approach.' },
    measures: { department: 'product-management', competency: 'Adaptability' },
  },
  {
    key: 'PS50_49',
    kind: 'scale',
    prompt: { en: 'I enjoy hearing how people with different experiences would approach the same situation.' },
    measures: { department: 'product-management', competency: 'Cross-functional collaboration' },
  },
  {
    key: 'PS50_50',
    kind: 'scale',
    prompt: { en: 'When I have an idea, I often think about what would need to happen to turn it into something usable.' },
    measures: { department: 'product-management', competency: 'Execution and lifecycle thinking' },
  },
];
