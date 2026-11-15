import { expect, test } from '@playwright/test';
import { signUpAsNewStudent, startBootcamp } from './helpers/app';

/**
 * The AI senpai: a chat with a senior colleague that can be opened from any
 * signed-in page. The suite runs it in offline mode (no API key), which is
 * also what a fresh checkout gets, so the window must say so.
 */

test('the senpai can be asked from any page and remembers the chat', async ({ page }) => {
  await signUpAsNewStudent(page, 'Senpai Asker');

  // The lobby is the first signed-in page.
  const openButton = page.getByTestId('senpai-open');
  await expect(openButton).toBeVisible();
  await openButton.click();

  const panel = page.getByTestId('senpai-panel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-provider', 'mock');
  await expect(page.getByTestId('senpai-offline')).toBeVisible();
  await expect(panel.getByText('Hi Senpai Asker!')).toBeVisible();

  // A suggested question gets a streamed answer.
  await panel.getByRole('button', { name: 'How should I choose a department?' }).click();
  await expect(page.getByTestId('senpai-student')).toHaveText('How should I choose a department?');
  await expect(page.getByTestId('senpai-reply').last()).toContainText('You pick two');

  // A typed question, sent with Enter.
  await page.getByTestId('senpai-input').fill('Any tips for the meeting with the buyer?');
  await page.getByTestId('senpai-input').press('Enter');
  await expect(page.getByTestId('senpai-student')).toHaveCount(2);
  await expect(page.getByTestId('senpai-reply').last()).toContainText('hypothesis');
  await expect(page.getByTestId('senpai-send')).toBeDisabled();

  // Closing and reloading keeps the conversation in this browser.
  await page.getByTestId('senpai-close').click();
  await expect(panel).toBeHidden();
  await page.reload();
  await page.getByTestId('senpai-open').click();
  await expect(page.getByTestId('senpai-student')).toHaveCount(2);

  // Start over clears it.
  await page.getByTestId('senpai-reset').click();
  await expect(page.getByTestId('senpai-student')).toHaveCount(0);
});

test('the senpai is there inside a bootcamp too, and typing does not walk', async ({ page }) => {
  await signUpAsNewStudent(page, 'Office Senpai');
  await startBootcamp(page, 'sales');

  await page.goto('/office');
  await expect(page.getByTestId('office-canvas').locator('canvas')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('senpai-open').click();

  // WASD lands in the question box, not on the player.
  const input = page.getByTestId('senpai-input');
  await input.pressSequentially('wasd');
  await expect(input).toHaveValue('wasd');

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('senpai-panel')).toBeHidden();
});

test('the senpai endpoint needs a signed-in student and a question', async ({ page, request }) => {
  const anonymous = await request.post('/api/senpai', {
    data: { turns: [{ role: 'student', content: 'hello' }] },
  });
  expect(anonymous.status()).toBe(401);

  await signUpAsNewStudent(page, 'Senpai API');
  const empty = await page.request.post('/api/senpai', { data: { turns: [] } });
  expect(empty.status()).toBe(400);

  const tooLong = await page.request.post('/api/senpai', {
    data: { turns: [{ role: 'student', content: 'x'.repeat(2001) }] },
  });
  expect(tooLong.status()).toBe(400);

  const ok = await page.request.post('/api/senpai', {
    data: { turns: [{ role: 'student', content: 'hello' }], path: '/start' },
  });
  expect(ok.status()).toBe(200);
  expect(ok.headers()['x-senpai-provider']).toBe('mock');
  const text = await ok.text();
  expect(text.length).toBeGreaterThan(20);
  // The system prompt never comes back.
  expect(text).not.toContain('You are "AI Senpai"');
});
