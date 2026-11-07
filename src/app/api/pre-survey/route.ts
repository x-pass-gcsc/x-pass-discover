import { z } from 'zod';
import { PS50_ROLE_RUBRICS } from '@/content/pre-survey-rubric-v1';
import { getRepository } from '@/db/repository';
import { parseBody, withUser } from '@/lib/api';
import { logEvent } from '@/services/events';

/** The 50 answer keys the PS50 rubric scores, `PS50_01` … `PS50_50`. */
const PS50_KEYS = PS50_ROLE_RUBRICS.flatMap((role) => role.questions).map(
  (n) => `PS50_${String(n).padStart(2, '0')}`,
);

const likert = z
  .number({
    required_error: 'all 50 answers are required',
    invalid_type_error: 'every answer must be a number from 1 to 5',
  })
  .int('every answer must be a whole number from 1 to 5')
  .min(1, 'every answer must be from 1 to 5')
  .max(5, 'every answer must be from 1 to 5');

/**
 * Exactly the 50 PS50 answers, each an integer 1–5: a missing, extra or
 * out-of-range answer is refused with 400 and nothing is saved.
 */
const schema = z.object({
  answers: z.object(Object.fromEntries(PS50_KEYS.map((key) => [key, likert]))).strict(),
});

export async function POST(request: Request) {
  return withUser(async (user) => {
    const { answers } = await parseBody(request, schema);
    const repo = getRepository();
    // Answers to an earlier version of the survey stay in the record as they
    // were: they are not deleted or converted, and the PS50 score never reads them.
    const earlier = Object.fromEntries(
      Object.entries((await repo.getPreSurvey(user.id))?.answers ?? {}).filter(
        ([key]) => !key.startsWith('PS50_'),
      ),
    );
    const survey = await repo.savePreSurvey(user.id, { ...earlier, ...answers });
    await logEvent({
      userId: user.id,
      sessionId: null,
      eventType: 'task_started',
      metadata: { kind: 'pre_survey' },
    });
    return { survey };
  });
}
