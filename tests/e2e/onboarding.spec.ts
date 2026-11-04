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
 * A student who answered an earlier version of the pre-survey is told that a
 * new one is waiting, until they take it.
 */
test('an earlier pre-survey respondent is told about the new one', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('earlier-survey'), displayName: 'Earlier Respondent' });
  // Answers saved under the retired 75-statement keys, as before the switch.
  const saved = await page.request.post('/api/pre-survey', {
    data: { answers: { SAL_01: 5, MKT_01: 2 } },
  });
  expect(saved.ok()).toBe(true);

  await page.goto('/welcome');
  const notice = page.getByTestId('new-survey-notice');
  await expect(notice).toContainText('A new pre-survey is available');
  await notice.getByRole('button', { name: 'Take the new pre-survey' }).click();
  await page.waitForURL('**/pre-survey');

  await completePreSurvey(page);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByTestId('new-survey-notice')).toHaveCount(0);
  await page.goto('/welcome');
  await expect(page.getByTestId('new-survey-notice')).toHaveCount(0);
});

test('a student who has not taken any pre-survey sees no new-survey notice', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('no-survey'), displayName: 'No Survey Yet' });
  await page.goto('/welcome');
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await expect(page.getByTestId('new-survey-notice')).toHaveCount(0);
});
