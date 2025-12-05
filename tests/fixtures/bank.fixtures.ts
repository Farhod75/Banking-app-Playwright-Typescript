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
export async function getAccountBalances(page: Page) {
  const rows = page.locator('#accounts-table-body tr');
  const count = await rows.count();
  const result: Record<number, number> = {};

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const idText = await row.locator('td').nth(0).innerText();
    const balanceText = await row.locator('td').nth(2).innerText();

    const id = Number(idText.trim());
    const balance = Number(balanceText.trim());

    result[id] = balance;
  }

  return result;
}

export async function getTransferHistoryTexts(page: Page) {
  const items = page.locator('#transfer-history li');
  const count = await items.count();
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push((await items.nth(i).innerText()).trim());
  }
  return result;
}
export const expectEx = expect;