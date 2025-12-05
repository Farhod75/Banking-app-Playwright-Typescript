import { test, expectEx as expect } from '../fixtures/bank.fixtures';

test('@smoke UI - user can login and see accounts', async ({ page, uiLogin }) => {
  await uiLogin();

  const rows = page.locator('#accounts-table-body tr');
  await expect(rows).toHaveCount(2); // Alice has 2 accounts in server.js
});