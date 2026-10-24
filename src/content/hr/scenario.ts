import type {
  ScenarioStepMedia,
  ScenarioVersionDefinition,
  TaskField,
  TaskFieldOption,
} from '@/types/scenario';
import { BITE_HR_OFFER_POLICY, BITE_PROTEIN_DRINK } from '@/content/company';

/**
 * HR scenario: Talent Acquisition for BITE Protein Drink × CN Expansion.
 *
 * Pure data, like `content/sales/scenario.ts`. It is the second scenario on the
 * same engine and exercises what Sales does not: one step with three separate
 * AI interviews, a step unlocked only when all three are done, repeated
 * scorecard rows, and an executive pressure event that mixes a legitimate new
 * constraint with an illegitimate preference.
 *
 * TODO: authored without an implementation pack — see `resources.ts`.
 */

const o = BITE_HR_OFFER_POLICY;
const yen = (n: number) => `¥${n.toLocaleString()}`;

const CANDIDATE_KEYS = ['candidate-lin', 'candidate-sato', 'candidate-zhang'] as const;

const CANDIDATE_OPTIONS: TaskFieldOption[] = [
  { label: 'Lin Hao', value: 'lin' },
  { label: 'Daiki Sato', value: 'sato' },
  { label: 'Zhang Wei', value: 'zhang' },
];

const DECISION_AFFECTED_OPTIONS: TaskFieldOption[] = [
  { label: 'Must-have criteria', value: 'must_have' },
  { label: 'Nice-to-have criteria', value: 'nice_to_have' },
  { label: 'Language requirement', value: 'language' },
  { label: 'Seniority / salary band', value: 'seniority' },
  { label: 'Start date', value: 'start_date' },
  { label: 'Interview questions', value: 'interview_questions' },
  { label: 'Other', value: 'other' },
];

/**
 * A scale that keeps "we did not test this" separate from "they are weak at
 * it", the same distinction the career report makes with NE.
 */
const RATING_OPTIONS: TaskFieldOption[] = [
  { label: '4 — Strong evidence for', value: '4' },
  { label: '3 — Some evidence for', value: '3' },
  { label: '2 — Mixed evidence', value: '2' },
  { label: '1 — Evidence against', value: '1' },
  { label: 'NE — Not enough evidence', value: 'NE' },
];

const OFFER_GUARDRAILS = [
  'offer-band-floor',
  'offer-band-ceiling',
  'sign-on-cap',
  'above-midpoint-justification',
];

const ROLE_REFERENCE: ScenarioStepMedia = {
  src: '/img/cover/hr.webp',
  alt: 'The BITE People team at work',
  title: o.roleTitle,
  caption: 'Shanghai · reports to the Head of International Business, Tokyo',
  facts: [
    { label: 'Product', value: BITE_PROTEIN_DRINK.name },
    { label: 'Market', value: 'East China, starting from Shanghai' },
    { label: 'Salary band', value: `${yen(o.bandMinYen)} – ${yen(o.bandMaxYen)}` },
  ],
};

/** What every persona in this scenario is told. All of it is in the Data Room. */
const AI_CONTEXT = [
  `BITE is a Japanese casual F&B brand. Its product ${BITE_PROTEIN_DRINK.name} is a ${BITE_PROTEIN_DRINK.attributes.size}, ${BITE_PROTEIN_DRINK.attributes.protein}-protein refrigerated drink.`,
  'BITE plans to launch it in East China, starting from Shanghai, through a regional chilled distributor and/or a cross-border e-commerce storefront. Neither is in place yet.',
  `The role being hired is ${o.roleTitle}, based in Shanghai, reporting to Takuya Mori, Head of International Business in Tokyo.`,
  'The person you are talking to is a junior talent acquisition partner on BITE\'s People team.',
].join('\n');

const OFFER_FIELDS: TaskField[] = [
  {
    key: 'proposed_base_salary_yen',
    label: 'Proposed annual base salary (¥)',
    type: 'number',
    required: true,
    validation: { min: 0 },
    helpText: `The band is ${yen(o.bandMinYen)} – ${yen(o.bandMaxYen)}. Above ${yen(o.bandMidYen)} needs a written justification.`,
  },
  {
    key: 'sign_on_bonus_yen',
    label: 'Sign-on bonus (¥)',
    type: 'number',
    required: false,
    validation: { min: 0 },
    helpText: `Optional, up to ${yen(o.signOnCapYen)}. It is not free — say what it is for.`,
  },
  {
    key: 'offer_justification',
    label: 'Offer justification (job-related)',
    type: 'textarea',
    required: false,
    helpText: 'Required by policy above the midpoint. What does this candidate bring that the job needs?',
  },
  {
    key: 'target_start',
    label: 'Target start date',
    type: 'text',
    required: true,
    placeholder: 'e.g. within 6 weeks of offer',
  },
];

export const HR_SCENARIO: ScenarioVersionDefinition = {
  scenarioKey: 'hr-cn-expansion',
  version: 1,
  status: 'published',
  title: 'Talent Acquisition for BITE Protein Drink × CN Expansion',
  studentRole: 'Junior Talent Acquisition Partner',
  mission:
    'Recommend who BITE should hire to take BITE Protein Drink into China — on job-related evidence, within the offer policy.',
  finalOutputTitle: 'Final Hiring Recommendation',
  deadlineHours: 24,
  aiContext: AI_CONTEXT,
  steps: [
    // ---------------------------------------------------------------- STEP 0A
    {
      key: 'hr-training',
      title: 'HR Training',
      stepType: 'training',
      sortOrder: 0,
      estimatedMinutes: 15,
      officeZoneKey: 'hr-zone',
      summary: 'Learn how recruiters think before the work begins.',
      instructions:
        'Read the HR Starter, then mark the training complete. The optional self-check is for you only — it is never used as evidence of skill.',
      unlockRule: { type: 'always' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['hr-training-1pager'],
      tasks: [
        {
          key: 'hr-training-review',
          title: 'Read the HR Starter',
          kind: 'acknowledge',
          required: true,
          instructions:
            'Open the HR Starter in the panel below. When you have read it, mark the training complete.',
          completion: { type: 'acknowledged' },
        },
        {
          key: 'hr-training-self-check',
          title: 'Optional self-check',
          kind: 'form',
          required: false,
          instructions:
            'Not scored, and not used as SKILL FIT evidence. It exists only to let you check your own understanding.',
          completion: { type: 'required_fields' },
          fields: [
            {
              key: 'q_criterion',
              label: 'A good selection criterion is…',
              type: 'select',
              options: [
                { label: 'Something the hiring manager likes in people', value: 'a' },
                { label: 'Something you can trace back to the work itself', value: 'b' },
                { label: 'Whatever the strongest candidate has', value: 'c' },
              ],
            },
            {
              key: 'q_resume',
              label: 'A résumé says "managed distributor relationships". The right next move is…',
              type: 'select',
              options: [
                { label: 'Rate distributor experience as strong', value: 'a' },
                { label: 'Ask what they personally did in those relationships', value: 'b' },
                { label: 'Ignore it — résumés exaggerate', value: 'c' },
              ],
            },
            {
              key: 'q_ne',
              label: 'An interview never tested a criterion. You should rate it…',
              type: 'select',
              options: [
                { label: 'As a middle score, to be safe', value: 'a' },
                { label: 'NE — not enough evidence', value: 'b' },
                { label: 'As a low score', value: 'c' },
              ],
            },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- STEP 0B
    {
      key: 'onboarding',
      media: ROLE_REFERENCE,
      title: 'Onboarding — Understand the China expansion',
      stepType: 'briefing',
      sortOrder: 1,
      estimatedMinutes: 20,
      officeZoneKey: 'hr-zone',
      summary: 'Find out what BITE cannot do yet that a China launch needs.',
      instructions:
        'Read the expansion brief and the capability inventory. Then diagnose at least three capability gaps — what the launch needs, what BITE has today, and why the gap matters. A gap is a business problem; a hire is only one way to close it.',
      unlockRule: { type: 'step_completed', stepKey: 'hr-training' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: [
        'bite-people-profile',
        'cn-expansion-brief',
        'capability-inventory',
        'hr-product-sheet',
      ],
      tasks: [
        {
          key: 'capability-gaps',
          title: 'Capability gap diagnosis',
          kind: 'form',
          required: true,
          instructions:
            'Separate what the documents say from what you are inferring. The intake meeting exists to test the inferences.',
          completion: {
            type: 'all',
            rules: [
              { type: 'min_rows', fieldKey: 'gaps', min: 3 },
              { type: 'submitted' },
            ],
          },
          fields: [
            {
              key: 'gaps',
              label: 'Capability gaps',
              type: 'repeatable_group',
              required: true,
              minRows: 3,
              initialRows: 3,
              fields: [
                {
                  key: 'capability',
                  label: 'Capability the launch needs',
                  type: 'text',
                  required: true,
                },
                {
                  key: 'current_state',
                  label: 'What BITE has today',
                  type: 'textarea',
                  required: true,
                  epistemicKind: 'fact',
                  helpText: 'Name the resource you read it in.',
                },
                {
                  key: 'why_it_matters',
                  label: 'Why the gap matters',
                  type: 'textarea',
                  required: true,
                  epistemicKind: 'hypothesis',
                },
              ],
            },
            {
              key: 'gap_to_fill_by_hiring',
              label: 'Which gap should this hire close first? (optional)',
              type: 'textarea',
              required: false,
              epistemicKind: 'hypothesis',
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 1
    {
      key: 'intake-prep',
      title: 'Intake Meeting Preparation',
      stepType: 'decision',
      sortOrder: 2,
      estimatedMinutes: 15,
      officeZoneKey: 'my-desk',
      summary: 'Write questions that can actually change the selection criteria.',
      instructions:
        'Prepare five questions for Takuya Mori, the hiring manager. For each one, state the purpose and which hiring decision the answer would change. If an answer could not change anything, it is small talk.',
      unlockRule: { type: 'step_completed', stepKey: 'onboarding' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['jd-draft', 'cn-expansion-brief'],
      tasks: [
        {
          key: 'intake-questions',
          title: 'Five intake questions',
          kind: 'form',
          required: true,
          referenceTaskKeys: ['capability-gaps'],
          completion: {
            type: 'all',
            rules: [
              { type: 'min_rows', fieldKey: 'questions', min: 5 },
              { type: 'submitted' },
            ],
          },
          fields: [
            {
              key: 'questions',
              label: 'Questions',
              type: 'repeatable_group',
              required: true,
              minRows: 5,
              initialRows: 5,
              maxRows: 12,
              fields: [
                { key: 'question', label: 'Question', type: 'textarea', required: true },
                { key: 'purpose', label: 'Purpose', type: 'text', required: true },
                {
                  key: 'decision_affected',
                  label: 'Decision affected',
                  type: 'select',
                  required: true,
                  options: DECISION_AFFECTED_OPTIONS,
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 2
    {
      key: 'hiring-intake',
      media: ROLE_REFERENCE,
      title: 'Hiring Manager Intake',
      stepType: 'ai_interaction',
      sortOrder: 3,
      estimatedMinutes: 25,
      officeZoneKey: 'meeting-room-b',
      summary: 'Find out from Takuya Mori what the job actually needs.',
      instructions:
        'Takuya knows what he needs but has not written it down, and not everything he wants is job-related. Specifics come out when you ask about the thing they describe. Your prepared questions are beside the conversation — but follow what he actually says.',
      unlockRule: { type: 'step_completed', stepKey: 'intake-prep' },
      completionRule: { type: 'all_required_tasks' },
      tasks: [
        {
          key: 'intake-conversation',
          title: 'Intake with Takuya Mori',
          kind: 'ai_conversation',
          required: true,
          personaKey: 'hiring-manager',
          conversationMode: 'meeting',
          referenceTaskKeys: ['intake-questions', 'capability-gaps'],
          completion: {
            type: 'conversation_ended',
            personaKey: 'hiring-manager',
            minStudentMessages: 5,
          },
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 3
    {
      key: 'job-criteria',
      title: 'Job-related Selection Criteria',
      stepType: 'analysis',
      sortOrder: 4,
      estimatedMinutes: 25,
      officeZoneKey: 'my-desk',
      summary: 'Turn the intake into criteria you can test in an interview.',
      instructions:
        'Every criterion must trace back to the work. Decide what is a must-have and what is a nice-to-have, and how you will test each one. Then fix the draft job description: say what you would remove, and why.',
      unlockRule: {
        type: 'conversation_completed',
        personaKey: 'hiring-manager',
        stepKey: 'hiring-intake',
      },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['jd-draft', 'capability-inventory', 'bite-offer-policy'],
      tasks: [
        {
          key: 'selection-criteria',
          title: 'Selection criteria',
          kind: 'form',
          required: true,
          referenceTaskKeys: ['capability-gaps'],
          completion: {
            type: 'all',
            rules: [
              { type: 'min_rows', fieldKey: 'criteria', min: 4 },
              { type: 'submitted' },
            ],
          },
          fields: [
            {
              key: 'criteria',
              label: 'Criteria',
              type: 'repeatable_group',
              required: true,
              minRows: 4,
              initialRows: 4,
              maxRows: 8,
              fields: [
                { key: 'criterion', label: 'Criterion', type: 'text', required: true },
                {
                  key: 'priority',
                  label: 'Priority',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Must-have', value: 'must_have' },
                    { label: 'Nice-to-have', value: 'nice_to_have' },
                  ],
                },
                {
                  key: 'why_job_related',
                  label: 'Why it is job-related',
                  type: 'textarea',
                  required: true,
                  epistemicKind: 'fact',
                  helpText: 'What in the intake or the documents makes this part of the job?',
                },
                {
                  key: 'how_to_test',
                  label: 'How you will test it in the interview',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
            {
              key: 'jd_requirements_removed',
              label: 'Draft JD requirements you would remove or rewrite, and why',
              type: 'textarea',
              required: true,
            },
            {
              key: 'evidence_refs',
              label: 'Link your evidence',
              type: 'resource_evidence',
              required: false,
              helpText: 'Select the Data Room resources and intake statements these criteria rest on.',
              evidenceSources: [
                { kind: 'resources' },
                {
                  kind: 'conversation',
                  personaKey: 'hiring-manager',
                  stepKey: 'hiring-intake',
                  label: 'What Takuya said',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 4
    {
      key: 'candidate-interviews',
      title: 'Candidate Interviews',
      stepType: 'ai_interaction',
      sortOrder: 5,
      estimatedMinutes: 45,
      officeZoneKey: 'meeting-room-a',
      summary: 'Interview Lin Hao, Daiki Sato and Zhang Wei.',
      instructions:
        'Three separate interviews. Use the same core questions for each, from your criteria, so the answers are comparable. A résumé line is a claim — ask what each candidate personally did. Each interview stands alone: nothing one candidate says is known to the others.',
      unlockRule: { type: 'step_completed', stepKey: 'job-criteria' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['candidate-lin-hao', 'candidate-daiki-sato', 'candidate-zhang-wei'],
      tasks: [
        {
          key: 'interview-lin',
          title: 'Interview — Lin Hao',
          kind: 'ai_conversation',
          required: true,
          personaKey: 'candidate-lin',
          conversationMode: 'meeting',
          referenceTaskKeys: ['selection-criteria'],
          completion: {
            type: 'conversation_ended',
            personaKey: 'candidate-lin',
            minStudentMessages: 4,
          },
        },
        {
          key: 'interview-sato',
          title: 'Interview — Daiki Sato',
          kind: 'ai_conversation',
          required: true,
          personaKey: 'candidate-sato',
          conversationMode: 'meeting',
          referenceTaskKeys: ['selection-criteria'],
          completion: {
            type: 'conversation_ended',
            personaKey: 'candidate-sato',
            minStudentMessages: 4,
          },
        },
        {
          key: 'interview-zhang',
          title: 'Interview — Zhang Wei',
          kind: 'ai_conversation',
          required: true,
          personaKey: 'candidate-zhang',
          conversationMode: 'meeting',
          referenceTaskKeys: ['selection-criteria'],
          completion: {
            type: 'conversation_ended',
            personaKey: 'candidate-zhang',
            minStudentMessages: 4,
          },
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 5
    {
      key: 'scorecards',
      title: 'Interview Scorecards',
      stepType: 'analysis',
      sortOrder: 6,
      estimatedMinutes: 30,
      officeZoneKey: 'my-desk',
      summary: 'Rate every candidate against the same criteria, with evidence.',
      instructions:
        'One row per candidate per criterion. Every rating needs the evidence you heard — and where an interview did not test something, NE is the honest rating. Opens only once all three interviews are finished, so no candidate is scored before the others have been heard.',
      // All three, not any: scoring the first interview before hearing the
      // others is exactly the anchoring this step exists to avoid.
      unlockRule: {
        type: 'all',
        rules: CANDIDATE_KEYS.map((personaKey) => ({
          type: 'conversation_completed' as const,
          personaKey,
          stepKey: 'candidate-interviews',
        })),
      },
      completionRule: { type: 'all_required_tasks' },
      tasks: [
        {
          key: 'candidate-scorecards',
          title: 'Scorecards',
          kind: 'form',
          required: true,
          referenceTaskKeys: ['selection-criteria'],
          completion: {
            type: 'all',
            rules: [
              { type: 'min_rows', fieldKey: 'ratings', min: 6 },
              { type: 'submitted' },
            ],
          },
          fields: [
            {
              key: 'ratings',
              label: 'Ratings',
              type: 'repeatable_group',
              required: true,
              minRows: 6,
              initialRows: 6,
              maxRows: 24,
              helpText: 'At least two criteria for each of the three candidates.',
              fields: [
                {
                  key: 'candidate',
                  label: 'Candidate',
                  type: 'select',
                  required: true,
                  options: CANDIDATE_OPTIONS,
                },
                { key: 'criterion', label: 'Criterion', type: 'text', required: true },
                {
                  key: 'rating',
                  label: 'Rating',
                  type: 'select',
                  required: true,
                  options: RATING_OPTIONS,
                },
                {
                  key: 'evidence',
                  label: 'Evidence',
                  type: 'textarea',
                  required: true,
                  epistemicKind: 'fact',
                  helpText: 'What did the candidate actually say? For NE, say what you did not get to test.',
                },
              ],
            },
            {
              key: 'impressions_set_aside',
              label: 'Impressions you noticed and set aside (optional)',
              type: 'textarea',
              required: false,
              helpText: 'Liking or disliking someone is information about you. Write it down here so it stays out of the ratings.',
            },
            {
              key: 'evidence_refs',
              label: 'Link your evidence',
              type: 'resource_evidence',
              required: false,
              evidenceSources: [
                {
                  kind: 'conversation',
                  personaKey: 'candidate-lin',
                  stepKey: 'candidate-interviews',
                  label: 'What Lin Hao said',
                },
                {
                  kind: 'conversation',
                  personaKey: 'candidate-sato',
                  stepKey: 'candidate-interviews',
                  label: 'What Daiki Sato said',
                },
                {
                  kind: 'conversation',
                  personaKey: 'candidate-zhang',
                  stepKey: 'candidate-interviews',
                  label: 'What Zhang Wei said',
                },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 6
    {
      key: 'recommendation-v1',
      media: ROLE_REFERENCE,
      title: 'Hiring Recommendation',
      stepType: 'decision',
      sortOrder: 7,
      estimatedMinutes: 30,
      officeZoneKey: 'my-desk',
      summary: 'Recommend a candidate and an offer.',
      instructions:
        'The recommendation follows from the scorecards, not the other way round. Offer-policy warnings are warnings — the recommendation is still yours to make.',
      unlockRule: { type: 'step_completed', stepKey: 'scorecards' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['bite-offer-policy', 'capability-inventory'],
      tasks: [
        {
          key: 'recommendation-v1',
          title: 'Recommendation v1',
          kind: 'form',
          required: true,
          referenceTaskKeys: ['candidate-scorecards', 'selection-criteria'],
          guardrailKeys: OFFER_GUARDRAILS,
          completion: {
            type: 'all',
            rules: [{ type: 'required_fields' }, { type: 'submitted' }],
          },
          fields: [
            {
              key: 'recommended_candidate',
              label: 'Recommended candidate',
              type: 'select',
              required: true,
              options: CANDIDATE_OPTIONS,
            },
            {
              key: 'runner_up',
              label: 'Runner-up',
              type: 'select',
              required: true,
              options: [...CANDIDATE_OPTIONS, { label: 'No one — re-open the search', value: 'none' }],
            },
            {
              key: 'rationale',
              label: 'Rationale, tied to your criteria',
              type: 'textarea',
              required: true,
              epistemicKind: 'fact',
            },
            {
              key: 'gaps_in_recommended',
              label: 'Where the recommended candidate falls short',
              type: 'textarea',
              required: true,
              helpText: 'Nobody is a perfect match. What does BITE need to support?',
            },
            ...OFFER_FIELDS,
            {
              key: 'key_risk',
              label: 'Key risk',
              type: 'textarea',
              required: true,
              epistemicKind: 'hypothesis',
            },
            {
              key: 'onboarding_plan',
              label: 'First 90 days / risk mitigation',
              type: 'textarea',
              required: true,
            },
          ],
        },
        {
          key: 'recommendation-coaching',
          title: 'Talk it through with Aya (optional)',
          kind: 'ai_conversation',
          required: false,
          personaKey: 'bite-ta-manager',
          instructions: 'Your manager can explain policy. She will not pick for you.',
          completion: { type: 'conversation_ended', personaKey: 'bite-ta-manager' },
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 7
    {
      key: 'executive-pressure',
      title: 'Unexpected Event',
      stepType: 'unexpected_event',
      sortOrder: 8,
      estimatedMinutes: 20,
      officeZoneKey: 'notification-area',
      summary: 'The COO has written to you. Decide what changes and what holds.',
      instructions:
        'This message contains two different things. One is a real change to what the job needs. The other is not. Decide deliberately what to change and what to keep — and be able to say why for both.',
      unlockRule: { type: 'task_submitted', taskKey: 'recommendation-v1' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['bite-offer-policy'],
      eventPayload: {
        headline: 'COO: start date and a candidate preference',
        from: 'Hiroshi Kudo — Chief Operating Officer, BITE',
        body: 'Two things before this goes any further.\n\nFirst, the Shanghai trade fair date is confirmed. I need our China lead in seat within two months of the offer — that is not negotiable.\n\nSecond, I had dinner with Daiki Sato last week. Great guy, same university as me, perfect Japanese, exactly our kind of person. Frankly I do not see why we are dragging this out with scorecards. Let us just make him the offer.',
        facts: [
          { label: 'New requirement', value: 'Start within two months of the offer' },
          { label: 'Executive preference', value: 'Daiki Sato — personal acquaintance' },
          { label: 'Request', value: 'Skip the evaluation and offer Sato' },
        ],
      },
      tasks: [
        {
          key: 'pressure-acknowledge',
          title: 'Read the message',
          kind: 'acknowledge',
          required: true,
          completion: { type: 'acknowledged' },
        },
        {
          key: 'recommendation-v2-revision',
          title: 'Revision decision',
          kind: 'form',
          required: true,
          referenceTaskKeys: ['recommendation-v1', 'candidate-scorecards'],
          instructions:
            'Recommendation v1 is preserved and shown beside this form. Nothing here overwrites it.',
          completion: {
            type: 'all',
            rules: [{ type: 'required_fields' }, { type: 'submitted' }],
          },
          fields: [
            {
              key: 'legitimate_change',
              label: 'What in the message is a real, job-related change',
              type: 'textarea',
              required: true,
            },
            {
              key: 'not_job_related',
              label: 'What in the message is not job-related',
              type: 'textarea',
              required: true,
            },
            {
              key: 'conditions_to_change',
              label: 'What you change in your recommendation',
              type: 'textarea',
              required: true,
            },
            {
              key: 'conditions_to_keep',
              label: 'What you keep',
              type: 'textarea',
              required: true,
            },
            { key: 'why_change', label: 'Why change', type: 'textarea', required: true },
            { key: 'why_keep', label: 'Why keep', type: 'textarea', required: true },
            {
              key: 'start_date_plan',
              label: 'How the two-month start is met',
              type: 'textarea',
              required: true,
              helpText: 'If your candidate cannot start in time, what are the options?',
            },
            {
              key: 'reply_to_coo',
              label: 'Your reply to the COO',
              type: 'textarea',
              required: true,
              helpText: 'Respectful, short, and grounded in the evidence. Agreeing with him is allowed — if the evidence agrees.',
            },
            {
              key: 'recommendation_v2_summary',
              label: 'Recommendation v2 summary',
              type: 'textarea',
              required: true,
            },
          ],
        },
        {
          key: 'pressure-coaching',
          title: 'Talk it through with Aya (optional)',
          kind: 'ai_conversation',
          required: false,
          personaKey: 'bite-ta-manager',
          completion: { type: 'conversation_ended', personaKey: 'bite-ta-manager' },
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 8
    {
      key: 'executive-review',
      media: ROLE_REFERENCE,
      title: 'Executive Sign-off',
      stepType: 'ai_interaction',
      sortOrder: 9,
      estimatedMinutes: 25,
      officeZoneKey: 'executive-room',
      summary: 'Defend your recommendation to Hiroshi Kudo.',
      instructions:
        'He will push. Evidence moves him; persistence does not. Record the decision you actually reached — BITE will check the offer against policy.',
      unlockRule: { type: 'step_completed', stepKey: 'executive-pressure' },
      completionRule: { type: 'all_required_tasks' },
      resourceKeys: ['bite-offer-policy'],
      tasks: [
        {
          key: 'coo-conversation',
          title: 'Sign-off with Hiroshi Kudo',
          kind: 'ai_conversation',
          required: true,
          personaKey: 'bite-coo',
          conversationMode: 'negotiation',
          steeringTaskKeys: ['final-decision-record', 'recommendation-v1'],
          referenceTaskKeys: ['recommendation-v2-revision', 'candidate-scorecards'],
          completion: {
            type: 'conversation_ended',
            personaKey: 'bite-coo',
            minStudentMessages: 4,
          },
        },
        {
          key: 'final-decision-record',
          title: 'Decision record',
          kind: 'form',
          required: true,
          guardrailKeys: OFFER_GUARDRAILS,
          instructions:
            'Record what you and the COO actually landed on. This is structured data, not prose — it is what the People team files.',
          completion: {
            type: 'all',
            rules: [{ type: 'required_fields' }, { type: 'submitted' }],
          },
          fields: [
            {
              key: 'final_candidate',
              label: 'Candidate to offer',
              type: 'select',
              required: true,
              options: [...CANDIDATE_OPTIONS, { label: 'No offer — re-open the search', value: 'none' }],
              prefillTemplate: '{{recommendation-v1.recommended_candidate}}',
            },
            {
              key: 'proposed_base_salary_yen',
              label: 'Annual base salary (¥)',
              type: 'number',
              required: true,
              validation: { min: 0 },
              prefillTemplate: '{{recommendation-v1.proposed_base_salary_yen}}',
            },
            {
              key: 'sign_on_bonus_yen',
              label: 'Sign-on bonus (¥)',
              type: 'number',
              required: false,
              validation: { min: 0 },
              prefillTemplate: '{{recommendation-v1.sign_on_bonus_yen}}',
            },
            {
              key: 'offer_justification',
              label: 'Offer justification (job-related)',
              type: 'textarea',
              required: false,
              prefillTemplate: '{{recommendation-v1.offer_justification}}',
            },
            {
              key: 'target_start',
              label: 'Target start date',
              type: 'text',
              required: true,
              prefillTemplate: '{{recommendation-v1.target_start}}',
            },
            {
              key: 'conditions',
              label: 'Conditions attached to the decision',
              type: 'textarea',
              required: true,
              helpText: 'Notice buyout, onboarding support, a review point — whatever was agreed.',
            },
            {
              key: 'decision_status',
              label: 'Where the sign-off landed',
              type: 'select',
              required: true,
              options: [
                { label: 'Signed off as recommended', value: 'signed_off' },
                { label: 'Signed off with changes', value: 'signed_off_with_changes' },
                { label: 'Not signed off — recommendation to be revised', value: 'not_signed_off' },
              ],
            },
          ],
        },
      ],
    },

    // ----------------------------------------------------------------- STEP 9
    {
      key: 'final-submission',
      title: 'Final Submission',
      stepType: 'final_submission',
      sortOrder: 10,
      estimatedMinutes: 20,
      officeZoneKey: 'executive-room',
      summary: 'Hand over the Final Hiring Recommendation.',
      instructions:
        'Sections are pre-filled from your own earlier work. Edit the wording freely — submitting stores an immutable snapshot.',
      unlockRule: { type: 'step_completed', stepKey: 'executive-review' },
      completionRule: { type: 'all_required_tasks' },
      tasks: [
        {
          key: 'final-hiring-recommendation',
          title: 'Final Hiring Recommendation',
          kind: 'final_submission',
          required: true,
          referenceTaskKeys: [
            'capability-gaps',
            'selection-criteria',
            'candidate-scorecards',
            'recommendation-v1',
            'recommendation-v2-revision',
            'final-decision-record',
          ],
          completion: { type: 'submitted' },
          fields: [
            {
              key: 'capability_gap',
              label: '1. The Capability Gap',
              type: 'textarea',
              required: true,
              prefillTemplate:
                '{{capability-gaps.gaps[].capability}}\n\nClose first: {{capability-gaps.gap_to_fill_by_hiring}}',
            },
            {
              key: 'selection_criteria',
              label: '2. Job-related Selection Criteria',
              type: 'textarea',
              required: true,
              prefillTemplate: '{{selection-criteria.criteria[].criterion}}',
            },
            {
              key: 'candidate_evaluation',
              label: '3. Candidate Evaluation',
              type: 'textarea',
              required: true,
              prefillTemplate: '{{candidate-scorecards.ratings[].evidence}}',
            },
            {
              key: 'recommendation',
              label: '4. Recommendation and Rationale',
              type: 'textarea',
              required: true,
              prefillTemplate:
                'Candidate: {{final-decision-record.final_candidate}}\n\n{{recommendation-v1.rationale}}',
            },
            {
              key: 'fallback',
              label: '5. Runner-up / Fallback',
              type: 'textarea',
              required: true,
              prefillTemplate: 'Runner-up: {{recommendation-v1.runner_up}}',
            },
            {
              key: 'offer',
              label: '6. Offer',
              type: 'textarea',
              required: true,
              prefillTemplate:
                'Base: ¥{{final-decision-record.proposed_base_salary_yen}}\nSign-on: ¥{{final-decision-record.sign_on_bonus_yen}}\nStart: {{final-decision-record.target_start}}\nConditions: {{final-decision-record.conditions}}',
            },
            {
              key: 'risks_and_onboarding',
              label: '7. Risks and First 90 Days',
              type: 'textarea',
              required: true,
              prefillTemplate:
                'Where they fall short: {{recommendation-v1.gaps_in_recommended}}\nKey risk: {{recommendation-v1.key_risk}}\nPlan: {{recommendation-v1.onboarding_plan}}\nStart date: {{recommendation-v2-revision.start_date_plan}}',
            },
            {
              key: 'pressure_handling',
              label: '8. How the Executive Request Was Handled',
              type: 'textarea',
              required: true,
              prefillTemplate:
                'Changed: {{recommendation-v2-revision.conditions_to_change}}\nKept: {{recommendation-v2-revision.conditions_to_keep}}\nReply: {{recommendation-v2-revision.reply_to_coo}}',
            },
            {
              key: 'next_action',
              label: '9. Next Action',
              type: 'textarea',
              required: true,
            },
          ],
        },
      ],
    },
  ],
};
