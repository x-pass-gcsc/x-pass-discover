import { parseBody, withUser } from '@/lib/api';
import { savePostSurveyDraft } from '@/services/post-survey/post-survey-service';
import { z } from 'zod';

/**
 * Saves the signed-in student's post-survey draft. The answers are checked
 * against their own confirmed plan; who they belong to comes from the session
 * cookie only, so no request can write another student's survey.
 */
export async function PUT(request: Request) {
  return withUser(async (user) => {
    const body = await parseBody(request, z.unknown());
    const survey = await savePostSurveyDraft(user.id, body);
    return { status: survey.status, updatedAt: survey.updatedAt };
  });
}
