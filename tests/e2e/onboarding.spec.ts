import { expect, test } from '@playwright/test';
import { completePreSurvey, signIn, signOut, signUp, uniqueEmail } from './helpers/app';

/**
 * A new account's first screen is the X-PASS Discover lobby, and its START
 * button is the way into the pre-survey. Once the pre-survey is done the
 * student is past day one, and signing in goes to the office instead.
 */
test('a new account opens in the lobby, and START begins the pre-survey', async ({ page }) => {
  const email = uniqueEmail('onboarding');
  await signUp(page, { email, displayName: 'First Day' });

  const lobby = page.getByTestId('start-lobby');
  await expect(lobby).toBeVisible();
  await expect(lobby).toContainText('INTRO');
  await expect(lobby).toContainText('01 / 04');
  // The way out is still on screen.
  await expect(page.getByTestId('account-menu')).toContainText('First Day');

  await page.getByTestId('start-lobby-next').click();
  await page.waitForURL('**/pre-survey');

  // Signing back in before finishing the survey still opens in the lobby.
  await signOut(page);
  await signIn(page, email);
  await expect(page.getByTestId('start-lobby')).toBeVisible();

  // After the survey, the lobby is behind them.
  await completePreSurvey(page);
  await signOut(page);
  await signIn(page, email);
  // Sign-in heads for the lobby, which sends a returning student on to the office.
  await page.waitForURL('**/office');
  await page.goto('/start');
  await page.waitForURL('**/office');
});

/**
 * The pre-survey API takes exactly the 50 PS50 answers, each a whole number
 * from 1 to 5. Anything else is refused with 400 and nothing is saved — which
 * also means answers to the retired surveys can no longer be written through
 * it. (The notice for students who answered an earlier version is covered by
 * `npm run verify:rubric`, since such a record cannot be created here.)
 */
test('the pre-survey API accepts only the 50 answers, each 1 to 5', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('survey-api'), displayName: 'Strict Survey' });
  const full = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [`PS50_${String(i + 1).padStart(2, '0')}`, 3]),
  );
  const post = (answers: Record<string, unknown>) =>
    page.request.post('/api/pre-survey', { data: { answers } });

  const { PS50_50: _dropped, ...fortyNine } = full;
  for (const [label, answers] of [
    ['an earlier survey\'s keys', { SAL_01: 5, MKT_01: 2 }],
    ['49 answers', fortyNine],
    ['an answer of 6', { ...full, PS50_07: 6 }],
    ['an answer of 0', { ...full, PS50_07: 0 }],
    ['an answer of 2.5', { ...full, PS50_07: 2.5 }],
    ['an answer as text', { ...full, PS50_07: '3' }],
    ['an extra key', { ...full, PS50_51: 3 }],
  ] as const) {
    const response = await post(answers);
    expect(response.status(), `${label} should be refused`).toBe(400);
  }

  // Nothing was saved: the report has no LIKE, and the lobby still opens.
  await page.goto('/report');
  await expect(page.getByRole('img', { name: 'Sales LIKE not recorded' })).toBeVisible();
  await page.goto('/start');
  await expect(page.getByTestId('start-lobby')).toBeVisible();

  // All 50, each 1–5, is saved and scored.
  expect((await post(full)).ok()).toBe(true);
  await page.goto('/report');
  await expect(page.getByRole('img', { name: 'Sales LIKE 50 out of 100' })).toBeVisible();
  await expect(page.getByTestId('new-survey-notice')).toHaveCount(0);
});

test('a student who has not taken any pre-survey sees no new-survey notice', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('no-survey'), displayName: 'No Survey Yet' });
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByTestId('new-survey-notice')).toHaveCount(0);
});
