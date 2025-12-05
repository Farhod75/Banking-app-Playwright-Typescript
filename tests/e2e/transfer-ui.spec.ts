import {
  test,
  expectEx as expect,
  getAccountBalances,
  getTransferHistoryTexts,
} from '../fixtures/bank.fixtures';

test(
  '@e2e @regression UI - user can transfer between own accounts and see updated balances and history',
  async ({ page, uiLogin }) => {
    await uiLogin();

    // We land on /accounts after login
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);

    const beforeBalances = await getAccountBalances(page);
    const accountIds = Object.keys(beforeBalances).map(Number);
    expect(accountIds.length).toBeGreaterThanOrEqual(2);

    const fromId = accountIds[0];
    const toId = accountIds[1];

    // Go to transfer – wait for the form to be visible, not the heading
    await page.goto('/transfer');
    await expect(page.locator('#from-account-select')).toBeVisible();

    await page.locator('#from-account-select').selectOption(String(fromId));
    await page.locator('#to-account-select').selectOption(String(toId));
    await page.locator('#amount').fill('50');

    await page.getByRole('button', { name: 'Submit Transfer' }).click();

    // Wait for success message or redirect
    await expect(page.locator('#transfer-success')).toBeVisible({ timeout: 5000 });

    // Back to /accounts
    await page.goto('/accounts');
    await expect(page.locator('#accounts-table-body tr')).toHaveCount(2);

    const afterBalances = await getAccountBalances(page);

    expect(afterBalances[fromId]).toBe(beforeBalances[fromId] - 50);
    expect(afterBalances[toId]).toBe(beforeBalances[toId] + 50);

    // Check transfer history
    await page.goto('/transfers');
    await expect(page.locator('#transfer-history')).toBeVisible();

    const history = await getTransferHistoryTexts(page);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toContain('$50');
    expect(history[0]).toContain(`${fromId} -> ${toId}`);
  },
);

test('@e2e @functional UI - transfer fails with insufficient funds and shows error', async ({ page, uiLogin }) => {
  await uiLogin();

  const balances = await getAccountBalances(page);
  const accountIds = Object.keys(balances).map(Number);
  expect(accountIds.length).toBeGreaterThanOrEqual(2);

  const fromId = accountIds[0];
  const toId = accountIds[1];

  const hugeAmount = balances[fromId] + 1_000_000;

  await page.locator('#from-account').selectOption(String(fromId));
  await page.locator('#to-account').selectOption(String(toId));
  await page.locator('#amount').fill(String(hugeAmount));

  await page.getByRole('button', { name: 'Submit Transfer' }).click();

  const error = page.locator('#transfer-error');
  await expect(error).toContainText('Insufficient funds');
});