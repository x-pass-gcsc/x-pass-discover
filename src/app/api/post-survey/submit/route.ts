import { z } from 'zod';
import { parseBody, withUser } from '@/lib/api';
import { submitPostSurvey } from '@/services/post-survey/post-survey-service';

/** Submits the signed-in student's post-survey, once. Missing answers → 400 with the list. */
export async function POST(request: Request) {
  return withUser(async (user) => {
    const body = await parseBody(request, z.unknown());
    const survey = await submitPostSurvey(user.id, body);
    return { status: survey.status, submittedAt: survey.submittedAt };
  });
}
