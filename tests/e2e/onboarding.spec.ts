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

/**
 * Picking a score moves on by itself after a beat. A second click on the same
 * question just as that happens must not move on twice: it used to skip the
 * next question, and the survey then could not be submitted.
 */
test('clicking a score twice as the survey moves on does not skip a question', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('double-click'), displayName: 'Quick Clicker' });
  await page.goto('/pre-survey');
  await page.locator('[data-question-key="PS50_01"]').waitFor();
  // Click "5", then the same (old) button again around the moment it moves on.
  const seen = await page.evaluate(async () => {
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const question = document.querySelector('[data-question-key]')!;
      seen.push(question.getAttribute('data-question-key') ?? '');
      const five = [...question.querySelectorAll('button')].find((b) => b.textContent?.trim() === '5')!;
      five.click();
      await new Promise((resolve) => setTimeout(resolve, 220));
      five.click();
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
    return seen;
  });
  expect(seen).toEqual(['PS50_01', 'PS50_02', 'PS50_03', 'PS50_04']);
});

/**
 * Submitting the pre-survey shows its result straight away: every job's
 * Pre-LIKE with its areas, and the jobs recommended to explore first.
 */
test('the pre-survey result shows the analysis and the recommended jobs', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('survey-result'), displayName: 'Result Reader' });
  // Sales 5s, HR 4s, Strategy 3s, Marketing 2s, PM 1s → 100, 75, 50, 25, 0.
  const byDepartment: Record<string, number> = { '0': 2, '1': 3, '2': 5, '3': 4, '4': 1 };
  const scores = Object.fromEntries(
    Array.from({ length: 50 }, (_, i) => [
      `PS50_${String(i + 1).padStart(2, '0')}`,
      byDepartment[String(Math.floor(i / 10))],
    ]),
  );
  await completePreSurvey(page, scores, { continueToOffice: false });

  const recommended = page.getByTestId('survey-result-recommended');
  await expect(recommended.locator('[data-recommended]')).toHaveCount(3);
  for (const slug of ['sales', 'human-resources', 'strategy']) {
    await expect(recommended.locator(`[data-recommended="${slug}"]`)).toBeVisible();
  }
  // Playable jobs can be tried in the office; one that is not says so.
  await expect(
    recommended.locator('[data-recommended="sales"]').getByRole('button', { name: 'Try it in the office' }),
  ).toBeVisible();
  await expect(recommended.locator('[data-recommended="strategy"]')).toContainText('Coming soon');
  // Three areas for each recommended job, scored on the same 0–100 scale.
  await expect(recommended.getByRole('img', { name: /^Sales — .*: 100 out of 100$/ })).toHaveCount(3);

  const all = page.getByTestId('survey-result-all');
  for (const [name, value] of [['Sales', 100], ['Human Resources', 75], ['Strategy', 50], ['Marketing', 25], ['Product Management', 0]] as const) {
    await expect(all.getByRole('img', { name: `${name} Pre-LIKE ${value} / 100` })).toBeVisible();
  }

  await page.getByTestId('result-continue').click();
  await page.waitForURL('**/office');
});
