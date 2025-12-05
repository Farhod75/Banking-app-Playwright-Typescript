import { test as base, expect, APIRequestContext, Page } from '@playwright/test';

type User = {
  username: string;
  password: string;
  name: string;
};

type Fixtures = {
  userAlice: User;
  uiLogin: () => Promise<void>;
  apiContext: APIRequestContext;
};

export const test = base.extend<Fixtures>({
  userAlice: async ({}, use) => {
    await use({
      username: 'alice',
      password: 'password123',
      name: 'Alice Doe',
    });
  },

  apiContext: async ({ playwright, baseURL }, use) => {
    const apiContext = await playwright.request.newContext({
      baseURL,
    });
    await use(apiContext);
    await apiContext.dispose();
  },

  uiLogin: async ({ page, userAlice, baseURL }, use) => {
    await use(async () => {
      await page.goto('/');
      await page.getByLabel('Username:').fill(userAlice.username);
      await page.getByLabel('Password:').fill(userAlice.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByText('Logged in as:')).toBeVisible();
      await expect(page.getByText(userAlice.name)).toBeVisible();
    });
  },
});

export const expectEx = expect;