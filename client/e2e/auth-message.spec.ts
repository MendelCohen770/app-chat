import { expect, test } from '@playwright/test';

const makeUser = (prefix: string) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  return {
    username: `${prefix}_${suffix}`,
    email: `${prefix}_${suffix}@example.com`,
    phone: `05${String(Math.floor(Math.random() * 10 ** 8)).padStart(8, '0')}`,
    password: 'Password1',
  };
};

const signup = async (
  page: Parameters<typeof test>[0]['page'],
  user: { username: string; email: string; phone: string; password: string },
) => {
  await page.goto('/signup');
  await page.fill('#username', user.username);
  await page.fill('#email', user.email);
  await page.fill('#phone', user.phone);
  await page.fill('#password', user.password);
  await page.fill('#confirmPassword', user.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/$/);
};

const login = async (
  page: Parameters<typeof test>[0]['page'],
  user: { username: string; password: string },
) => {
  await page.goto('/');
  await page.fill('#username', user.username);
  await page.fill('#password', user.password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/home$/);
};

const logout = async (page: Parameters<typeof test>[0]['page']) => {
  // Open side-menu in UserPanel (top-left hamburger).
  await page.locator('aside[aria-label="Contacts"] button[aria-haspopup="menu"]').click();
  // Logout is the second action in the side-menu popover.
  await page.getByRole('menuitem').nth(1).click();
  await expect(page).toHaveURL(/\/$/);
};

test('signup → login → send message → logout', async ({ page }) => {
  const receiver = makeUser('receiver');
  const sender = makeUser('sender');
  const text = `hello from playwright ${Date.now()}`;

  await signup(page, receiver);
  await signup(page, sender);

  await login(page, sender);

  // Pick receiver from contacts list.
  await page.getByRole('option', { name: new RegExp(receiver.username, 'i') }).click();

  // Send a message.
  const input = page.locator('#message-input');
  await input.fill(text);
  await input.press('Enter');

  // Verify the newly sent message appears.
  await expect(page.getByText(text)).toBeVisible();

  await logout(page);
  await expect(page.locator('#username')).toBeVisible();
});
