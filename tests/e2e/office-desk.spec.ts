import { expect, test } from '@playwright/test';
import {
  completePreSurvey,
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

test('the desk shows the five departments, and only Sales and HR can start', async ({ page }) => {
  await signUpAsNewStudent(page, 'Desk Reader');
  await page.goto('/office');

  for (const slug of ['sales', 'human-resources']) {
    const card = await openDesk(page, slug);
    await expect(card).toHaveAttribute('data-department-status', 'playable');
    await expect(card.getByRole('button', { name: 'Start bootcamp' })).toBeVisible();
  }
  for (const slug of ['marketing', 'product-management', 'strategy']) {
    const card = page.locator(`[data-department-slug="${slug}"]`);
    await expect(card).toHaveAttribute('data-department-status', 'coming_soon');
    await expect(card).toContainText('Coming soon');
    await expect(card.getByRole('button', { name: /Start bootcamp|Resume bootcamp|Continue/ })).toHaveCount(0);
  }

  // A department that is not playable cannot be started by asking directly either.
  const refused = await page.request.post('/api/sessions', { data: { departmentSlug: 'marketing' } });
  expect(refused.ok()).toBe(false);

  // Escape closes the desk.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('department-desk')).toHaveCount(0);
});

test('no more than three departments can be selected', async ({ page }) => {
  await signUpAsNewStudent(page, 'Picky Student');
  await page.goto('/office');
  await openDesk(page, 'sales');

  const pick = (slug: string) =>
    page.locator(`[data-department-slug="${slug}"] button[aria-pressed]`);
  for (const slug of ['sales', 'human-resources', 'marketing', 'strategy']) {
    await pick(slug).click();
  }
  await expect(page.getByText('Three is the limit')).toBeVisible();
  await expect(page.locator('[data-department-slug] button[aria-pressed="true"]')).toHaveCount(3);
  await expect(pick('strategy')).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: 'Save selection' }).click();
  await expect(page.getByText('Selection saved')).toBeVisible();

  // The API holds the same line.
  const tooMany = await page.request.post('/api/departments/selection', {
    data: { departmentSlugs: ['sales', 'human-resources', 'marketing', 'strategy'] },
  });
  expect(tooMany.ok()).toBe(false);
});

test('starting a bootcamp counts as choosing its department, within the three', async ({ page }) => {
  await signUpAsNewStudent(page, 'Full Hands');
  await page.goto('/office');

  // Three other departments already chosen: a fourth cannot be started.
  const chose = await page.request.post('/api/departments/selection', {
    data: { departmentSlugs: ['marketing', 'strategy', 'product-management'] },
  });
  expect(chose.ok()).toBe(true);
  expect((await page.request.post('/api/sessions', { data: { departmentSlug: 'sales' } })).ok()).toBe(false);
  await page.reload();
  const card = await openDesk(page, 'sales');
  await card.getByRole('button', { name: 'Start bootcamp' }).click();
  await expect(page.getByText('Three is the limit')).toBeVisible();
  await expect(page.getByTestId('department-desk')).toBeVisible();

  // With room left, starting Sales adds it to the selection.
  await page.request.post('/api/departments/selection', { data: { departmentSlugs: ['marketing'] } });
  await startBootcamp(page, 'sales');
  await page.getByTestId('close-work').click();
  await openDesk(page, 'sales');
  await expect(page.locator('[data-department-slug="sales"] button[aria-pressed]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-department-slug="marketing"] button[aria-pressed]')).toHaveAttribute('aria-pressed', 'true');
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
  for (const [locale, title, start] of [
    ['ko', 'BITE 리셉션', '부트캠프 시작'],
    ['ja', 'BITE 受付', 'ブートキャンプを始める'],
    ['en', 'BITE Reception', 'Start bootcamp'],
  ] as const) {
    await context.addCookies([{ name: 'xpass-locale', value: locale, url: page.url() }]);
    await page.goto('/office?select=1');
    const desk = page.getByTestId('department-desk');
    await expect(desk).toContainText(title);
    await expect(
      desk.locator('[data-department-slug="sales"]').getByRole('button', { name: start }),
    ).toBeVisible();
  }
});
