import { expect, test } from '@playwright/test';
import { signUpAsNewStudent, startBootcamp, stepButton } from './helpers/app';
import { completeCurrentStep } from './helpers/forms';

/**
 * The 2.5D office is the experience layer and nothing else. It is checked here
 * for the one thing it owes the rest of the app: that it boots, renders, and
 * raises its proximity prompt when the player walks up to someone — not for
 * business state, which it must never hold.
 *
 * Headless CI has no GPU, and the office renders roughly a million pixels a
 * frame in a software rasteriser, so this stays a smoke test on purpose.
 */

/** Phaser moves on held keys, so a tap would barely shift the player. */
async function walk(
  page: Parameters<typeof signUpAsNewStudent>[0],
  keys: string[],
  ms: number,
): Promise<void> {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  for (const key of keys) await page.keyboard.up(key);
}

test('the office boots and its prompt follows the player', async ({ page }) => {
  await signUpAsNewStudent(page, 'Office Visitor');

  await page.goto('/office');
  const canvas = page.getByTestId('office-canvas').locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  // Phaser has to have produced a real drawing surface, not a zero-size one.
  const size = await canvas.evaluate((node) => ({
    width: (node as HTMLCanvasElement).width,
    height: (node as HTMLCanvasElement).height,
  }));
  expect(size.width).toBeGreaterThan(0);
  expect(size.height).toBeGreaterThan(0);

  const prompt = page.getByTestId('office-prompt');
  // The player spawns just outside the reception desk's interaction radius.
  await expect(prompt).toHaveCount(0);

  await canvas.click();

  // The receptionist is two tiles north of the spawn point.
  await walk(page, ['ArrowUp', 'ArrowRight'], 400);
  await expect(prompt, 'walking up to reception should offer an interaction').toBeVisible({
    timeout: 20_000,
  });
  await expect(prompt).toContainText('Talk');

  // And walking away takes it back — the prompt tracks proximity, it does not
  // latch on the first time something is near. Due east stays inside the
  // lobby; south is the notification area, which raises its own prompt.
  await walk(page, ['ArrowRight'], 1500);
  await expect(prompt).toHaveCount(0);
});

/**
 * The office is where the bootcamp is played: the quest tracker names the
 * next step and where it is picked up, the work window opens over the office
 * without leaving it, and finishing a step pays out XP and moves the quest on.
 * XP is read from finished work only, so it is checked against that and
 * nothing else.
 */
test('work is done in the office, and finishing a step moves the quest on', async ({
  page,
}) => {
  await signUpAsNewStudent(page, 'Quest Runner');
  await startBootcamp(page, 'sales');

  // Starting a bootcamp lands in the office, on the first quest, at level 1.
  await expect(page).toHaveURL(/\/office\?session=/);
  const tracker = page.getByTestId('office-mission');
  await expect(tracker).toHaveAttribute('data-quest-step', 'sales-training');
  const hud = page.getByTestId('player-hud');
  await expect(hud).toHaveAttribute('data-level', '1');
  const xpBefore = Number(await hud.getAttribute('data-xp'));

  // The work window is open over the office, on the quest's step.
  await expect(page.getByTestId('work-window')).toBeVisible();
  await expect(stepButton(page, 'sales-training')).toHaveAttribute('aria-current', 'step');
  await completeCurrentStep(page);

  await expect(page.getByTestId('reward-burst').first()).toBeVisible();
  await expect
    .poll(async () => Number(await hud.getAttribute('data-xp')))
    .toBeGreaterThan(xpBefore);

  // Back in the office, the quest has moved on to the next step.
  await page.getByTestId('close-work').click();
  await expect(page.getByTestId('work-window')).toHaveCount(0);
  await expect(tracker).toHaveAttribute('data-quest-step', 'onboarding');

  // A reload keeps whatever was open: closed stays closed, open stays open.
  await page.getByTestId('open-work').click();
  await expect(page).toHaveURL(/work=1/);
  await page.reload();
  await expect(page.getByTestId('work-window')).toBeVisible();
  await expect(stepButton(page, 'onboarding')).toHaveAttribute('aria-current', 'step');
});
