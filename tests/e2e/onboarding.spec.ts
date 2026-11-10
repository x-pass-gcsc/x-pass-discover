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

  // Nothing was saved: the report counts no pre-survey, and the lobby still opens.
  await page.goto('/report');
  await expect(page.locator('[data-report-step="pre-survey"]')).toHaveAttribute('data-report-step-state', 'todo');
  await page.goto('/start');
  await expect(page.getByTestId('start-lobby')).toBeVisible();

  // All 50, each 1–5, is saved and scored as a complete survey — but the
  // score itself stays hidden until the final report opens.
  expect((await post(full)).ok()).toBe(true);
  await page.goto('/report');
  await expect(page.locator('[data-report-step="pre-survey"]')).toHaveAttribute('data-report-step-state', 'done');
  await expect(page.getByRole('img', { name: /LIKE \d+ out of 100/ })).toHaveCount(0);
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
 * Submitting the pre-survey shows no result: the student goes straight to the
 * reception desk to choose departments, and the result — scores, areas,
 * recommended jobs — stays withheld until the final report opens. Asking for
 * it by address is refused on the server, not just unlinked.
 */
test('the pre-survey result is withheld until the final report opens', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('survey-result'), displayName: 'Result Reader' });
  await completePreSurvey(page);

  // Straight to choosing departments, with nothing scored on screen.
  await expect(page.getByTestId('department-desk')).toBeVisible();
  await expect(page.getByTestId('survey-result-recommended')).toHaveCount(0);
  await expect(page.getByTestId('explore-candidate')).toHaveCount(0);
  await expect(page.getByText(/Pre-LIKE/)).toHaveCount(0);

  // The result page by address: sent to the locked report instead.
  await page.goto('/pre-survey/result');
  await page.waitForURL('**/report');
  await expect(page.getByTestId('report-locked')).toBeVisible();
  await expect(page.getByTestId('survey-result-recommended')).toHaveCount(0);
  await expect(page.getByTestId('survey-result-all')).toHaveCount(0);

  // The report itself: what is left to do, and no analysis.
  await expect(page.locator('[data-report-step="pre-survey"]')).toHaveAttribute('data-report-step-state', 'done');
  await expect(page.locator('[data-report-step="departments"]')).toContainText('0/3');
  await expect(page.getByTestId('pre-like-breakdown')).toHaveCount(0);
  await expect(page.getByRole('img', { name: /LIKE \d+ out of 100/ })).toHaveCount(0);
  await expect(page.getByText(/Pre-LIKE/)).toHaveCount(0);

  // Nothing the server renders for either page carries a score.
  for (const path of ['/report', '/pre-survey/result']) {
    const html = await (await page.request.get(path)).text();
    expect(html, `${path} should not carry Pre-LIKE`).not.toContain('Pre-LIKE');
    expect(html).not.toContain('pre-like-breakdown');
    expect(html).not.toContain('survey-result-recommended');
  }
});
