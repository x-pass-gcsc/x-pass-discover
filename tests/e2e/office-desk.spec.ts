import { expect, test } from '@playwright/test';
import {
  completePreSurvey,
  surveyAnswers,
  officeDepartment,
  openDesk,
  openWorkWindow,
  sessionIdFromUrl,
  signUp,
  signUpAsNewStudent,
  startBootcamp,
  stepButton,
  uniqueEmail,
} from './helpers/app';
import { completeCurrentStep } from './helpers/forms';

/**
 * Departments are chosen inside the office: the reception desk opens the
 * chooser over it, and starting or resuming a bootcamp switches the office to
 * that session without leaving the page. No bootcamp is ever deleted by
 * switching, so each department keeps its own progress.
 */

test('after the pre-survey a new student goes to the reception desk in the office', async ({ page }) => {
  await signUp(page, { email: uniqueEmail('desk-new'), displayName: 'New Visitor' });
  await page.getByTestId('start-lobby-next').click();
  await page.waitForURL('**/pre-survey');
  await completePreSurvey(page);

  // Straight to the reception desk; putting it away leaves a visitor in the
  // office, pointed at reception, with no work to open.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('department-desk')).toHaveCount(0);
  await expect(page).toHaveURL(/\/office$/);
  await expect(page.getByTestId('office-mission')).toHaveAttribute('data-quest-step', 'reception');
  await expect(officeDepartment(page)).toHaveAttribute('data-current-department', '');
  await expect(page.getByTestId('open-work')).toHaveCount(0);
  await expect(page.getByTestId('work-window')).toHaveCount(0);

  // The visitor's quest opens the reception desk.
  await page.getByTestId('visitor-open-desk').click();
  await expect(page.getByTestId('department-desk')).toBeVisible();
});

test('the desk shows all five departments, and nothing starts before the plan is confirmed', async ({ page }) => {
  await signUpAsNewStudent(page, 'Desk Reader');
  await page.goto('/office');
  await openDesk(page, 'sales');

  for (const slug of ['sales', 'human-resources']) {
    await expect(page.locator(`[data-department-slug="${slug}"]`)).toHaveAttribute('data-department-status', 'playable');
  }
  for (const slug of ['marketing', 'product-management', 'strategy']) {
    const card = page.locator(`[data-department-slug="${slug}"]`);
    await expect(card).toHaveAttribute('data-department-status', 'coming_soon');
    await expect(card).toContainText('Coming soon');
  }
  // Choosing comes first: no department offers to start yet.
  await expect(page.getByRole('button', { name: /Start bootcamp/ })).toHaveCount(0);
  // Without a pre-survey, no recommendation can be made.
  await expect(page.getByTestId('plan-survey-first')).toBeVisible();

  // And not over the API either.
  const unconfirmed = await page.request.post('/api/sessions', { data: { departmentSlug: 'sales' } });
  expect(unconfirmed.status()).toBe(400);
  expect((await unconfirmed.json()).code).toBe('plan_not_confirmed');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('department-desk')).toHaveCount(0);
});

test('two are chosen, one is recommended, and the three are confirmed', async ({ page }) => {
  await signUpAsNewStudent(page, 'Plan Maker');
  expect((await page.request.post('/api/pre-survey', { data: { answers: surveyAnswers(4) } })).ok()).toBe(true);
  await page.goto('/office');
  await openDesk(page, 'sales');

  const pick = (slug: string) => page.locator(`[data-department-slug="${slug}"] button[aria-pressed]`);
  const next = page.getByTestId('plan-see-recommendation');

  // One is not enough.
  await pick('sales').click();
  await expect(page.getByTestId('plan-count')).toContainText('1/2');
  await expect(next).toBeDisabled();

  // Two is; a third cannot be chosen.
  await pick('marketing').click();
  await expect(next).toBeEnabled();
  await pick('strategy').click();
  await expect(page.getByText('Two is the limit')).toBeVisible();
  await expect(page.locator('[data-department-slug] button[aria-pressed="true"]')).toHaveCount(2);
  await expect(pick('strategy')).toHaveAttribute('aria-pressed', 'false');

  // B: the recommendation is one of the other three, and nothing is scored.
  await next.click();
  const recommendation = page.getByTestId('plan-recommendation');
  await expect(recommendation).toBeVisible();
  const recommended = (await recommendation.getAttribute('data-recommended')) ?? '';
  expect(['product-management', 'strategy', 'human-resources']).toContain(recommended);
  await expect(recommendation).toContainText('AI Recommendation');
  await expect(page.getByTestId('department-desk')).not.toContainText(/Pre-LIKE|\d+ out of 100/);

  // C: the three, then confirm.
  await page.getByTestId('plan-review').click();
  const review = page.getByTestId('plan-review-three');
  await expect(review.locator('[data-plan-row="chosen"]')).toHaveCount(2);
  await expect(review.locator('[data-plan-row="recommended"]')).toHaveCount(1);
  await expect(review.locator('[data-plan-row="recommended"]')).toHaveAttribute('data-department-slug', recommended);
  // Marketing (chosen) has no job experience yet, and the desk says so.
  await expect(page.getByTestId('plan-coming-soon-note')).toContainText('Marketing');
  await page.getByTestId('plan-confirm').click();

  const plan = page.getByTestId('department-plan');
  await expect(plan).toHaveAttribute('data-plan-state', 'confirmed');
  await expect(plan.locator('[data-plan-role="chosen"]')).toHaveCount(2);
  await expect(plan.locator('[data-plan-role="recommended"]')).toHaveAttribute('data-department-slug', recommended);
  // Only Sales can start; Marketing (and the recommendation, unless it is HR)
  // waits for its scenario — and no session or completion is made up for it.
  await expect(page.locator('[data-department-slug="sales"]').getByRole('button', { name: 'Start bootcamp' })).toBeVisible();
  await expect(page.locator('[data-department-slug="marketing"]')).toContainText('coming soon');
  await expect(page.locator('[data-department-slug="marketing"]')).toHaveAttribute('data-department-session', 'none');

  // A reload keeps the confirmed plan.
  await page.goto('/office?select=1');
  await expect(page.getByTestId('department-plan')).toHaveAttribute('data-plan-state', 'confirmed');
  await expect(page.locator('[data-plan-role="recommended"]')).toHaveAttribute('data-department-slug', recommended);

  // The report stays locked: one plan, nothing completed, no post-survey.
  await page.goto('/report');
  await expect(page.getByTestId('report-locked')).toBeVisible();
  await expect(page.locator('[data-report-step="departments"]')).toContainText('0/3');
});

test('the plan rules hold over the API', async ({ page }) => {
  await signUpAsNewStudent(page, 'Rule Tester');
  const recommend = (userChosenSlugs: unknown) =>
    page.request.post('/api/departments/recommendation', { data: { userChosenSlugs } });
  const confirm = (userChosenSlugs: unknown, aiRecommendedSlug: unknown) =>
    page.request.post('/api/departments/selection', { data: { userChosenSlugs, aiRecommendedSlug } });

  // No pre-survey: no recommendation, no confirmation.
  const response = await recommend(['sales', 'marketing']);
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe('pre_survey_incomplete');
  expect((await confirm(['sales', 'marketing'], 'strategy')).status()).toBe(400);

  expect((await page.request.post('/api/pre-survey', { data: { answers: surveyAnswers(3) } })).ok()).toBe(true);

  // Exactly two different, known departments.
  for (const bad of [['sales'], ['sales', 'sales'], ['sales', 'marketing', 'strategy'], ['sales', 'finance']]) {
    expect((await recommend(bad)).status(), `${bad} should be refused`).toBe(400);
  }

  // The same answers and choices give the same recommendation.
  const first = (await (await recommend(['sales', 'human-resources'])).json()).aiRecommendedSlug;
  const second = (await (await recommend(['sales', 'human-resources'])).json()).aiRecommendedSlug;
  expect(first).toBe(second);
  expect(['marketing', 'strategy', 'product-management']).toContain(first);
  // Only the slug comes back — no scores.
  expect(Object.keys(await (await recommend(['sales', 'human-resources'])).json())).toEqual(['aiRecommendedSlug']);

  // A third department other than the recommendation cannot be slipped in.
  const other = ['marketing', 'strategy', 'product-management'].find((slug) => slug !== first)!;
  for (const tampered of [other, 'sales', 'finance']) {
    const refused = await confirm(['sales', 'human-resources'], tampered);
    expect(refused.status(), `${tampered} should be refused`).toBe(400);
  }
  expect((await confirm(['sales', 'human-resources', first], first)).status()).toBe(400);

  // The right one confirms, once.
  expect((await confirm(['sales', 'human-resources'], first)).ok()).toBe(true);
  const again = await confirm(['marketing', 'strategy'], 'sales');
  expect(again.status()).toBe(400);
  expect((await again.json()).code).toBe('already_confirmed');

  // New bootcamps only inside the plan, and only where a scenario exists.
  const outside = await page.request.post('/api/sessions', { data: { departmentSlug: other } });
  expect(outside.status()).toBe(400);
  expect((await outside.json()).code).toBe('not_in_plan');
  const unplayable = await page.request.post('/api/sessions', { data: { departmentSlug: first } });
  expect(unplayable.status(), 'a coming-soon department gets no session').toBe(400);
  expect((await unplayable.json()).code).toBe('not_playable');
  expect((await page.request.post('/api/sessions', { data: { departmentSlug: 'sales' } })).ok()).toBe(true);

  // The report is still locked.
  await page.goto('/report');
  await expect(page.getByTestId('report-locked')).toBeVisible();
});

test('switching department keeps every bootcamp and its progress', async ({ page }) => {
  await signUpAsNewStudent(page, 'Two Departments');

  // Sales: finish the first step.
  const salesId = await startBootcamp(page, 'sales');
  await completeCurrentStep(page);
  await expect(stepButton(page, 'sales-training')).toHaveAttribute('data-step-status', 'completed');
  await page.getByTestId('close-work').click();

  // Change to HR at the desk, in the same office page.
  let card = await openDesk(page, 'human-resources');
  await card.getByRole('button', { name: 'Start bootcamp' }).click();
  await expect(page.getByTestId('department-desk')).toHaveCount(0);
  await expect(officeDepartment(page)).toHaveAttribute('data-current-department', 'human-resources');
  await expect(page).not.toHaveURL(new RegExp(salesId));
  const hrId = sessionIdFromUrl(page);
  expect(hrId).not.toBe('');
  expect(hrId).not.toBe(salesId);
  // A new department starts on its own first day; Escape puts the welcome
  // card away and leaves the student in the office.
  await expect(page.getByTestId('department-intro')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('department-intro')).toHaveCount(0);

  // Sales is still there, in progress, with its finished step.
  card = await openDesk(page, 'sales');
  await expect(card).toHaveAttribute('data-department-session', 'in_progress');
  await expect(card).toContainText(/1\/\d+ steps/);
  await expect(page.locator('[data-department-slug="human-resources"]')).toHaveAttribute(
    'data-department-current',
    'true',
  );
  await card.getByRole('button', { name: 'Resume bootcamp' }).click();
  await expect(officeDepartment(page)).toHaveAttribute('data-current-department', 'sales');
  await expect(page).toHaveURL(new RegExp(`session=${salesId}`));
  await openWorkWindow(page);
  await expect(stepButton(page, 'sales-training')).toHaveAttribute('data-step-status', 'completed');
  await expect(stepButton(page, 'onboarding')).toHaveAttribute('data-step-unlocked', 'true');
  await page.getByTestId('close-work').click();

  // And HR is kept as well.
  card = await openDesk(page, 'human-resources');
  await expect(card).toHaveAttribute('data-department-session', 'in_progress');
  await card.getByRole('button', { name: 'Resume bootcamp' }).click();
  await expect(page).toHaveURL(new RegExp(`session=${hrId}`));
});

test('the old departments address opens the desk in the office', async ({ page }) => {
  await signUpAsNewStudent(page, 'Old Link');
  await page.goto('/departments');
  await page.waitForURL('**/office*');
  await expect(page.getByTestId('department-desk')).toBeVisible();
  // The address is cleaned up, so a reload does not reopen the desk.
  await expect(page).not.toHaveURL(/select=1/);
});

test('the desk follows the language', async ({ page, context }) => {
  await signUpAsNewStudent(page, 'Polyglot');
  expect((await page.request.post('/api/pre-survey', { data: { answers: surveyAnswers(4) } })).ok()).toBe(true);
  for (const [locale, title, next, aiBadge] of [
    ['ko', 'BITE 리셉션', '추천 부서 보기', 'AI 추천'],
    ['ja', 'BITE 受付', 'おすすめを見る', 'AI のおすすめ'],
    ['en', 'BITE Reception', 'See my recommendation', 'AI Recommendation'],
  ] as const) {
    await context.addCookies([{ name: 'xpass-locale', value: locale, url: page.url() }]);
    await page.goto('/office?select=1');
    const desk = page.getByTestId('department-desk');
    await expect(desk).toContainText(title);
    await expect(desk.getByRole('button', { name: next })).toBeVisible();
    // Choose two and see the recommendation, labelled in the language.
    await desk.locator('[data-department-slug="sales"] button[aria-pressed]').click();
    await desk.locator('[data-department-slug="human-resources"] button[aria-pressed]').click();
    await desk.getByRole('button', { name: next }).click();
    await expect(desk.getByTestId('plan-recommendation')).toContainText(aiBadge);
  }
});
