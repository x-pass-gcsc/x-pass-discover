import { expect, test, type Page } from '@playwright/test';
import { confirmDepartments, signUpAsNewStudent, surveyAnswers } from './helpers/app';

/**
 * The post-survey: who may answer it, saving and submitting it, and the report
 * it opens. Only Sales and HR have playable scenarios, so a student's three
 * departments are marked completed through the test-only fixture route (it
 * exists only on the Playwright server's throwaway in-memory store).
 */

const DEPT = { a1: 6, a2: 5, a3: 4, a4: 7, a5: 4, a6: ['decision'], a7: ['data'] };

function fullAnswers(plan: string[]) {
  return {
    departmentAnswers: {
      [plan[0]]: { ...DEPT, a1: 7, a8: 'The negotiation changed my mind.' },
      [plan[1]]: { ...DEPT, a1: 3 },
      [plan[2]]: { ...DEPT, a1: 5 },
    },
    comparisonAnswers: {
      b1Mode: 'ranked',
      b1Order: [plan[2], plan[0], plan[1]],
      b2: ['process', 'learn'],
      b3: 'yes',
      b3Text: 'I like structured problems.',
      b4: ['strategy', 'product-management'],
      b5: 3,
      b6: 6,
      b7: ['practitioners'],
    },
    experienceAnswers: { c1: 6, c2: 'some-more', c2Detail: 'Unit economics', c3: 'not_used', c4: 5, c5: 'right' },
  };
}

/** Pre-survey + confirmed plan (Sales and HR chosen) → the plan's three slugs. */
async function planFor(page: Page): Promise<string[]> {
  const recommended = await confirmDepartments(page, ['sales', 'human-resources']);
  return ['sales', 'human-resources', recommended!];
}

const complete = (page: Page, departmentSlugs: string[]) =>
  page.request.post('/api/test-fixtures/complete-departments', { data: { departmentSlugs } });
const saveDraft = (page: Page, body: unknown) => page.request.put('/api/post-survey', { data: body });
const submit = (page: Page, body: unknown) => page.request.post('/api/post-survey/submit', { data: body });

test('the post-survey stays locked until the pre-survey, the plan and all three departments are done', async ({ page }) => {
  await signUpAsNewStudent(page, 'Not Yet');

  // No pre-survey.
  await page.goto('/post-survey');
  await expect(page.getByTestId('post-locked')).toContainText('Finish the pre-survey first.');
  let response = await saveDraft(page, fullAnswers(['sales', 'human-resources', 'strategy']));
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe('post_survey_locked');

  // Pre-survey, but no plan.
  expect((await page.request.post('/api/pre-survey', { data: { answers: surveyAnswers(4) } })).ok()).toBe(true);
  await page.goto('/post-survey');
  await expect(page.getByTestId('post-locked')).toContainText('Confirm your three departments');

  // Plan, two of three completed.
  const plan = await planFor(page);
  expect((await complete(page, plan.slice(0, 2))).ok()).toBe(true);
  await page.goto('/post-survey');
  const locked = page.getByTestId('post-locked');
  await expect(locked.locator('[data-post-department-state="completed"]')).toHaveCount(2);
  await expect(locked.locator(`[data-post-department="${plan[2]}"]`)).toHaveAttribute('data-post-department-state', 'pending');
  response = await submit(page, fullAnswers(plan));
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe('post_survey_locked');
  // Neither the office nor the report offers it yet.
  await page.goto('/office');
  await expect(page.getByTestId('post-survey-callout')).toHaveCount(0);
  await page.goto('/report');
  await expect(page.locator('[data-report-step="post-survey"]')).toHaveAttribute('data-report-step-state', 'unavailable');
  // And the fixture route touches only the student's own plan.
  expect((await complete(page, ['marketing', 'strategy'].filter((s) => !plan.includes(s)).slice(0, 1))).status()).toBe(400);
});

test('after three departments the survey is answered, saved, restored, submitted, and opens the report', async ({ page }) => {
  await signUpAsNewStudent(page, 'Survey Taker');
  const plan = await planFor(page);
  expect((await complete(page, plan)).ok()).toBe(true);

  // The office and the locked report point to it.
  await page.goto('/office');
  await expect(page.getByTestId('post-survey-callout')).toBeVisible();
  await page.goto('/report');
  await expect(page.getByTestId('report-locked')).toBeVisible();
  await expect(page.locator('[data-report-step="post-survey"]')).toHaveAttribute('data-report-step-state', 'ready');
  // The pre-survey result is still withheld.
  await expect(page.getByTestId('pre-like-breakdown')).toHaveCount(0);

  // The form: an answer is saved and comes back after a reload.
  await page.goto('/post-survey');
  await page.getByTestId('post-start').click();
  const first = page.locator(`[data-department-answers="${plan[0]}"]`);
  await expect(first).toBeVisible();
  await first.locator(`fieldset[data-question="${plan[0]}.a1"] label`).filter({ hasText: /^6$/ }).click();
  await page.getByTestId('post-save').click();
  await expect(page.getByTestId('post-save-state')).toHaveText('Saved');
  await page.reload();
  await page.getByTestId('post-start').click();
  await expect(page.locator(`input[name="${plan[0]}.a1"][value="6"]`)).toBeChecked();
  // Nothing from the pre-survey or the recommendation is shown here.
  await expect(page.getByTestId('post-survey-form')).not.toContainText(/Pre-LIKE|AI Recommendation/);

  // Incomplete: refused, with what is missing.
  const response = await submit(page, { departmentAnswers: { [plan[0]]: { a1: 6 } }, comparisonAnswers: {}, experienceAnswers: {} });
  expect(response.status()).toBe(400);
  const incomplete = await response.json();
  expect(incomplete.code).toBe('incomplete');
  expect(incomplete.details.map((d: { path: string }) => d.path)).toContain(`${plan[1]}.a1`);

  // A complete draft, kept apart by department, then submitted from the review step.
  expect((await saveDraft(page, fullAnswers(plan))).ok()).toBe(true);
  await page.reload();
  await page.getByTestId('post-start').click();
  await page.getByRole('button', { name: 'Review and submit' }).click();
  await expect(page.getByTestId('post-missing')).toHaveCount(0);
  await page.getByTestId('post-submit').click();
  await expect(page.getByTestId('post-done')).toBeVisible();

  // Final: no resubmission, no redraft, even at the same time.
  const [again, redraft] = await Promise.all([submit(page, fullAnswers(plan)), saveDraft(page, fullAnswers(plan))]);
  expect([again.status(), redraft.status()]).toEqual([400, 400]);
  expect((await again.json()).code).toBe('already_submitted');
  await page.reload();
  await expect(page.getByTestId('post-done')).toBeVisible();

  // The report opens, with the post-survey summary kept apart from Pre-LIKE
  // and SKILL FIT still NE.
  await page.goto('/report');
  await expect(page.getByTestId('report-locked')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'LIKE vs SKILL FIT' })).toBeVisible();
  const summary = page.getByTestId('post-survey-summary');
  await expect(summary.locator(`[data-post-summary="${plan[0]}"] [data-post-value="a1"]`)).toHaveText('7/7');
  await expect(summary.locator(`[data-post-summary="${plan[1]}"] [data-post-value="a1"]`)).toHaveText('3/7');
  await expect(summary.locator(`[data-post-summary="${plan[2]}"] [data-post-value="a4"]`)).toHaveText('7/7');
  await expect(page.getByTestId('post-summary-b1')).toContainText('1.');
  await expect(page.getByTestId('post-summary-b5')).toHaveText('3/7');
  await expect(summary).toContainText('no before/after change');
  await expect(page.getByText('NE').first()).toBeVisible();
  await expect(page.getByTestId('pre-like-breakdown')).toBeVisible();
});

test('answers are checked on the server and belong only to the signed-in student', async ({ page, browser }) => {
  await signUpAsNewStudent(page, 'Rule Checker');
  const plan = await planFor(page);
  expect((await complete(page, plan)).ok()).toBe(true);
  const good = fullAnswers(plan);
  const withDept = (patch: Record<string, unknown>) => ({
    ...good,
    departmentAnswers: { ...good.departmentAnswers, [plan[0]]: { ...DEPT, ...patch } },
  });

  for (const [label, body] of [
    ['a score of 8', withDept({ a1: 8 })],
    ['a score of 2.5', withDept({ a2: 2.5 })],
    ['three picks', withDept({ a6: ['research', 'decision', 'creation'] })],
    ['a repeated pick', withDept({ a7: ['data', 'data'] })],
    ['"none" with another pick', withDept({ a6: ['none', 'decision'] })],
    ['a department outside the plan', { ...good, departmentAnswers: { ...good.departmentAnswers, finance: DEPT } }],
    ['a ranking outside the plan', { ...good, comparisonAnswers: { ...good.comparisonAnswers, b1Order: ['finance', plan[0], plan[1]] } }],
    ['a ranking that repeats', { ...good, comparisonAnswers: { ...good.comparisonAnswers, b1Order: [plan[0], plan[0], plan[1]] } }],
    ['another student named in the body', { ...good, userId: 'someone-else' }],
  ] as const) {
    const response = await saveDraft(page, body);
    expect(response.status(), `${label} should be refused`).toBe(400);
  }

  // A second student cannot reach the first one's survey: they only ever see,
  // and write, their own — which is locked.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signUpAsNewStudent(otherPage, 'Other Student');
  const response = await otherPage.request.put('/api/post-survey', { data: good });
  expect(response.status()).toBe(400);
  expect((await response.json()).code).toBe('post_survey_locked');
  await otherPage.goto('/post-survey');
  await expect(otherPage.getByTestId('post-locked')).toBeVisible();
  await other.close();

  // The first student's survey is still theirs to submit.
  expect((await submit(page, good)).ok()).toBe(true);
});

test('the post-survey reads in Korean, Japanese and English', async ({ page, context }) => {
  await signUpAsNewStudent(page, 'Polyglot Survey');
  const plan = await planFor(page);
  expect((await complete(page, plan)).ok()).toBe(true);
  for (const [locale, title, question] of [
    ['ko', '세 부서 체험을 모두 마쳤습니다', '이번 업무 자체가 얼마나 흥미로웠나요?'],
    ['ja', '3つの部署をすべて終えました', '今回の業務そのものは、どれくらい面白かったですか？'],
    ['en', 'You finished all three departments', 'How interesting was the work itself?'],
  ] as const) {
    await context.addCookies([{ name: 'xpass-locale', value: locale, url: page.url() }]);
    await page.goto('/post-survey');
    await expect(page.getByTestId('post-intro')).toContainText(title);
    await page.getByTestId('post-start').click();
    await expect(page.getByTestId('post-survey-form')).toContainText(question);
  }
});
