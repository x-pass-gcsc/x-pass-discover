import { expect, test, type Page } from '@playwright/test';
import { TEST_PASSWORD, signIn, signOut, signUp, uniqueEmail } from './helpers/app';

/**
 * Passwords and My Page. A password, once set, is required; changing it needs
 * the current one, and ends every other browser's session.
 */

async function tryPassword(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByRole('button', { name: 'Enter BITE' }).click();
}

test('a wrong password is refused, and the right one signs in', async ({ page }) => {
  const email = uniqueEmail('password');
  await signUp(page, { email, displayName: 'Ren Ito' });
  await signOut(page);

  await tryPassword(page, email, 'not-the-password');
  const error = page.getByTestId('auth-error');
  await expect(error).toContainText('email or password is incorrect');
  expect(page.url()).toContain('/login');

  await page.getByTestId('password').fill('');
  await page.getByRole('button', { name: 'Enter BITE' }).click();
  await expect(error, 'a blank password is no way round it').toContainText('incorrect');

  await signIn(page, email);
  await expect(page.getByTestId('account-menu')).toContainText('Ren Ito');
});

test('sign-up refuses mismatched passwords before sending anything', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(uniqueEmail('mismatch'));
  await page.getByLabel('Display name').fill('Mismatch');
  await page.getByTestId('password').fill('first-password');
  await page.getByTestId('password-confirm').fill('second-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByTestId('auth-error')).toContainText('do not match');
  expect(page.url()).toContain('/signup');
});

test('My Page renames the account and changes its password', async ({ page }) => {
  const email = uniqueEmail('mypage');
  await signUp(page, { email, displayName: 'Before Rename' });

  await page.getByTestId('mypage-link').click();
  await page.waitForURL('**/mypage');
  await expect(page.getByTestId('mypage-email')).toHaveText(email);
  await expect(page.getByTestId('password-badge')).toHaveText('Set');

  await page.getByTestId('display-name').fill('After Rename');
  await page.getByTestId('save-profile').click();
  await expect(page.getByTestId('profile-status')).toHaveText('Display name updated.');
  await expect(page.getByTestId('account-menu')).toContainText('After Rename');

  const form = page.getByTestId('password-form');
  await page.getByTestId('current-password').fill('a-wrong-guess');
  await page.getByTestId('new-password').fill('brand-new-password');
  await page.getByTestId('new-password-confirm').fill('brand-new-password');
  await form.getByTestId('save-password').click();
  await expect(page.getByTestId('password-status')).toContainText('current password is incorrect');

  await page.getByTestId('current-password').fill(TEST_PASSWORD);
  await form.getByTestId('save-password').click();
  await expect(page.getByTestId('password-status')).toContainText('Password changed');

  // This browser stays signed in.
  await page.reload();
  await expect(page.getByTestId('account-menu')).toContainText('After Rename');

  await signOut(page);
  await tryPassword(page, email, TEST_PASSWORD);
  await expect(page.getByTestId('auth-error')).toContainText('incorrect');
  await signIn(page, email, 'brand-new-password');
  await expect(page.getByTestId('account-menu')).toContainText('After Rename');
});

test('changing the password signs out every other browser', async ({ page, browser }) => {
  const email = uniqueEmail('elsewhere');
  await signUp(page, { email, displayName: 'Two Browsers' });

  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await signIn(other, email);
  await other.goto('/mypage');
  await expect(other.getByTestId('mypage-email')).toHaveText(email);

  await page.goto('/mypage');
  await page.getByTestId('current-password').fill(TEST_PASSWORD);
  await page.getByTestId('new-password').fill('changed-elsewhere');
  await page.getByTestId('new-password-confirm').fill('changed-elsewhere');
  await page.getByTestId('save-password').click();
  await expect(page.getByTestId('password-status')).toContainText('Password changed');

  await other.goto('/mypage');
  await other.waitForURL('**/login');
  await otherContext.close();
});

test('My Page is for signed-in students only', async ({ page }) => {
  await page.goto('/mypage');
  await page.waitForURL('**/login');
});
